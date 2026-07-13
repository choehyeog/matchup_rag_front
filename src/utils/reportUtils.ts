// Gemini가 JSON 객체로 반환하는 리포트를 읽기 가능한 텍스트로 변환

interface DeepReportData {
  title?: string
  greeting?: string
  shoe_specification?: Record<string, { guide?: string; data_insight?: string }>
  how_to_wear?: Record<string, { guide?: string; data_insight?: string }>
  precautions?: { daily_caution?: string; shopping_tip?: string }
  error?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>

export function flattenDeepReport(data: unknown): string {
  if (typeof data === 'string') return data
  if (typeof data !== 'object' || data === null) return String(data)

  const d = data as DeepReportData
  if (d.error) return `[리포트 생성 오류] ${d.error}`

  const sections: string[] = []

  if (d.title) sections.push(d.title)
  if (d.greeting) sections.push(d.greeting)

  const specLabels: Record<string, string> = {
    length_and_width: '길이/너비',
    volume_and_instep: '체적/발등',
    toe_box: '토룸',
    upper_material: '갑피 소재',
    outsole_feature: '아웃솔',
    cushion_insole: '쿠션/인솔',
  }
  if (d.shoe_specification) {
    const lines = ['[신발 스펙 가이드]']
    for (const [key, label] of Object.entries(specLabels)) {
      const item = d.shoe_specification[key]
      if (item?.guide) {
        lines.push(`${label}: ${item.guide}`)
        if (item.data_insight) lines.push(`→ ${item.data_insight}`)
      }
    }
    sections.push(lines.join('\n'))
  }

  const wearLabels: Record<string, string> = {
    asymmetric_fit: '비대칭 보정',
    lacing_technique: '끈 매는 법',
    orthotic_prescription: '기능성 인솔',
  }
  if (d.how_to_wear) {
    const lines = ['[착용 가이드]']
    for (const [key, label] of Object.entries(wearLabels)) {
      const item = d.how_to_wear[key]
      if (item?.guide) {
        lines.push(`${label}: ${item.guide}`)
        if (item.data_insight) lines.push(`→ ${item.data_insight}`)
      }
    }
    sections.push(lines.join('\n'))
  }

  if (d.precautions) {
    const lines = ['[주의사항]']
    if (d.precautions.daily_caution) lines.push(`일상 보행: ${d.precautions.daily_caution}`)
    if (d.precautions.shopping_tip) lines.push(`구매 팁: ${d.precautions.shopping_tip}`)
    sections.push(lines.join('\n'))
  }

  return sections.join('\n\n')
}

export function flattenCaseReport(data: unknown): string {
  if (typeof data === 'string') return data
  if (typeof data !== 'object' || data === null) return String(data)

  const d = data as AnyObj
  if (d.error) return `[리포트 생성 오류] ${d.error}`

  const sections: string[] = []

  // New schema (after NAS restart): activity_profile / integrated_analysis / recommendations
  if (d.activity_profile || d.integrated_analysis || d.recommendations) {
    if (d.activity_profile?.guide) {
      sections.push(`[Activity Profile]\n${d.activity_profile.guide}`)
    }
    if (d.integrated_analysis) {
      const labels: Record<string, string> = {
        scan_findings: 'Scan',
        survey_findings: 'Survey',
        overall_assessment: 'Assessment',
      }
      const lines = ['[Integrated Analysis]']
      for (const [key, label] of Object.entries(labels)) {
        const item = d.integrated_analysis[key]
        if (item?.guide) {
          lines.push(`${label}: ${item.guide}`)
          if (item.data_insight) lines.push(item.data_insight)
        }
      }
      sections.push(lines.join('\n'))
    }
    if (d.recommendations) {
      const labels: Record<string, string> = {
        shoe_specification: 'Shoe Spec',
        wear_guide: 'Wear Guide',
        injury_prevention: 'Injury Prevention',
      }
      const lines = ['[Recommendations]']
      for (const [key, label] of Object.entries(labels)) {
        const item = d.recommendations[key]
        if (item?.guide) {
          lines.push(`${label}: ${item.guide}`)
          if (item.data_insight) lines.push(item.data_insight)
        }
      }
      sections.push(lines.join('\n'))
    }
    return sections.join('\n\n')
  }

  // Old schema fallback (before NAS restart): sport_biomechanics / integrated_summary / etc.
  if (d.title) sections.push(d.title)
  if (d.sport_biomechanics) sections.push(`[종목 특성]\n${d.sport_biomechanics}`)
  if (d.integrated_summary) {
    const s = d.integrated_summary
    const lines = ['[종합 분석]']
    if (s.phase1_scan_summary) lines.push(`스캔 요약: ${s.phase1_scan_summary}`)
    if (s.phase2_deep_summary) lines.push(`심층 요약: ${s.phase2_deep_summary}`)
    if (s.phase3_case_summary) lines.push(`케이스 요약: ${s.phase3_case_summary}`)
    if (s.pedorthic_diagnosis) lines.push(`\n${s.pedorthic_diagnosis}`)
    sections.push(lines.join('\n'))
  }
  if (d.shoe_recommendation) sections.push(`[신발 추천]\n${d.shoe_recommendation}`)
  if (d.wear_guide) sections.push(`[착용 가이드]\n${d.wear_guide}`)
  if (d.precautions && typeof d.precautions === 'string') sections.push(`[주의사항]\n${d.precautions}`)

  return sections.join('\n\n')
}
