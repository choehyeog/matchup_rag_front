/**
 * 프론트엔드 신발 채점 엔진
 * 사용자 CFD 측정값 + 케이스 설문 답변(Q01-Q08) → 8개 항목별 점수
 *
 * 각 항목은 동일한 0-100 척도로 변환:
 *   userScore   : 사용자의 요구 위치 (0=극단 A, 100=극단 B)
 *   productScore: 신발 스펙의 위치
 *   matchScore  : 두 값의 근접도 → 전체 Fit Score에 반영
 */

import type { CfdMeasurement } from '@/types/api'

export interface ScoredDimension {
  key: string
  label: string
  userScore: number       // 0-100
  productScore: number    // 0-100
  matchScore: number      // 0-100, 가중치 평균의 원소
  weight: number          // 0-1 (합산 = 1)
  userDisplay: string     // 예: "10mm (RFS 착지)"
  productDisplay: string  // 예: "8mm"
}

/* ── 내부 헬퍼 ── */
function clamp(v: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)) }
function proximity(a: number, b: number, scale = 1.2) { return clamp(100 - Math.abs(a - b) * scale) }
function norm(v: number, min: number, max: number) { return clamp((v - min) / (max - min) * 100) }

/* ── Q01 → 족부 착지 패턴 ── */
function heelDrop(spec: Record<string, unknown>, answers: Record<string, string>): ScoredDimension {
  const dropMm = (spec.heel_to_toe_drop as number) ?? 8
  const productScore = norm(dropMm, 0, 16)

  let userScore = 37           // MFS 기본
  let userDisplay = 'MFS (6mm 목표)'
  const q01 = answers['Q01'] ?? ''
  if (q01.includes('Rearfoot')) { userScore = 62; userDisplay = 'RFS (10mm 목표)' }
  else if (q01.includes('Forefoot')) { userScore = 12; userDisplay = 'FFS (2mm 목표)' }

  return {
    key: 'heel_to_toe_drop',
    label: 'Heel-to-Toe Drop',
    userScore, productScore,
    matchScore: proximity(productScore, userScore),
    weight: 0,   // 아래서 동적 설정
    userDisplay,
    productDisplay: `${dropMm}mm`,
  }
}

/* ── Q02 + CFD → 안정성 구조 ── */
function stability(spec: Record<string, unknown>, answers: Record<string, string>): ScoredDimension {
  const raw = String(spec.stability_structure ?? 'neutral')
  const typeMap: Record<string, number> = {
    neutral: 15, 'mild-support': 55, 'motion-control': 90,
  }
  const productScore = typeMap[raw] ?? 15

  const q02 = answers['Q02'] ?? ''
  let userScore = 15; let userDisplay = 'Neutral stride'
  if (q02.includes('Overpronation')) { userScore = 70; userDisplay = 'Overpronation (지지 필요)' }
  else if (q02.includes('Supination')) { userScore = 10; userDisplay = 'Supination (중립 필요)' }

  return {
    key: 'stability_structure', label: 'Stability',
    userScore, productScore,
    matchScore: proximity(productScore, userScore, 1.0),
    weight: 0,
    userDisplay,
    productDisplay: raw.replace('-', ' '),
  }
}

/* ── Q04 + Q03 → 미드솔 쿠셔닝·반발력 ── */
function midsole(spec: Record<string, unknown>, answers: Record<string, string>): ScoredDimension {
  const obj = spec.midsole_resilience as Record<string, unknown> ?? {}
  const pct = (obj.resilience_pct as number) ?? 65
  const material = String(obj.material ?? 'EVA')
  const productScore = norm(pct, 40, 90)

  const q04 = answers['Q04'] ?? ''
  const q03 = answers['Q03'] ?? ''
  const hasPain = !q04.includes('No discomfort') && q04.length > 0
  const highVol = q03.includes('High Volume')

  let userScore = 65; let userDisplay = '범용 쿠션'
  if (hasPain) { userScore = 30; userDisplay = '통증 → 소프트 쿠션 우선' }
  else if (highVol) { userScore = 55; userDisplay = '고주행 → 중간 반발력' }
  else { userScore = 75; userDisplay = '반응성 우선' }

  return {
    key: 'midsole_resilience', label: 'Cushion / Energy Return',
    userScore, productScore,
    matchScore: proximity(productScore, userScore),
    weight: 0,
    userDisplay,
    productDisplay: `${material} ${pct}%`,
  }
}

/* ── Q06 → 아웃솔 트랙션 ── */
function outsole(spec: Record<string, unknown>, answers: Record<string, string>): ScoredDimension {
  const obj = spec.outsole_traction as Record<string, unknown> ?? {}
  const lug = (obj.lug_mm as number) ?? 2
  const frictionDry = (obj.friction_dry as number) ?? 0.5
  // lug 0-6mm, friction_dry 0.3-0.8 → 합성 0-100
  const lugScore = norm(lug, 0, 6)
  const fricScore = norm(frictionDry, 0.3, 0.8)
  const productScore = clamp(lugScore * 0.55 + fricScore * 0.45)

  const q06 = answers['Q06'] ?? ''
  let userScore = 45; let userDisplay = '포장도로'
  if (q06.includes('Trail')) { userScore = 82; userDisplay = '트레일 (높은 그립 필요)' }
  else if (q06.includes('Treadmill')) { userScore = 25; userDisplay = '트레드밀 (낮은 러그)' }
  else { userScore = 45; userDisplay = '포장도로 (중간 트랙션)' }

  return {
    key: 'outsole_traction', label: 'Outsole Traction',
    userScore, productScore,
    matchScore: proximity(productScore, userScore),
    weight: 0,
    userDisplay,
    productDisplay: `러그 ${lug}mm / 마찰 ${frictionDry}`,
  }
}

/* ── Q07 → 굴곡 강성 (플레이트 여부) ── */
function bending(spec: Record<string, unknown>, answers: Record<string, string>): ScoredDimension {
  const obj = spec.bending_stiffness as Record<string, unknown> ?? {}
  const type = String(obj.type ?? 'unplated_low')
  const scoreMap: Record<string, number> = {
    unplated_low: 15, unplated_mid: 40,
    plated_low: 60, plated_mid: 78, plated_high: 92,
  }
  const productScore = scoreMap[type] ?? 30

  const q07 = answers['Q07'] ?? ''
  let userScore = 30; let userDisplay = '유연한 플랫폼 선호'
  if (q07.includes('High Longitudinal')) { userScore = 85; userDisplay = '리지드 플레이트 선호' }

  return {
    key: 'bending_stiffness', label: 'Plate / Bending Stiffness',
    userScore, productScore,
    matchScore: proximity(productScore, userScore, 0.9),
    weight: 0,
    userDisplay,
    productDisplay: type.replace('_', ' ').replace(/-/g, ' '),
  }
}

/* ── Q05 + CFD big_toe_angle → 갑피 유연성 ── */
function upper(spec: Record<string, unknown>, answers: Record<string, string>, cfd: CfdMeasurement): ScoredDimension {
  const obj = spec.upper_material as Record<string, unknown> ?? {}
  const stretchPct = (obj.stretch_pct as number) ?? 8
  const material = String(obj.material ?? 'Mesh')
  const productScore = norm(stretchPct, 0, 25)

  const q05 = answers['Q05'] ?? ''
  const toeAngle = Math.max(
    parseFloat(String(cfd.big_toe_angle_l ?? '0')),
    parseFloat(String(cfd.big_toe_angle_r ?? '0')),
  )
  let userScore = 40; let userDisplay = '일반 핏'
  if (q05.includes('Bunion') || toeAngle > 12) { userScore = 72; userDisplay = `무지외반 (발가락 각도 ${toeAngle.toFixed(0)}°)` }
  else if (q05.includes('Compression')) { userScore = 60; userDisplay = '발가락 압박 주의' }

  return {
    key: 'upper_material', label: 'Upper Flexibility',
    userScore, productScore,
    matchScore: proximity(productScore, userScore),
    weight: 0,
    userDisplay,
    productDisplay: `${material} stretch ${stretchPct}%`,
  }
}

/* ── Q04 + Q03 → 스택 높이 ── */
function stack(spec: Record<string, unknown>, answers: Record<string, string>): ScoredDimension {
  const obj = spec.stack_height_stiffness as Record<string, unknown> ?? {}
  const stackMm = (obj.stack_mm as number) ?? 28
  const torsional = String(obj.torsional ?? 'mid')
  const productScore = norm(stackMm, 18, 45)

  const q04 = answers['Q04'] ?? ''
  const q03 = answers['Q03'] ?? ''
  const hasPain = !q04.includes('No discomfort') && q04.length > 0
  const highVol = q03.includes('High Volume')

  let userScore = 40; let userDisplay = '일반 보호'
  if (hasPain) { userScore = 65; userDisplay = '통증 → 높은 스택 필요' }
  else if (highVol) { userScore = 55; userDisplay = '고주행 → 충분한 스택' }

  return {
    key: 'stack_height', label: 'Stack Height',
    userScore, productScore,
    matchScore: proximity(productScore, userScore),
    weight: 0,
    userDisplay,
    productDisplay: `${stackMm}mm (비틀림: ${torsional})`,
  }
}

/* ── Q08 → 레이싱·힐카운터 ── */
function lacing(spec: Record<string, unknown>, answers: Record<string, string>): ScoredDimension {
  const obj = spec.lacing_heel_counter as Record<string, unknown> ?? {}
  const lacingType = String(obj.lacing ?? 'standard')
  const heelCounter = String(obj.heel_counter ?? 'standard')
  const scoreMap: Record<string, number> = {
    'standard_standard': 50, 'standard_firm': 75,
    'flexible_standard': 65, 'flexible_firm': 85,
  }
  const productScore = scoreMap[`${lacingType}_${heelCounter}`] ?? 50

  const q08 = answers['Q08'] ?? ''
  let userScore = 50; let userDisplay = '일반 핏'
  if (q08.includes('Heel Slippage')) { userScore = 78; userDisplay = '힐 슬리피지 → 단단한 힐카운터' }
  else if (q08.includes('High Instep')) { userScore = 68; userDisplay = '높은 발등 → 유연한 레이싱' }

  return {
    key: 'lacing_heel_counter', label: 'Lacing & Heel Counter',
    userScore, productScore,
    matchScore: proximity(productScore, userScore, 0.9),
    weight: 0,
    userDisplay,
    productDisplay: `레이싱: ${lacingType} / 힐: ${heelCounter}`,
  }
}

/* ── 동적 가중치 계산 ── */
function calcWeights(answers: Record<string, string>, dims: ScoredDimension[]): void {
  const base: Record<string, number> = {
    stability_structure: 0.18,
    heel_to_toe_drop:    0.15,
    midsole_resilience:  0.15,
    outsole_traction:    0.13,
    bending_stiffness:   0.12,
    upper_material:      0.10,
    stack_height:        0.10,
    lacing_heel_counter: 0.07,
  }

  const q02 = answers['Q02'] ?? ''
  const q04 = answers['Q04'] ?? ''
  const q06 = answers['Q06'] ?? ''
  const q05 = answers['Q05'] ?? ''
  const q07 = answers['Q07'] ?? ''
  const q08 = answers['Q08'] ?? ''

  if (q02.includes('Overpronation')) base.stability_structure += 0.06
  if (!q04.includes('No discomfort') && q04.length > 0) {
    base.midsole_resilience += 0.05
    base.stack_height       += 0.03
  }
  if (q06.includes('Trail'))       base.outsole_traction  += 0.07
  if (q05.includes('Bunion'))      base.upper_material    += 0.05
  if (q07.includes('High Longit')) base.bending_stiffness += 0.05
  if (q08.includes('Heel Slipp'))  base.lacing_heel_counter += 0.05

  const total = Object.values(base).reduce((a, b) => a + b, 0)
  dims.forEach(d => { d.weight = (base[d.key] ?? 0.10) / total })
}

/* ── 공개 API ── */
export function scoreShoeForUser(
  specs: Record<string, unknown>,
  answers: Record<string, string>,
  cfd: CfdMeasurement,
): ScoredDimension[] {
  const dims = [
    heelDrop(specs, answers),
    stability(specs, answers),
    midsole(specs, answers),
    outsole(specs, answers),
    bending(specs, answers),
    upper(specs, answers, cfd),
    stack(specs, answers),
    lacing(specs, answers),
  ]
  calcWeights(answers, dims)
  return dims
}

export function calcOverallScore(dims: ScoredDimension[]): number {
  return clamp(Math.round(dims.reduce((sum, d) => sum + d.matchScore * d.weight, 0)))
}

/* ════════════════════════════════════════════════════
 * 안전 경고 시스템
 * ════════════════════════════════════════════════════ */

export interface SafetyWarning {
  level: 'danger' | 'caution'  // danger=부상 위험, caution=주의
  title: string
  body: string
}

export function checkSafety(
  specs: Record<string, unknown>,
  answers: Record<string, string>,
  cfd: CfdMeasurement,
  dims: ScoredDimension[],
): SafetyWarning[] {
  const warnings: SafetyWarning[] = []

  const q01 = answers['Q01'] ?? ''
  const q02 = answers['Q02'] ?? ''
  const q03 = answers['Q03'] ?? ''
  const q04 = answers['Q04'] ?? ''
  const q05 = answers['Q05'] ?? ''
  const q06 = answers['Q06'] ?? ''
  const q08 = answers['Q08'] ?? ''

  /* 신발 스펙 추출 */
  const dropMm      = (specs.heel_to_toe_drop as number) ?? 8
  const stability   = String(specs.stability_structure ?? 'neutral')
  const stackObj    = specs.stack_height_stiffness as Record<string, unknown> ?? {}
  const stackMm     = (stackObj.stack_mm as number) ?? 28
  const bendObj     = specs.bending_stiffness as Record<string, unknown> ?? {}
  const bendType    = String(bendObj.type ?? 'unplated_low')
  const upperObj    = specs.upper_material as Record<string, unknown> ?? {}
  const stretchPct  = (upperObj.stretch_pct as number) ?? 8
  const outsoleObj  = specs.outsole_traction as Record<string, unknown> ?? {}
  const lugMm       = (outsoleObj.lug_mm as number) ?? 2
  const lacingObj   = specs.lacing_heel_counter as Record<string, unknown> ?? {}
  const heelCounter = String(lacingObj.heel_counter ?? 'standard')
  const midObj      = specs.midsole_resilience as Record<string, unknown> ?? {}
  const resilience  = (midObj.resilience_pct as number) ?? 65

  const toeAngle = Math.max(
    parseFloat(String(cfd.big_toe_angle_l ?? '0')),
    parseFloat(String(cfd.big_toe_angle_r ?? '0')),
  )
  const highVol    = q03.includes('High Volume')
  const midVol     = q03.includes('Mid Volume')
  const hasPain    = q04.length > 0

  /* ── 1. 과내전 + 중립화 신발 → 부상 위험 ── */
  if (q02.includes('Overpronation') && stability === 'neutral') {
    warnings.push({
      level: 'danger',
      title: '지지력 부족 — 과내전 × 중립화',
      body: '과내전 보행에 중립 신발은 발목·무릎·고관절 부하를 가중시킵니다. 미드·모션컨트롤 신발을 권장합니다.',
    })
  }

  /* ── 2. 외전(Supination) + 모션컨트롤 → 스트레스 골절 위험 ── */
  if (q02.includes('Supination') && stability === 'motion-control') {
    warnings.push({
      level: 'danger',
      title: '과도한 교정 — 외전(Supination) × 모션컨트롤',
      body: '외전 보행에 모션컨트롤 신발은 발·정강이 스트레스 골절 위험이 있습니다. 중립 신발을 권장합니다.',
    })
  }

  /* ── 3. 족저근막염 + 높은 힐드롭 ── */
  if (q04.includes('Plantar Fasciitis') && dropMm > 10) {
    warnings.push({
      level: 'danger',
      title: '족저근막염 악화 위험 — 높은 힐드롭',
      body: `힐드롭 ${dropMm}mm는 아킬레스건을 단축시켜 족저근막 긴장을 심화할 수 있습니다. 8mm 이하를 권장합니다.`,
    })
  }

  /* ── 4. 아킬레스건병증 + 매우 낮은 힐드롭 ── */
  if (q04.includes('Achilles') && dropMm < 4) {
    warnings.push({
      level: 'danger',
      title: '아킬레스건 부하 증가 — 낮은 힐드롭',
      body: `힐드롭 ${dropMm}mm는 아킬레스건 신전 범위를 늘려 기존 건병증을 악화시킬 수 있습니다.`,
    })
  }

  /* ── 5. 전족부 통증 + 낮은 스택 ── */
  if (q04.includes('Metatarsalgia') && stackMm < 24) {
    warnings.push({
      level: 'danger',
      title: '전족부 충격 흡수 부족',
      body: `스택 ${stackMm}mm는 중족골통 증상을 악화시킬 수 있습니다. 28mm 이상 쿠션 신발을 권장합니다.`,
    })
  }

  /* ── 6. 트레일 + 로드화 (미끄럼 위험) ── */
  if (q06.includes('Trail') && lugMm < 2) {
    warnings.push({
      level: 'danger',
      title: '트레일 낙상 위험 — 낮은 러그',
      body: `러그 ${lugMm}mm 로드화는 트레일에서 미끄러질 위험이 높습니다. 4mm 이상 러그의 트레일화를 권장합니다.`,
    })
  }

  /* ── 7. 고주행 + 얇은 스택 ── */
  if (highVol && stackMm < 24) {
    warnings.push({
      level: 'caution',
      title: '고주행 × 낮은 스택 — 피로 누적 주의',
      body: `주당 30km+ 훈련에 스택 ${stackMm}mm는 충격 흡수 부족으로 피로 골절 위험을 높입니다.`,
    })
  }

  /* ── 8. 무지외반 + 신축성 없는 갑피 ── */
  if ((q05.includes('Bunion') || toeAngle > 15) && stretchPct < 5) {
    warnings.push({
      level: 'caution',
      title: '무지외반 마찰 주의 — 낮은 갑피 신축성',
      body: `갑피 신축률 ${stretchPct}%는 돌출된 무지 관절을 압박하여 통증·염증을 유발할 수 있습니다.`,
    })
  }

  /* ── 9. 힐 슬리피지 + 약한 힐카운터 ── */
  if (q08.includes('Heel Slippage') && heelCounter !== 'firm') {
    warnings.push({
      level: 'caution',
      title: '힐 슬리피지 악화 가능 — 일반 힐카운터',
      body: '기존 힐 슬리피지에 일반 힐카운터는 물집·건 손상 위험이 있습니다. Firm 힐카운터 제품을 권장합니다.',
    })
  }

  /* ── 10. 전족부 착지 + 높은 힐드롭 ── */
  if (q01.includes('Forefoot') && dropMm > 8) {
    warnings.push({
      level: 'caution',
      title: '착지 패턴과 힐드롭 불일치',
      body: `전족부 착지(FFS) 주자에게 ${dropMm}mm 힐드롭은 자연스러운 보행을 방해하고 종아리에 부담을 줍니다.`,
    })
  }

  /* ── 11. 핵심 항목 matchScore 극저 (< 25) ── */
  dims.forEach(d => {
    if (d.matchScore < 25 && d.weight >= 0.13) {
      warnings.push({
        level: 'danger',
        title: `치명적 불일치 — ${d.label}`,
        body: `이 신발의 ${d.label} 스펙(${d.productDisplay})이 사용자 요구(${d.userDisplay})와 매우 다릅니다. 착용 시 불편·부상 위험이 있습니다.`,
      })
    }
  })

  /* danger를 앞으로 정렬 */
  return warnings.sort((a, b) => (a.level === 'danger' ? -1 : 1) - (b.level === 'danger' ? -1 : 1))
}
}
