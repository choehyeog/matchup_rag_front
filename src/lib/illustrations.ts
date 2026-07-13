/**
 * 일러스트 레지스트리
 *
 * illustration_key → public/illustrations 하위 실제 경로 매핑.
 * 파일을 교체할 때는 public/illustrations/<category>/ 폴더의 SVG만 바꾸면 되고,
 * key 이름은 rag_service.py 프롬프트 스키마와 이 파일에서만 관리합니다.
 */
export const ILLUSTRATIONS = {
  // 토박스
  toe_box_wide:     '/illustrations/toe_box/wide.svg',
  toe_box_standard: '/illustrations/toe_box/standard.svg',
  toe_box_narrow:   '/illustrations/toe_box/narrow.svg',
  // 아웃솔
  outsole_stability:  '/illustrations/outsole/stability.svg',
  outsole_neutral:    '/illustrations/outsole/neutral.svg',
  outsole_supination: '/illustrations/outsole/supination.svg',
  // 인솔
  insole_arch_flat: '/illustrations/insole/arch_flat.svg',
  insole_arch_high: '/illustrations/insole/arch_high.svg',
  insole_cushion:   '/illustrations/insole/cushion.svg',
  // 레이싱
  lacing_wide:      '/illustrations/lacing/wide.svg',
  lacing_heel_lock: '/illustrations/lacing/heel_lock.svg',
} as const

export type IllustrationKey = keyof typeof ILLUSTRATIONS

export function getIllustrationSrc(key: string | undefined): string | undefined {
  if (!key) return undefined
  return ILLUSTRATIONS[key as IllustrationKey]
}

/**
 * 각 리포트 섹션 키에 대한 기본 일러스트.
 * Gemini가 illustration_key를 내려줄 때는 그 값이 우선 사용되고,
 * 없을 경우(이전 데이터 또는 해당 없는 섹션) 여기서 fallback 합니다.
 */
export const SECTION_DEFAULT_ILLUSTRATION: Partial<Record<string, IllustrationKey>> = {
  // 신발 스펙
  toe_box:        'toe_box_wide',
  outsole_feature: 'outsole_neutral',
  cushion_insole:  'insole_cushion',
  // 착용 가이드
  lacing_technique: 'lacing_wide',
}
