import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fittingApi } from '@/api/fitting'
import { scoreShoeForUser, calcOverallScore, checkSafety } from '@/utils/shoeScoring'
import type { SafetyWarning } from '@/utils/shoeScoring'
import type { ScanSession, RecommendSizeData } from '@/types/api'
import type { Metric, SizeOption } from './FitDetailsScreen'
import FitDetailsScreen from './FitDetailsScreen'

/* ── recommand.json → SizeOption[] 변환 ──────────────────────────────
 * Front → toe  /  Middle → ball  /  Back → heel
 * c1~c5 → 1~5 (Snug=1 → Roomy=5)
 * 순서: smaller(0) → recommand(1, 기본선택) → bigger(2)
 * ─────────────────────────────────────────────────────────────────── */
function parseRecommendSizes(data: RecommendSizeData): { sizes: SizeOption[]; initialSizeIndex: number } {
  const c = (code: string) => parseInt(code.replace('c', ''), 10) as 1 | 2 | 3 | 4 | 5

  const toOption = (entry: RecommendSizeData['recommand shoe size']): SizeOption => ({
    size: `${entry.shoe_size}`,
    left:  { toe: c(entry.Color.Front_L), ball: c(entry.Color.Middle_L), heel: c(entry.Color.Back_L) },
    right: { toe: c(entry.Color.Front_R), ball: c(entry.Color.Middle_R), heel: c(entry.Color.Back_R) },
  })

  return {
    sizes: [
      toOption(data['smaller size']),
      toOption(data['recommand shoe size']),
      toOption(data['bigger size']),
    ],
    initialSizeIndex: 1,  // recommand shoe size가 기본
  }
}

export default function ShoeDetail() {
  const navigate = useNavigate()
  const { shoeId } = useParams<{ shoeId: string }>()

  const [loading,          setLoading]          = useState(true)
  const [metrics,          setMetrics]          = useState<Metric[]>([])
  const [fitScore,         setFitScore]         = useState(0)
  const [product,          setProduct]          = useState({ name: '—', brand: '—', image: null as string | null })
  const [warnings,         setWarnings]         = useState<SafetyWarning[]>([])
  const [sizes,            setSizes]            = useState<SizeOption[]>([])
  const [initialSizeIndex, setInitialSizeIndex] = useState(1)

  useEffect(() => {
    const raw = sessionStorage.getItem('scanSession')
    if (!raw) { navigate('/', { replace: true }); return }
    const session = JSON.parse(raw) as ScanSession

    const productCode = shoeId ? decodeURIComponent(shoeId) : ''
    if (!productCode) { navigate('/report/shoes', { replace: true }); return }

    /* 세션의 overall_score를 초기값으로 — Fit Compatibility와 동일한 값 */
    const shoe = session.matchedShoes?.find(s => s.product_code === productCode)
    if (shoe) {
      setProduct({ name: shoe.model_name, brand: shoe.brand, image: shoe.image_url ?? null })
      setFitScore(shoe.overall_score)  // 목록과 동일한 NAS 점수로 시작
    }

    /* 신발 스펙 → 8개 막대그래프 + 안전 경고 (프론트 엔진)
     * overall_score는 건드리지 않음 — 목록 점수와 일치 유지 */
    fittingApi.shoeProducts()
      .then(({ products }) => {
        const found = products.find(p => p.product_code === productCode)
        if (!found) return

        setProduct({ name: found.model_name, brand: found.brand, image: found.image_url ?? null })

        const caseAnswers = (session.caseSurveyAnswers ?? {}) as Record<string, string>
        const specs = (found as unknown as { specs: Record<string, unknown> }).specs ?? {}

        const dims = scoreShoeForUser(specs, caseAnswers, session.cfdData)
        const safetyWarnings = checkSafety(specs, caseAnswers, session.cfdData, dims)

        // overall_score는 세션값(NAS) 유지, 막대그래프만 프론트 계산값 사용
        setWarnings(safetyWarnings)
        setMetrics(dims.map(d => ({
          label:          d.label,
          value:          Math.round(d.productScore),
          userScore:      Math.round(d.userScore),
          matchScore:     Math.round(d.matchScore),
          userDisplay:    d.userDisplay,
          productDisplay: d.productDisplay,
        })))
      })
      .catch(err => console.warn('스펙 조회 실패:', err))

    /* NAS shoe-match-detail — 사이즈 핏 데이터(PHP 연결 후 사용) */
    fittingApi.shoeMatchDetail({
      cfd_uuid:   session.cfdData.cfd_uuid,
      user_id:    session.cfdData.user_id || null,
      sport_type: session.sportType || 'running',
      product_id: productCode,
    })
      .then(res => {
        if (res.detail.recommend_sizes) {
          const { sizes: s, initialSizeIndex: idx } = parseRecommendSizes(res.detail.recommend_sizes)
          setSizes(s)
          setInitialSizeIndex(idx)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [navigate, shoeId])

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <p style={{ color: '#888', fontSize: 15 }}>Analyzing fit dimensions...</p>
      </div>
    )
  }

  return (
    <FitDetailsScreen
      fitScore={fitScore}
      product={product}
      metrics={metrics}
      warnings={warnings}
      sizes={sizes.length > 0 ? sizes : undefined}
      initialSizeIndex={initialSizeIndex}
      onBack={() => navigate('/report/shoes')}
      onClose={() => navigate('/')}
    />
  )
}
