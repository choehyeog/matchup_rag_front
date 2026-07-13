// PHP 서버가 전송하는 flat snake_case 측정 JSON 포맷
export interface CfdMeasurement {
  cfd_no?: string
  cfd_uuid: string
  user_id?: string
  highheel?: string
  arch_length_l?: string | number
  arch_length_r?: string | number
  foot_length_l: string | number
  foot_length_r: string | number
  instep_girth_l?: string | number
  instep_girth_r?: string | number
  ball_distance_l?: string | number
  ball_distance_r?: string | number
  big_toe_angle_l?: string | number
  big_toe_angle_r?: string | number
  foot_ball_girth_l?: string | number
  foot_ball_girth_r?: string | number
  shoe_fitting_correct?: string | number
  lang?: string
  [key: string]: unknown
}

export interface ShoeMatch {
  product_code: string  // primary key (e.g. "MOCK_NEUTRAL_DAILY_01")
  brand: string
  model_name: string
  overall_score: number
  fit_score?: number
  image_url?: string
  category?: string
  sport_type?: string
}

// QuickReport 화면에 전달하는 세션 데이터
export interface ScanSession {
  cfdData: CfdMeasurement
  leftPhotoUrl?: string
  rightPhotoUrl?: string
  quickReportText?: string
  surveyAnswers?: {
    card1_physical: Record<string, unknown>
    card2_symptoms: Record<string, unknown>
    card3_arch_pain: Record<string, unknown>
    card4_medical: Record<string, unknown>
    card5_lifestyle: Record<string, unknown>
  }
  deepReportText?: string
  deepReportData?: DeepReportJson
  sportType?: string
  caseSurveyAnswers?: Record<string, unknown>
  caseReportText?: string
  matchedShoes?: ShoeMatch[]
  caseReportSummary?: string[]
}

// API 요청/응답
export interface QuickReportResponse {
  status: string
  quick_report_text: string
}

export interface DeepReportRequest {
  user_id?: string | null
  cfd_uuid: string
  quick_report_context: string
  card1_physical: Record<string, unknown>
  card2_symptoms: Record<string, unknown>
  card3_arch_pain: Record<string, unknown>
  card4_medical: Record<string, unknown>
  card5_lifestyle: Record<string, unknown>
  force_regenerate?: boolean
}

export interface DeepReportItem {
  guide?: string
  data_insight?: string
  illustration_key?: string
}

export interface DeepReportJson {
  shoe_specification?: Record<string, DeepReportItem>
  how_to_wear?: Record<string, DeepReportItem>
  precautions?: { daily_caution?: string; shopping_tip?: string }
  error?: string
}

export interface DeepReportResponse {
  status: string
  deep_fitting_solution: DeepReportJson
}

export interface CaseReportRequest {
  user_id?: string | null
  cfd_uuid: string
  sport_type: string
  case_survey_data: Record<string, unknown>
  force_regenerate?: boolean
}

export interface CaseReportResponse {
  status: string
  integrated_case_solution: string
  matched_shoes?: ShoeMatch[]
  summary_bullets?: string[]
}

export interface ShoeMatchDetailRequest {
  cfd_uuid: string
  user_id?: string | null
  sport_type: string
  product_id: string  // product_code 값 (e.g. "MOCK_NEUTRAL_DAILY_01")
}

export interface BreakdownItem {
  label: string
  score: number
  required: string
  product_value: string
}

export interface ShoeMatchDetail {
  brand: string
  model_name: string
  overall_score: number
  safety_ok: boolean
  image_url?: string
  breakdown: BreakdownItem[]
  recommend_sizes?: RecommendSizeData  // 백엔드 추가 예정
}

export interface ShoeMatchDetailResponse {
  detail: ShoeMatchDetail
}

/* ── 사이즈별 발 핏 색상 데이터 (recommand.json 포맷) ── */
export interface RecommendColorMap {
  Front_L: string; Front_R: string
  Middle_L: string; Middle_R: string
  Back_L: string;  Back_R: string
}

export interface RecommendSizeEntry {
  shoe_size: string
  width_option: string
  Color: RecommendColorMap
}

export interface RecommendSizeData {
  'recommand shoe size': RecommendSizeEntry
  'bigger size': RecommendSizeEntry
  'smaller size': RecommendSizeEntry
}

// 측정값 표시용 파생 타입
export interface MeasurementDisplay {
  label: string
  left: number
  right: number
}

export function parseMeasurements(cfd: CfdMeasurement): MeasurementDisplay[] {
  const n = (v: string | number | undefined) => v !== undefined ? parseFloat(String(v)) : 0
  return [
    { label: 'Foot Length',   left: n(cfd.foot_length_l),     right: n(cfd.foot_length_r) },
    { label: 'Foot Width',    left: n(cfd.ball_distance_l),   right: n(cfd.ball_distance_r) },
    { label: 'Ball Girth',    left: n(cfd.foot_ball_girth_l), right: n(cfd.foot_ball_girth_r) },
    { label: 'Instep Girth',  left: n(cfd.instep_girth_l),    right: n(cfd.instep_girth_r) },
    { label: 'Arch Length',   left: n(cfd.arch_length_l),     right: n(cfd.arch_length_r) },
    { label: 'Big Toe Angle', left: n(cfd.big_toe_angle_l),   right: n(cfd.big_toe_angle_r) },
  ]
}
