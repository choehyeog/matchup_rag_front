import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import type { ScanSession } from '@/types/api'
import styles from './CaseReport.module.css'

export default function CaseReport() {
  const navigate = useNavigate()
  const [session, setSession] = useState<ScanSession | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('scanSession')
    if (!raw) { navigate('/', { replace: true }); return }
    const s = JSON.parse(raw) as ScanSession
    if (!s.caseReportText) { navigate('/report/case-survey', { replace: true }); return }
    setSession(s)
  }, [navigate])

  if (!session) return null

  const paragraphs = (session.caseReportText || '').split('\n\n').filter(Boolean)
  const bullets = session.caseReportSummary || []
  const hasShoes = (session.matchedShoes || []).length > 0

  return (
    <div className={styles.screen}>
      {/* Top nav */}
      <nav className={styles.topNav}>
        <button className={styles.navBtn} onClick={() => navigate('/report/case-survey')} aria-label="뒤로">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <button className={styles.navBtn} onClick={() => navigate('/')} aria-label="닫기">
          <X size={22} strokeWidth={1.8} />
        </button>
      </nav>

      {/* Display header */}
      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Case Report.</h1>
        <p className={styles.subtitle}>Scored against your foot shape and running style.</p>
      </div>

      {/* Summary bullets */}
      {bullets.length > 0 && (
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Key findings</p>
          <ul className={styles.bulletList}>
            {bullets.map((b, i) => (
              <li key={i} className={styles.bullet}>
                <span className={styles.bulletDot} />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Report body */}
      <div className={styles.reportCard}>
        {paragraphs.map((para, i) => (
          <p key={i} className={styles.paragraph}>{para}</p>
        ))}
      </div>

      {/* CTAs */}
      <div className={styles.ctaBlock}>
        <button
          className={styles.primaryBtn}
          onClick={() => navigate('/report/shoes')}
          disabled={!hasShoes}
        >
          {hasShoes ? 'Fit Compatibility' : 'No Shoe Matches Found'}
        </button>
        <button className={styles.backBtn} onClick={() => navigate('/report/deep')}>
          Back to Deep Report
        </button>
      </div>
    </div>
  )
}
