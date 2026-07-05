import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import type { ScanSession } from '@/types/api'
import styles from './DeepReport.module.css'

export default function DeepReport() {
  const navigate = useNavigate()
  const [session, setSession] = useState<ScanSession | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('scanSession')
    if (!raw) { navigate('/', { replace: true }); return }
    const s = JSON.parse(raw) as ScanSession
    if (!s.deepReportText) { navigate('/report/deep-survey', { replace: true }); return }
    setSession(s)
  }, [navigate])

  if (!session) return null

  const paragraphs = (session.deepReportText || '').split('\n\n').filter(Boolean)

  return (
    <div className={styles.screen}>
      {/* Top nav */}
      <nav className={styles.topNav}>
        <button className={styles.navBtn} onClick={() => navigate('/report/deep-survey')} aria-label="뒤로">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <button className={styles.navBtn} onClick={() => navigate('/')} aria-label="닫기">
          <X size={22} strokeWidth={1.8} />
        </button>
      </nav>

      {/* Display header */}
      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Personal Footwear Guide.</h1>
        <p className={styles.subtitle}>Scored against your foot shape and survey responses.</p>
      </div>

      {/* Report */}
      <div className={styles.reportCard}>
        {paragraphs.map((para, i) => (
          <p key={i} className={styles.paragraph}>{para}</p>
        ))}
      </div>

      {/* CTAs */}
      <div className={styles.ctaBlock}>
        <button className={styles.primaryBtn} onClick={() => navigate('/report/case-survey')}>
          Get My Case Report
        </button>
        <button className={styles.saveBtn} onClick={() => alert('저장되었습니다.')}>
          Save My Results
        </button>
      </div>
    </div>
  )
}
