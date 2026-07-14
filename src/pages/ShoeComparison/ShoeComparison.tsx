import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, AlertTriangle } from 'lucide-react'
import { COLORS, FONT, RADIUS, PAGE, DISPLAY } from '@/shared/theme'
import TopNav from '@/components/TopNav'
import { fittingApi } from '@/api/fitting'
import type { ScanSession, ShoeMatch, WeightProfileItem } from '@/types/api'

// ── Dimension별 고정 설명 텍스트 ────────────────────────────────
const DIM_DESC: Record<string, string> = {
  stability_structure:    '과내전/회외전은 대부분 러닝 부상의 근원. 잘못 매칭 시 전신 운동사슬에 영향.',
  heel_to_toe_drop:       '착지 패턴·아킬레스 부하·무릎 굴곡각 직접 결정. 틀리면 부상 패턴 고착.',
  midsole_resilience:     '반복 충격 흡수 및 에너지 반환. 볼륨이 높을수록 중요도 급상승.',
  stack_height_stiffness: '보호 쿠션. 중요하지만 드롭/안정성보다 이차적.',
  last_width_toebox:      '발볼 폭·토박스 공간. 무지외반증/중족골통 시 최우선.',
  outsole_traction:       '지형 의존적. 로드에서는 충분; 트레일에서는 최우선으로 상승.',
  bending_stiffness:      '추진 효율 및 전족부 보호. 대부분 중립; 특정 통증 시 최우선.',
  lacing_heel_counter:    '피팅 안정성. 힐 슬리피지/발등 압박 없으면 부차적.',
  upper_material:         '편의성/신축성. 구조적 항목보다 낮음. 진단 조건 있을 때 급상승.',
}

// 가중치 미제공 시 기본 프로필 (설문 이전 진입 등 폴백)
const DEFAULT_PROFILE: WeightProfileItem[] = [
  { dimension_id: 'stability_structure',    label: '안정성 구조',        weight: 1.5, base_weight: 1.5, required_spec: '-', is_triggered: false, priority_rank: 1 },
  { dimension_id: 'heel_to_toe_drop',       label: '힐-투-토 드롭',      weight: 1.5, base_weight: 1.5, required_spec: '-', is_triggered: false, priority_rank: 2 },
  { dimension_id: 'midsole_resilience',     label: '미드솔 반발력',      weight: 1.2, base_weight: 1.2, required_spec: '-', is_triggered: false, priority_rank: 3 },
  { dimension_id: 'stack_height_stiffness', label: '스택 높이/강성',     weight: 1.0, base_weight: 1.0, required_spec: '-', is_triggered: false, priority_rank: 4 },
  { dimension_id: 'last_width_toebox',      label: '라스트 폭/토박스',   weight: 1.0, base_weight: 1.0, required_spec: '-', is_triggered: false, priority_rank: 5 },
  { dimension_id: 'outsole_traction',       label: '아웃솔 마찰/접지력', weight: 1.0, base_weight: 1.0, required_spec: '-', is_triggered: false, priority_rank: 6 },
  { dimension_id: 'bending_stiffness',      label: '굴곡 강성/플레이트', weight: 1.0, base_weight: 1.0, required_spec: '-', is_triggered: false, priority_rank: 7 },
  { dimension_id: 'lacing_heel_counter',    label: '레이싱/힐 카운터',   weight: 0.8, base_weight: 0.8, required_spec: '-', is_triggered: false, priority_rank: 8 },
  { dimension_id: 'upper_material',         label: '갑피 소재/신축성',   weight: 0.8, base_weight: 0.8, required_spec: '-', is_triggered: false, priority_rank: 9 },
]

// ── 가중치 → 별 개수 ────────────────────────────────────────────
function starCount(w: number): 1 | 2 | 3 {
  if (w >= 1.4) return 3
  if (w >= 0.9) return 2
  return 1
}

function StarRow({ weight, base_weight }: { weight: number; base_weight: number }) {
  const n = starCount(weight)
  const boosted = weight > base_weight * 1.05
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 14, letterSpacing: 1, lineHeight: 1 }}>
        <span style={{ color: '#f59e0b' }}>{'★'.repeat(n)}</span>
        <span style={{ color: '#cbd5e1' }}>{'★'.repeat(3 - n)}</span>
      </span>
      {boosted && (
        <span style={{
          fontSize: 8, fontWeight: 800, color: '#dc2626',
          letterSpacing: '0.06em', lineHeight: 1,
        }}>UP</span>
      )}
    </div>
  )
}

// ── Priority Profile 테이블 ──────────────────────────────────────
function PriorityProfile({ items }: { items: WeightProfileItem[] }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {/* 섹션 타이틀 */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, letterSpacing: '0.03em' }}>
          YOUR PRIORITY PROFILE
        </div>
        <div style={{ fontSize: 12, color: COLORS.inkMuted, marginTop: 3 }}>
          Fit Score 산출 기준 · ★ 높을수록 점수 비중이 크며, 귀하의 설문에 따라 조정됩니다
        </div>
      </div>

      {/* 테이블 컨테이너 */}
      <div style={{
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: RADIUS.card,
        overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr',
          backgroundColor: COLORS.ink,
          padding: '9px 14px',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', textAlign: 'center' }}>Priority</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ffffff', paddingLeft: 12 }}>Dimension</span>
        </div>

        {/* 데이터 행 */}
        {items.map((item, i) => {
          const isTriggered = item.is_triggered
          const rowBg = isTriggered
            ? (i % 2 === 0 ? '#EFF6FF' : '#DBEAFE')
            : (i % 2 === 0 ? '#f8fafc' : '#f1f5f9')

          return (
            <div
              key={item.dimension_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '64px 1fr',
                backgroundColor: rowBg,
                borderTop: `1px solid ${COLORS.hairline}`,
                minHeight: 56,
              }}
            >
              {/* 별점 셀 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: `1px solid ${COLORS.hairline}`,
                padding: '10px 0',
              }}>
                <StarRow weight={item.weight} base_weight={item.base_weight} />
              </div>

              {/* Dimension 셀 */}
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* 영문 ID + 사용자 요구 스펙 칩 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: isTriggered ? '#1e40af' : COLORS.ink,
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                  }}>
                    {item.dimension_id}
                  </span>
                  {item.required_spec && item.required_spec !== '-' && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color:           isTriggered ? '#1e40af' : '#64748b',
                      backgroundColor: isTriggered ? '#DBEAFE'  : '#f1f5f9',
                      border:          `1px solid ${isTriggered ? '#93C5FD' : '#cbd5e1'}`,
                      borderRadius: 4,
                      padding: '1px 6px',
                      whiteSpace: 'nowrap' as const,
                    }}>
                      {item.required_spec}
                    </span>
                  )}
                </div>

                {/* 한국어 설명 */}
                <span style={{
                  fontSize: 11,
                  color: COLORS.inkMuted,
                  lineHeight: 1.55,
                }}>
                  {DIM_DESC[item.dimension_id] ?? item.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 8,
        flexWrap: 'wrap' as const,
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: COLORS.inkFaint }}>
          <span style={{ color: '#f59e0b' }}>★★★</span> 고중요 &nbsp;
          <span style={{ color: '#f59e0b' }}>★★</span><span style={{ color: '#cbd5e1' }}>★</span> 중간 &nbsp;
          <span style={{ color: '#f59e0b' }}>★</span><span style={{ color: '#cbd5e1' }}>★★</span> 부차적
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#dc2626',
          border: '1px solid #fca5a5', borderRadius: 3, padding: '1px 5px',
        }}>UP</span>
        <span style={{ fontSize: 11, color: COLORS.inkFaint }}>= 귀하의 상태로 가중치 상향</span>
      </div>
    </div>
  )
}

// ── 사이즈 업 권장 배너 ─────────────────────────────────────────
function SizeUpBanner({ reason }: { reason: string }) {
  return (
    <div style={{
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      backgroundColor: '#FFF7CD',
      border: '1px solid #FCD34D',
      borderRadius: RADIUS.card,
      padding: '12px 14px',
      marginBottom: 20,
    }}>
      <AlertTriangle size={16} color="#92400e" style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 3 }}>
          사이즈 업 권장
        </div>
        <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.5 }}>{reason}</div>
      </div>
    </div>
  )
}

// ── 신발 카드 ────────────────────────────────────────────────────
function ShoePlaceholder() {
  return (
    <svg viewBox="0 0 200 100" style={{ width: '72%', maxWidth: 220, opacity: 0.5 }}>
      <path
        d="M10 70 C30 60 50 40 90 38 C120 36 140 44 160 48 C175 50 188 52 190 62 C190 70 180 74 160 74 L20 74 C12 74 8 74 10 70 Z"
        fill="#e2e8f0" stroke={COLORS.hairline} strokeWidth="1.5"
      />
    </svg>
  )
}

function ShoeCard({ shoe, imageUrl, onSelect }: {
  shoe: ShoeMatch
  imageUrl?: string | null
  onSelect: () => void
}) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: RADIUS.card,
      overflow: 'hidden',
    }}>
      <div className="flex items-start justify-between" style={{ padding: '16px 16px 14px' }}>
        <div style={{ minWidth: 0, paddingRight: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {shoe.model_name}
          </div>
          <div style={{ fontSize: 13, color: COLORS.inkFaint, marginTop: 2 }}>{shoe.brand}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.inkFaint }}>Fit score</div>
          <div style={{ lineHeight: 1, marginTop: 2, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 30, fontWeight: DISPLAY.weight, letterSpacing: DISPLAY.letterSpacing, color: COLORS.ink }}>
              {shoe.overall_score ?? '—'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.inkMuted }}>/100</span>
          </div>
        </div>
      </div>

      <div style={{
        height: 200,
        borderTop: `1px solid ${COLORS.hairline}`,
        borderBottom: `1px solid ${COLORS.hairline}`,
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 24px',
        boxSizing: 'border-box' as const,
      }}>
        {imageUrl
          ? <img
              src={imageUrl}
              alt={shoe.model_name}
              draggable={false}
              onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.removeAttribute('style') }}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          : <ShoePlaceholder />
        }
      </div>

      <button onClick={onSelect} className="w-full flex items-center justify-between"
        style={{ padding: '13px 16px', backgroundColor: 'transparent', color: COLORS.ink, cursor: 'pointer' }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>See score details</span>
        <ChevronRight size={18} strokeWidth={2} />
      </button>
    </div>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────────────
export default function ShoeComparison() {
  const navigate = useNavigate()
  const [session,  setSession]  = useState<ScanSession | null>(null)
  const [imageMap, setImageMap] = useState<Record<string, string | null>>({})

  useEffect(() => {
    const raw = sessionStorage.getItem('scanSession')
    if (!raw) { navigate('/', { replace: true }); return }
    const s = JSON.parse(raw) as ScanSession
    if (!s.matchedShoes) { navigate('/report/case', { replace: true }); return }
    setSession(s)

    fittingApi.shoeProducts()
      .then(({ products }) => {
        const map: Record<string, string | null> = {}
        products.forEach(p => { map[p.product_code] = p.image_url ?? null })
        setImageMap(map)
      })
      .catch(() => {})
  }, [navigate])

  if (!session) return null

  const shoes: ShoeMatch[] = session.matchedShoes || []
  const profile: WeightProfileItem[] = session.weightProfile?.length
    ? session.weightProfile
    : DEFAULT_PROFILE

  return (
    <div className="min-h-full w-full bg-white flex justify-center" style={{ fontFamily: FONT, color: COLORS.ink }}>
      <div className="w-full px-4 pt-6 pb-10" style={{ maxWidth: PAGE.maxWidth }}>

        <TopNav
          canGoBack
          onBack={() => navigate('/report/case')}
          onClose={() => navigate('/')}
        />

        <h1 style={{ fontSize: 32, fontWeight: DISPLAY.weight, letterSpacing: DISPLAY.letterSpacing,
          color: COLORS.ink, lineHeight: 1.15 }}>
          Fit Compatibility
        </h1>
        <p style={{ fontSize: 14, color: COLORS.inkMuted, lineHeight: 1.45, marginTop: 8, marginBottom: 24 }}>
          {shoes.length > 0
            ? `${shoes.length} matches ranked for your foot profile.`
            : 'No matches found for your foot profile.'}
        </p>

        {/* 사이즈 업 배너 */}
        {session.sizeUpRecommended && session.sizeUpReason && (
          <SizeUpBanner reason={session.sizeUpReason} />
        )}

        {/* Priority Profile 테이블 */}
        <PriorityProfile items={profile} />

        {/* 신발 카드 리스트 */}
        <div className="flex flex-col" style={{ gap: 16 }}>
          {shoes.length === 0 && (
            <p style={{ textAlign: 'center', padding: '48px 20px', color: COLORS.inkMuted, fontSize: 14, lineHeight: 1.7 }}>
              No shoe matches returned from the server.<br />Try generating a case report again.
            </p>
          )}
          {shoes.map((shoe, i) => (
            <ShoeCard
              key={shoe.product_code || i}
              shoe={shoe}
              imageUrl={imageMap[shoe.product_code]}
              onSelect={() => navigate(`/report/shoes/${encodeURIComponent(shoe.product_code)}`)}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
