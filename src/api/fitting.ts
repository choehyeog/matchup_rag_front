import type {
  CfdMeasurement,
  QuickReportResponse,
  DeepReportRequest,
  DeepReportResponse,
  CaseReportRequest,
  CaseReportResponse,
  ShoeMatchDetailRequest,
  ShoeMatchDetailResponse,
} from '@/types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: COMMON_HEADERS,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(detail || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: COMMON_HEADERS,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export const fittingApi = {
  quickReport: (cfd: CfdMeasurement, forceRegenerate = false) => {
    const { cfd_uuid, user_id, ...measurements } = cfd
    return post<QuickReportResponse>('/api/v1/fitting/quick-report', {
      cfd_uuid,
      user_id: user_id || null,
      measurements,
      force_regenerate: forceRegenerate,
    })
  },

  deepReport: (req: DeepReportRequest) =>
    post<DeepReportResponse>('/api/v1/fitting/deep-report', req),

  caseReport: (req: CaseReportRequest) =>
    post<CaseReportResponse>('/api/v1/fitting/case-report', req),

  shoeMatchDetail: (req: ShoeMatchDetailRequest) =>
    post<ShoeMatchDetailResponse>('/api/v1/fitting/shoe-match-detail', req),

  shoeProducts: () =>
    get<{ status: string; products: Array<{ product_code: string; brand: string; model_name: string; sport_type: string; image_url?: string | null }> }>('/api/v1/admin/shoe-products'),

  mapUser: (cfd_uuid: string, user_id: string) =>
    post('/api/map-user', { cfd_uuid, user_id }),
}
