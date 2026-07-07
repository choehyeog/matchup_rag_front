import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import styles from './ScanGuide.module.css'

type Phase = 'right-guide' | 'right-camera' | 'left-guide' | 'left-camera'
type PaperSize = 'A4' | 'LETTER'

const RIGHT_STEPS = [
  { image: '/scan/start.webp',          title: '준비물 확인',        text: 'A4 또는 US Letter 크기의 깨끗한 종이 한 장이 필요합니다.', showPaperSizeModal: true },
  { image: '/scan/no_shoes.webp',       title: '신발을 벗어주세요',  text: '흰색 양말은 피해주세요.\n맨발도 괜찮습니다.' },
  { image: '/scan/paper.webp',          title: '종이를 벽에 붙여주세요', text: '종이의 짧은 면이 벽과 맞닿도록 바닥에 놓아주세요.' },
  { image: '/scan/right_foot.webp',     title: '오른발 위치',        text: '오른발을 종이 위에 올리고\n뒤꿈치를 벽에 붙여주세요.' },
  { image: '/scan/right_foot_above.webp', title: '촬영 방법',        text: '스마트폰을 허리 높이에서 수직으로 내려다보며 들어주세요.\n종이 네 모서리와 발 전체가 가이드 박스 안에 들어오게 맞춰주세요.' },
]

const LEFT_STEPS = [
  { image: '/scan/left_foot.webp',      title: '왼발 위치',          text: '이번엔 왼발을 종이 위에 올리고\n뒤꿈치를 벽에 붙여주세요.' },
  { image: '/scan/left_foot_above.webp', title: '촬영 방법',         text: '오른발과 같은 방법으로 왼발을 촬영합니다.\n종이 네 모서리와 발 전체가 가이드 박스 안에 들어오게 맞춰주세요.' },
]

// ── Canvas helpers (outside component — stable, no closure issues) ──

function sampleBrightness(
  data: Uint8ClampedArray, imgW: number,
  x: number, y: number, w: number, h: number,
): number {
  let total = 0, count = 0
  const step = 4
  for (let py = Math.max(0, y); py < y + h; py += step) {
    for (let px = Math.max(0, x); px < x + w && px < imgW; px += step) {
      const i = (py * imgW + px) * 4
      if (i + 2 < data.length) {
        total += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        count++
      }
    }
  }
  return count > 0 ? total / count : 0
}

function computeMotion(curr: Uint8ClampedArray, prev: Uint8ClampedArray): number {
  let diff = 0, count = 0
  for (let i = 0; i < curr.length; i += 32) {
    diff += Math.abs(curr[i] - prev[i]) + Math.abs(curr[i + 1] - prev[i + 1]) + Math.abs(curr[i + 2] - prev[i + 2])
    count++
  }
  return count > 0 ? diff / (count * 3) : 0
}

// ── Component ──

export default function ScanGuide({ cameraOnly = false }: { cameraOnly?: boolean }) {
  const navigate = useNavigate()

  const [phase, setPhase]             = useState<Phase>(cameraOnly ? 'right-camera' : 'right-guide')
  const [stepIndex, setStepIndex]     = useState(0)
  const [paperSize, setPaperSize]     = useState<PaperSize | null>(null)
  const [showPaperModal, setShowPaperModal] = useState(false)
  const [previewSrc, setPreviewSrc]   = useState<string | null>(null)
  const [warnings, setWarnings]       = useState<string[]>([])
  const [allClear, setAllClear]       = useState(false)

  const videoRef      = useRef<HTMLVideoElement>(null)
  const guideBoxRef   = useRef<HTMLDivElement>(null)
  const streamRef     = useRef<MediaStream | null>(null)
  const orientRef     = useRef({ beta: 0, gamma: 0 })
  const prevFrameRef  = useRef<Uint8ClampedArray | null>(null)
  const stableRef     = useRef(0)
  const intervalRef   = useRef<number | null>(null)
  const paperSizeRef  = useRef<PaperSize>('A4')

  const isCamera = phase === 'right-camera' || phase === 'left-camera'

  // Keep paperSizeRef in sync
  useEffect(() => { if (paperSize) paperSizeRef.current = paperSize }, [paperSize])

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    orientRef.current = { beta: e.beta ?? 0, gamma: e.gamma ?? 0 }
  }, [])

  // Camera lifecycle
  useEffect(() => {
    if (!isCamera) return
    startCameraAndAnalysis()
    return stopAll
  }, [isCamera]) // eslint-disable-line react-hooks/exhaustive-deps

  async function startCameraAndAnalysis() {
    // iOS 13+ requires explicit permission for DeviceOrientationEvent
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    if (typeof DOE.requestPermission === 'function') {
      try {
        const perm = await DOE.requestPermission()
        if (perm === 'granted') window.addEventListener('deviceorientation', handleOrientation)
      } catch { /* permission denied — orientation warnings won't show */ }
    } else {
      window.addEventListener('deviceorientation', handleOrientation)
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
    } catch (err) {
      console.error('카메라 접근 실패:', err)
    }

    intervalRef.current = window.setInterval(analyzeFrame, 500)
  }

  function stopAll() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (intervalRef.current !== null) { clearInterval(intervalRef.current); intervalRef.current = null }
    window.removeEventListener('deviceorientation', handleOrientation)
    stableRef.current = 0
    prevFrameRef.current = null
    setWarnings([])
    setAllClear(false)
  }

  function analyzeFrame() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return

    // Draw frame to small analysis canvas
    const W = 160, H = 280
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Replicate object-fit: cover
    const vA = video.videoWidth / video.videoHeight
    const cA = W / H
    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight
    if (vA > cA) { sw = sh * cA; sx = (video.videoWidth - sw) / 2 }
    else         { sh = sw / cA; sy = (video.videoHeight - sh) / 2 }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H)
    const { data } = ctx.getImageData(0, 0, W, H)

    // Guide box approx region
    const ps = paperSizeRef.current
    const pAspect = ps === 'LETTER' ? 85 / 110 : 210 / 297
    const boxW = Math.floor(W * 0.56)
    const boxH = Math.floor(boxW / pAspect)
    const boxX = Math.floor((W - boxW) / 2)
    const boxY = Math.floor((H - boxH) / 2)

    const inside  = sampleBrightness(data, W, boxX + 8, boxY + 8, boxW - 16, boxH - 16)
    const outside = sampleBrightness(data, W, 2, 2, Math.max(1, boxX - 4), H - 4)
    const motion  = prevFrameRef.current ? computeMotion(data, prevFrameRef.current) : 0
    prevFrameRef.current = new Uint8ClampedArray(data)

    // Collect warnings
    const { beta, gamma } = orientRef.current
    const w: string[] = []

    if      (beta  >  30) w.push('카메라가 앞쪽으로 많이 기울어져 있습니다')
    else if (beta  < -30) w.push('카메라가 뒤쪽으로 많이 기울어져 있습니다')
    if      (gamma >  30) w.push('카메라가 오른쪽으로 많이 기울어져 있습니다')
    else if (gamma < -30) w.push('카메라가 왼쪽으로 많이 기울어져 있습니다')
    if (inside < 100)            w.push('피사체가 어둡습니다')
    if (inside - outside < 40)   w.push('바닥 색상이 종이와 비슷하여 구분이 어렵습니다')
    if (motion > 20)             w.push('카메라를 고정해 주세요')

    setWarnings(w)

    if (w.length === 0) {
      stableRef.current += 1
      setAllClear(stableRef.current >= 2)       // show "준비 중" after 1s
      if (stableRef.current >= 3) {             // auto-capture after 1.5s
        stableRef.current = 0
        const src = capturePhoto()
        if (src) { stopAll(); setPreviewSrc(src) }
      }
    } else {
      stableRef.current = 0
      setAllClear(false)
    }
  }

  // ── Navigation ──

  function handleContinue() {
    const current = phase === 'right-guide' ? RIGHT_STEPS[stepIndex] : LEFT_STEPS[stepIndex]
    if (current?.showPaperSizeModal && !paperSize) { setShowPaperModal(true); return }

    if (phase === 'right-guide') {
      if (stepIndex < RIGHT_STEPS.length - 1) setStepIndex(i => i + 1)
      else setPhase('right-camera')
    } else if (phase === 'left-guide') {
      if (stepIndex < LEFT_STEPS.length - 1) setStepIndex(i => i + 1)
      else setPhase('left-camera')
    }
  }

  function handleBack() {
    if (phase === 'right-guide') {
      if (stepIndex === 0) navigate('/welcome')
      else setStepIndex(i => i - 1)
    } else if (phase === 'right-camera') {
      setPhase('right-guide'); setStepIndex(RIGHT_STEPS.length - 1)
    } else if (phase === 'left-guide') {
      if (stepIndex === 0) setPhase('right-camera')
      else setStepIndex(i => i - 1)
    } else if (phase === 'left-camera') {
      setPhase('left-guide'); setStepIndex(LEFT_STEPS.length - 1)
    }
  }

  function capturePhoto(): string | null {
    const video = videoRef.current
    const guideBox = guideBoxRef.current
    if (!video || !guideBox || !video.videoWidth) return null

    const container = video.parentElement!
    const scale = Math.max(container.clientWidth / video.videoWidth, container.clientHeight / video.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width  = guideBox.clientWidth  / scale
    canvas.height = guideBox.clientHeight / scale
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
      video,
      (video.videoWidth  - canvas.width)  / 2,
      (video.videoHeight - canvas.height) / 2,
      canvas.width, canvas.height,
      0, 0, canvas.width, canvas.height,
    )
    return canvas.toDataURL('image/jpeg', 0.92)
  }

  function handleManualShutter() {
    const src = capturePhoto()
    if (src) { stopAll(); setPreviewSrc(src) }
  }

  function handleRetake() {
    setPreviewSrc(null)
    startCameraAndAnalysis()
  }

  function handleUsePhoto() {
    if (!previewSrc) return
    if (phase === 'right-camera') {
      sessionStorage.setItem('scanRightPhoto', previewSrc)
      sessionStorage.setItem('scanPaperSize', paperSize ?? 'A4')
      setPreviewSrc(null)
      setPhase('left-guide')
      setStepIndex(0)
    } else {
      sessionStorage.setItem('scanLeftPhoto', previewSrc)
      navigate('/scan/complete')
    }
  }

  // ── Derived ──

  const steps = phase === 'right-guide' || phase === 'right-camera' ? RIGHT_STEPS : LEFT_STEPS
  const totalSteps = RIGHT_STEPS.length + LEFT_STEPS.length
  const globalStep =
    phase === 'right-guide'  ? stepIndex :
    phase === 'right-camera' ? RIGHT_STEPS.length :
    phase === 'left-guide'   ? RIGHT_STEPS.length + stepIndex :
    totalSteps

  const footLabel = phase === 'right-camera' || phase === 'right-guide' ? '오른발' : '왼발'
  const aspectRatio = paperSize === 'LETTER' ? '85/110' : '210/297'

  // ── Render ──

  return (
    <div className={`${styles.screen} ${isCamera ? styles.screenCamera : ''}`}>

      {/* Top nav */}
      <nav className={styles.nav}>
        <button className={styles.navBtn} onClick={handleBack} aria-label="뒤로">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        {!isCamera && <span className={styles.navLabel}>{footLabel} 촬영</span>}
        <button className={styles.navBtn} onClick={() => navigate('/welcome')} aria-label="닫기">
          <X size={22} strokeWidth={1.8} />
        </button>
      </nav>

      {/* ── Instruction view ── */}
      {!isCamera && (
        <div className={styles.guide}>
          <div className={styles.progress}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className={`${styles.dot} ${globalStep > i ? styles.dotDone : ''} ${globalStep === i ? styles.dotActive : ''}`} />
            ))}
          </div>
          <img src={steps[stepIndex]?.image} alt={steps[stepIndex]?.title} className={styles.guideImg} />
          <div className={styles.guideText}>
            <h2 className={styles.guideTitle}>{steps[stepIndex]?.title}</h2>
            <p className={styles.guideDesc}>{steps[stepIndex]?.text}</p>
          </div>
          <button className={styles.continueBtn} onClick={handleContinue}>계속</button>
        </div>
      )}

      {/* ── Camera view ── */}
      {isCamera && (
        <div className={styles.camera}>
          <div className={styles.videoWrap}>
            <video ref={videoRef} className={styles.video} playsInline muted />

            {/* Guide box overlay */}
            <div className={styles.guideOverlay}>
              <div
                ref={guideBoxRef}
                className={`${styles.guideBox} ${allClear ? styles.guideBoxOk : ''}`}
                style={{ aspectRatio }}
              >
                <p className={styles.guideBoxLabel}>
                  종이 4개 모서리와 발 전체를 박스 안에 맞춰주세요
                </p>
              </div>
            </div>

            {/* Quality feedback — top */}
            <div className={styles.feedbackArea}>
              {warnings.length > 0 ? (
                warnings.map((msg, i) => (
                  <div key={i} className={styles.warningItem}>⚠ {msg}</div>
                ))
              ) : (
                <div className={`${styles.okItem} ${allClear ? styles.okPulse : ''}`}>
                  {allClear ? '✓ 촬영 준비 중...' : '✓ 상태 양호'}
                </div>
              )}
            </div>
          </div>

          {/* Shutter controls */}
          <div className={styles.controls}>
            <div className={styles.footTag}>{footLabel}</div>
            <button
              className={`${styles.shutter} ${allClear ? styles.shutterOk : ''}`}
              onClick={handleManualShutter}
              aria-label="직접 촬영"
            />
            <span className={styles.shutterHint}>직접 촬영</span>
          </div>
        </div>
      )}

      {/* ── Preview sheet ── */}
      {previewSrc && (
        <div className={styles.previewBackdrop}>
          <div className={styles.previewSheet}>
            <p className={styles.previewTitle}>이 사진으로 보낼까요?</p>
            <img src={previewSrc} alt="촬영된 사진" className={styles.previewImg} />
            <div className={styles.previewActions}>
              <button className={styles.retakeBtn} onClick={handleRetake}>다시 찍기</button>
              <button className={styles.useBtn} onClick={handleUsePhoto}>사용</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Paper size modal ── */}
      {showPaperModal && (
        <div className={styles.previewBackdrop}>
          <div className={styles.previewSheet}>
            <p className={styles.paperModalTitle}>종이 크기를 선택하세요</p>
            <div className={styles.paperOptions}>
              <button className={styles.paperBtn} onClick={() => { setPaperSize('A4'); setShowPaperModal(false); setStepIndex(1) }}>
                A4 <span>(210 × 297 mm)</span>
              </button>
              <button className={styles.paperBtn} onClick={() => { setPaperSize('LETTER'); setShowPaperModal(false); setStepIndex(1) }}>
                US Letter <span>(8.5" × 11")</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
