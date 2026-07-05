import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { COLORS, FONT, RADIUS, PAGE, DISPLAY } from '@/shared/theme'
import TopNav from '@/components/TopNav'
import { fittingApi } from '@/api/fitting'
import type { ScanSession, ShoeMatch } from '@/types/api'

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
      {/* Info row */}
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

      {/* Image band — admin_shoe_products.html에서 등록한 사진 표시 */}
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

      {/* Action row */}
      <button onClick={onSelect} className="w-full flex items-center justify-between"
        style={{
          padding: '13px 16px',
          backgroundColor: 'transparent',
          color: COLORS.ink,
          cursor: 'pointer',
        }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>See score details</span>
        <ChevronRight size={18} strokeWidth={2} />
      </button>
    </div>
  )
}

export default function ShoeComparison() {
  const navigate = useNavigate()
  const [session,  setSession]  = useState<ScanSession | null>(null)
  // product_code → image_url (NAS admin API에서 로드)
  const [imageMap, setImageMap] = useState<Record<string, string | null>>({})

  useEffect(() => {
    const raw = sessionStorage.getItem('scanSession')
    if (!raw) { navigate('/', { replace: true }); return }
    const s = JSON.parse(raw) as ScanSession
    if (!s.matchedShoes) { navigate('/report/case', { replace: true }); return }
    setSession(s)

    /* admin API에서 전체 신발 목록을 가져와 이미지 맵 생성
     * — admin_shoe_products.html에서 등록한 사진이 여기서 표시됨 */
    fittingApi.shoeProducts()
      .then(({ products }) => {
        const map: Record<string, string | null> = {}
        products.forEach(p => { map[p.product_code] = p.image_url ?? null })
        setImageMap(map)
      })
      .catch(() => {}) // 실패해도 플레이스홀더로 표시
  }, [navigate])

  if (!session) return null

  const shoes: ShoeMatch[] = session.matchedShoes || []

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
