import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import styles from './ScanComplete.module.css'

export default function ScanComplete() {
  const navigate = useNavigate()
  const [rightPhoto, setRightPhoto] = useState<string | null>(null)
  const [leftPhoto, setLeftPhoto] = useState<string | null>(null)
  const [paperSize, setPaperSize] = useState<string>('A4')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const r = sessionStorage.getItem('scanRightPhoto')
    const l = sessionStorage.getItem('scanLeftPhoto')
    const p = sessionStorage.getItem('scanPaperSize')
    if (!r || !l) {
      navigate('/scan', { replace: true })
      return
    }
    setRightPhoto(r)
    setLeftPhoto(l)
    setPaperSize(p ?? 'A4')
  }, [navigate])

  async function handleSubmit() {
    if (!rightPhoto || !leftPhoto) return
    setLoading(true)
    try {
      // TODO: replace with real API call
      // await fetch('/api/v1/scan/submit', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      //   body: JSON.stringify({ right_photo: rightPhoto, left_photo: leftPhoto, paper_size: paperSize }),
      // })
      await new Promise(r => setTimeout(r, 1800))
      setSent(true)
      sessionStorage.removeItem('scanRightPhoto')
      sessionStorage.removeItem('scanLeftPhoto')
    } catch (err) {
      console.error('전송 실패:', err)
      alert('전송에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className={styles.screen}>
        <div className={styles.successBox}>
          <CheckCircle size={52} color="#16a34a" strokeWidth={1.6} />
          <h2 className={styles.successTitle}>전송 완료!</h2>
          <p className={styles.successDesc}>발 사진이 성공적으로 전송되었습니다. 분석 결과를 기다려 주세요.</p>
          <button className={styles.primaryBtn} onClick={() => navigate('/')}>
            홈으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>촬영 완료</h1>
        <p className={styles.subtitle}>두 발 사진이 모두 준비되었습니다.</p>
      </div>

      {/* Photo previews */}
      <div className={styles.photoRow}>
        <div className={styles.photoCard}>
          <div className={styles.photoLabel}>오른발</div>
          {rightPhoto && (
            <img src={rightPhoto} alt="오른발" className={styles.photoImg} />
          )}
        </div>
        <div className={styles.photoCard}>
          <div className={styles.photoLabel}>왼발</div>
          {leftPhoto && (
            <img src={leftPhoto} alt="왼발" className={styles.photoImg} />
          )}
        </div>
      </div>

      {/* Paper size info */}
      <div className={styles.infoCard}>
        <span className={styles.infoLabel}>종이 크기</span>
        <span className={styles.infoValue}>{paperSize === 'LETTER' ? 'US Letter (8.5" × 11")' : 'A4 (210 × 297 mm)'}</span>
      </div>

      <div className={styles.spacer} />

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.primaryBtn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '전송 중...' : '분석 시작'}
        </button>
        <button className={styles.retakeBtn} onClick={() => navigate('/scan')}>
          다시 찍기
        </button>
      </div>
    </div>
  )
}
