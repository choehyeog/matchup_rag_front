import { useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, AlertTriangle, AlertCircle } from 'lucide-react'
import { COLORS, FONT, CARD_RADIUS, PAGE } from '@/shared/theme'
import TopNav from '@/components/TopNav'
import type { SafetyWarning } from '@/utils/shoeScoring'

/* ── Base foot image (inlined) ── */
const FOOT_IMAGE =
  "data:image/webp;base64,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"

/* ── Zone geometry — copied verbatim from style.css ── */
const CLIP_PATHS = {
  toe:  "polygon(90.65% 11.91%, 86.9% 6.57%, 83.96% 3.6%, 80.68% 1.61%, 77.54% 0.61%, 74.05% 0.04%, 71.11% 0.05%, 67.58% 0.66%, 64.25% 1.69%, 60.48% 3.0%, 58.84% 3.22%, 56.25% 3.17%, 53.73% 3.08%, 51.55% 3.15%, 46.56% 3.8%, 42.71% 4.84%, 39.14% 6.29%, 32.11% 7.7%, 30.03% 8.39%, 24.01% 11.28%, 18.21% 14.34%, 14.16% 16.69%, 7.27% 21.61%, 5.29% 23.71%, 4.08% 25.64%, 2.74% 33.38%, 13.25% 30.1%, 27.49% 25.46%, 47.76% 20.06%, 62.51% 16.33%, 77.41% 13.37%)",
  ball: "polygon(94.71% 37.01%, 95.51% 32.65%, 95.72% 27.04%, 93.95% 21.98%, 92.12% 17.59%, 91.42% 14.31%, 90.62% 12.06%, 77.52% 13.43%, 62.52% 16.39%, 27.42% 25.55%, 9.79% 31.35%, 2.81% 33.51%, 2.96% 37.83%, 3.35% 40.74%, 5.88% 45.61%, 8.35% 49.25%, 9.97% 51.47%, 24.75% 46.60%, 38.73% 42.51%, 58.45% 37.81%, 76.18% 36.01%)",
  heel: "polygon(94.1% 40.91%, 76.15% 40.09%, 60.33% 41.69%, 43.13% 46.07%, 30.13% 50.22%, 14.9% 56.44%, 20.94% 66.72%, 25.04% 76.24%, 29.17% 85.54%, 30.82% 88.2%, 34.02% 91.24%, 38.25% 94.34%, 45.89% 97.85%, 51.2% 99.56%, 56.71% 100.55%, 61.18% 100.77%, 65.75% 100.39%, 71.18% 99.4%, 76.63% 97.77%, 81.5% 95.53%, 86.72% 91.85%, 90.29% 88.8%, 95.04% 82.89%, 98.15% 76.45%, 98.67% 73.06%, 98.46% 66.08%, 97.66% 60.32%, 96.61% 57.06%, 95.38% 46.43%)",
}

const SCALE_COLORS = COLORS.scale
const METRIC_COLORS = COLORS.metric

const ZONE_OVERLAY_STYLE: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
  opacity: 0.5, filter: 'blur(19px)', transition: 'background-color 400ms ease',
}

function metricColor(value: number) {
  if (value < 35) return METRIC_COLORS.low
  if (value <= 70) return METRIC_COLORS.mid
  return METRIC_COLORS.high
}

/* ── Types ── */
export interface Metric {
  label: string
  value: number           // product 스펙의 척도 위치 0-100 (바 너비)
  userScore?: number      // user 요구의 척도 위치 0-100 (바 너비)
  matchScore?: number     // 두 값의 근접도 0-100 (Match 레이블에 표시)
  userDisplay?: string    // 예: "RFS (10mm 목표)"
  productDisplay?: string // 예: "8mm"
}
export interface FitZone  { toe: number; ball: number; heel: number }
export interface SizeOption { size: string; left: FitZone; right: FitZone }

export interface FitDetailsProps {
  fitScore?:        number
  product?:         { name: string; brand: string; image?: string | null }
  metrics?:         Metric[]
  warnings?:        SafetyWarning[]
  sizes?:           SizeOption[]
  initialSizeIndex?: number
  footImageSrc?:    string
  canGoBack?:       boolean
  onBack?:          () => void
  onClose?:         () => void
}

/* ── Default data ── */
const DEFAULT_METRICS: Metric[] = [
  { label: 'Heel-to-toe drop',   value: 45 },
  { label: 'Stability',          value: 87 },
  { label: 'Stack height',       value: 20 },
  { label: 'Outsole friction',   value: 65 },
  { label: 'Upper flexibility',  value: 78 },
  { label: 'Toe box width',      value: 56 },
  { label: 'Arch support',       value: 50 },
]

const DEFAULT_SIZES: SizeOption[] = [
  { size: 'US M 8',  left: { toe: 3, ball: 2, heel: 2 }, right: { toe: 2, ball: 1, heel: 2 } },
  { size: 'US M 9',  left: { toe: 3, ball: 3, heel: 3 }, right: { toe: 3, ball: 3, heel: 3 } },
  { size: 'US M 10', left: { toe: 4, ball: 4, heel: 4 }, right: { toe: 5, ball: 3, heel: 4 } },
]

/* ── Sub-components ── */
function MetricBar({ label, value, userScore, matchScore, userDisplay, productDisplay }: Metric) {
  const hasDual = userScore !== undefined
  const score = matchScore ?? value   // 바에 표시할 점수

  return (
    <div className="mb-4 last:mb-0">
      {/* 항목명 */}
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 3 }}>
        {label}
      </div>

      {/* Required / Product 텍스트 (이중 모드) */}
      {hasDual && (
        <div style={{ fontSize: 11, color: COLORS.inkFaint, marginBottom: 7, lineHeight: 1.4 }}>
          Required: {userDisplay ?? `${userScore}`}
          {'  /  '}
          Product: {productDisplay ?? `${value}`}
        </div>
      )}

      {/* Score 바 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasDual && (
          <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.inkFaint, width: 34, flexShrink: 0 }}>
            Score
          </span>
        )}
        <div className="rounded-full overflow-hidden" style={{ flex: 1, height: 8, background: COLORS.track }}>
          <div className="rounded-full transition-all duration-500"
            style={{ height: '100%', width: `${score}%`, backgroundColor: metricColor(score) }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: metricColor(score), width: 26, textAlign: 'right', flexShrink: 0 }}>
          {score}
        </span>
      </div>
    </div>
  )
}

/* 발 외곽 실루엣 — toe·ball·heel 폴리곤의 외곽 경계를 합산한 근사치.
 * 부모 div에 적용해 이미지·오버레이 모두 발 윤곽 안에만 렌더링되도록 클리핑. */
const FOOT_SILHOUETTE =
  "polygon(" +
  "90.65% 11.91%,86.9% 6.57%,83.96% 3.6%,80.68% 1.61%,77.54% 0.61%," +
  "74.05% 0.04%,71.11% 0.05%,67.58% 0.66%,64.25% 1.69%,60.48% 3.0%," +
  "58.84% 3.22%,56.25% 3.17%,53.73% 3.08%,51.55% 3.15%,46.56% 3.8%," +
  "42.71% 4.84%,39.14% 6.29%,32.11% 7.7%,30.03% 8.39%,24.01% 11.28%," +
  "18.21% 14.34%,14.16% 16.69%,7.27% 21.61%,5.29% 23.71%,4.08% 25.64%," +
  "2.74% 33.38%,2.96% 37.83%,3.35% 40.74%,5.88% 45.61%,8.35% 49.25%," +
  "9.97% 51.47%,14.9% 56.44%,20.94% 66.72%,25.04% 76.24%,29.17% 85.54%," +
  "30.82% 88.2%,34.02% 91.24%,38.25% 94.34%,45.89% 97.85%,51.2% 99.56%," +
  "56.71% 100%,61.18% 100%,65.75% 100%,71.18% 99.4%,76.63% 97.77%," +
  "81.5% 95.53%,86.72% 91.85%,90.29% 88.8%,95.04% 82.89%,98.15% 76.45%," +
  "98.67% 73.06%,98.46% 66.08%,97.66% 60.32%,96.61% 57.06%,95.38% 46.43%," +
  "94.1% 40.91%,95.51% 32.65%,95.72% 27.04%,93.95% 21.98%,92.12% 17.59%," +
  "91.42% 14.31%,90.62% 12.06%" +
  ")"

function Foot({ fit, flip = false, imageSrc }: { fit: FitZone; flip?: boolean; imageSrc: string }) {
  return (
    <div style={{
      position: 'relative',
      width: 69.81,
      height: 160,
      overflow: 'hidden',
      clipPath: FOOT_SILHOUETTE,           // ① 발 외곽 실루엣으로 전체 클리핑
      transform: flip ? 'scaleX(-1)' : undefined,
    }}>
      {/* 기본 발 이미지 */}
      <img src={imageSrc} alt="" draggable={false}
        className="select-none pointer-events-none"
        style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* 컬러 존 — 발 이미지 알파채널로 마스킹해 발 실루엣 밖 번짐 방지 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        WebkitMaskImage: `url(${imageSrc})`,  // ② 발 이미지 alpha로 마스킹
        WebkitMaskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskImage: `url(${imageSrc})`,
        maskSize: '100% 100%',
        maskRepeat: 'no-repeat',
      }}>
        {(['toe', 'ball', 'heel'] as const).map(zone => (
          <div key={zone} style={{
            ...ZONE_OVERLAY_STYLE,
            clipPath: CLIP_PATHS[zone],
            backgroundColor: SCALE_COLORS[fit[zone]],
          }} />
        ))}
      </div>
    </div>
  )
}

function ScaleLegend() {
  return (
    <div style={{ position: 'relative', paddingTop: 20, width: 186 }}>
      <div style={{ position: 'absolute', top: 0, left: -12, fontSize: '0.625rem', fontWeight: 400 }}>Snug</div>
      <div style={{ position: 'absolute', top: 0, right: -12, fontSize: '0.625rem', fontWeight: 400 }}>Roomy</div>
      <div style={{ height: 10, display: 'flex', opacity: 0.5 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} style={{ flex: 1, backgroundColor: SCALE_COLORS[n] }} />
        ))}
      </div>
    </div>
  )
}

const SIZE_LABEL_BASE_PX = 30
const SIZE_LABEL_MIN_PX  = 14

function SizeLabel({ text }: { text: string }) {
  const wrapRef    = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [fontSize, setFontSize] = useState(SIZE_LABEL_BASE_PX)

  useLayoutEffect(() => {
    const fit = () => {
      const wrap    = wrapRef.current
      const measure = measureRef.current
      if (!wrap || !measure) return
      const available = wrap.clientWidth - 1
      let size  = SIZE_LABEL_BASE_PX
      measure.style.fontSize = `${size}px`
      let width = measure.offsetWidth
      for (let i = 0; i < 3 && width > available && size > SIZE_LABEL_MIN_PX; i++) {
        size  = Math.max((size * available) / width, SIZE_LABEL_MIN_PX)
        measure.style.fontSize = `${size}px`
        width = measure.offsetWidth
      }
      setFontSize(size)
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (wrapRef.current) ro.observe(wrapRef.current)
    if (document.fonts?.ready) document.fonts.ready.then(fit)
    return () => ro.disconnect()
  }, [text])

  return (
    <div ref={wrapRef} style={{ flex: 1, minWidth: 0, marginInline: 8, textAlign: 'center', position: 'relative' }}>
      <span style={{ whiteSpace: 'nowrap', lineHeight: 1, fontSize }}>{text}</span>
      <span ref={measureRef} aria-hidden style={{
        position: 'absolute', left: 0, top: 0, visibility: 'hidden',
        whiteSpace: 'nowrap', pointerEvents: 'none', fontSize: SIZE_LABEL_BASE_PX,
      }}>{text}</span>
    </div>
  )
}

/* ── Main component ── */
export default function FitDetailsScreen({
  fitScore        = 78,
  product         = { name: 'Aero Glide 4', brand: 'Salomon', image: null },
  metrics         = DEFAULT_METRICS,
  warnings        = [],
  sizes           = DEFAULT_SIZES,
  initialSizeIndex = 1,
  footImageSrc    = FOOT_IMAGE,
  canGoBack       = true,
  onBack          = () => {},
  onClose         = () => {},
}: FitDetailsProps) {
  const safeInitialIndex = Math.min(Math.max(initialSizeIndex, 0), Math.max(sizes.length - 1, 0))
  const [sizeIndex, setSizeIndex] = useState(safeInitialIndex)
  const currentFit = sizes[sizeIndex] ?? { size: '—', left: { toe: 3, ball: 3, heel: 3 }, right: { toe: 3, ball: 3, heel: 3 } }

  const canGoPrev = sizeIndex > 0
  const canGoNext = sizeIndex < sizes.length - 1

  return (
    <div className="min-h-full w-full bg-white flex justify-center" style={{ fontFamily: FONT, color: COLORS.ink }}>
      <div className="w-full px-4 pt-6 pb-10" style={{ maxWidth: PAGE.maxWidth }}>

        <TopNav canGoBack={canGoBack} onBack={onBack} onClose={onClose} />

        {/* 안전 경고 배너 */}
        {warnings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {warnings.map((w, i) => {
              const isDanger = w.level === 'danger'
              return (
                <div key={i} style={{
                  borderRadius: 8,
                  border: `1px solid ${isDanger ? '#fca5a5' : '#fde68a'}`,
                  background: isDanger ? '#fff1f2' : '#fffbeb',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}>
                  <span style={{ flexShrink: 0, marginTop: 1, color: isDanger ? '#dc2626' : '#d97706' }}>
                    {isDanger
                      ? <AlertTriangle size={16} strokeWidth={2} />
                      : <AlertCircle size={16} strokeWidth={2} />
                    }
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isDanger ? '#dc2626' : '#92400e', marginBottom: 3 }}>
                      {w.title}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: isDanger ? '#7f1d1d' : '#78350f', lineHeight: 1.55 }}>
                      {w.body}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Fit score card */}
        <div style={{ backgroundColor: COLORS.cardBackground, borderRadius: CARD_RADIUS, overflow: 'hidden' }}>

          {/* ① Fit Score 타이틀 */}
          <div style={{ padding: '20px 20px 16px', textAlign: 'center', borderBottom: `1px solid ${COLORS.hairline}` }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, margin: 0 }}>
              Fit Score
            </h1>
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: COLORS.ink, lineHeight: 1.1, marginTop: 4 }}>
              {fitScore}
              <span style={{ fontSize: 15, fontWeight: 500, color: COLORS.inkMuted }}>/100</span>
            </div>
          </div>

          {/* ② 제품 사진 */}
          <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'center' }}>
            <div className="rounded-xl bg-neutral-50 flex items-center justify-center overflow-hidden"
              style={{ aspectRatio: '1 / 1', width: '100%', maxWidth: 200 }}>
              {product.image
                ? <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                : <svg viewBox="0 0 200 100" className="w-4/5 opacity-60">
                    <path d="M10 70 C30 60 50 40 90 38 C120 36 140 44 160 48 C175 50 188 52 190 62 C190 70 180 74 160 74 L20 74 C12 74 8 74 10 70 Z"
                      fill="none" stroke="#bbb" strokeWidth="2" />
                  </svg>
              }
            </div>
          </div>

          {/* ③ 제품명 + 브랜드 */}
          <div style={{ padding: '14px 20px 16px', textAlign: 'center', borderBottom: `1px solid ${COLORS.hairline}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{product.name}</div>
            <div style={{ fontSize: 13, color: COLORS.inkFaint, marginTop: 3 }}>{product.brand}</div>
          </div>

          {/* ④ 항목별 그래프 */}
          <div style={{ padding: '20px 20px 20px' }}>
            {metrics.map((m, i) => <MetricBar key={i} {...m} />)}
          </div>

        </div>

        {/* Foot fit visualizer */}
        <div style={{ marginTop: 32 }}>
          <h2 className="text-center font-bold" style={{ fontSize: 18, color: COLORS.ink }}>
            See how this model fits your feet
          </h2>
          <p className="text-center mt-1 mb-5" style={{ fontSize: 13, color: COLORS.inkMuted }}>
            See how sizing up or down will change the fit.
          </p>

          <div style={{
            backgroundColor: COLORS.cardBackground, borderRadius: CARD_RADIUS,
            paddingBlock: '40px 36px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <div style={{ display: 'flex', gap: 34 }}>
              <Foot fit={currentFit.left}  imageSrc={footImageSrc} />
              <Foot fit={currentFit.right} imageSrc={footImageSrc} flip />
            </div>

            <ScaleLegend />

            <p style={{ fontSize: '0.6875rem', fontWeight: 400, width: 246, textAlign: 'center' }}>
              See how sizing up or down affects the fit across different areas of your feet.
            </p>

            <div style={{
              display: 'flex', width: '100%', paddingInline: 26, boxSizing: 'border-box',
              justifyContent: 'space-between', alignItems: 'center',
              fontSize: '1.875rem', fontWeight: 600,
            }}>
              <button aria-label="Smaller size" disabled={!canGoPrev}
                onClick={() => canGoPrev && setSizeIndex(i => i - 1)}
                className="bg-transparent p-0 inline-flex items-center justify-center"
                style={{ color: COLORS.ink, opacity: canGoPrev ? 1 : 0.15, cursor: canGoPrev ? 'pointer' : 'auto' }}>
                <ChevronLeft size={50} strokeWidth={0.96} />
              </button>
              <SizeLabel text={currentFit.size} />
              <button aria-label="Larger size" disabled={!canGoNext}
                onClick={() => canGoNext && setSizeIndex(i => i + 1)}
                className="bg-transparent p-0 inline-flex items-center justify-center"
                style={{ color: COLORS.ink, opacity: canGoNext ? 1 : 0.15, cursor: canGoNext ? 'pointer' : 'auto' }}>
                <ChevronRight size={50} strokeWidth={0.96} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
