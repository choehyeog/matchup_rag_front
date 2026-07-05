import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { ScanSession } from '@/types/api'
import { parseMeasurements } from '@/types/api'
import styles from './QuickReport.module.css'

export default function QuickReport() {
  const navigate = useNavigate()
  const [session, setSession] = useState<ScanSession | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('scanSession')
    if (!raw) { navigate('/', { replace: true }); return }
    try { setSession(JSON.parse(raw) as ScanSession) }
    catch { navigate('/', { replace: true }) }
  }, [navigate])

  if (!session) return null

  const measurements = parseMeasurements(session.cfdData)
  const paragraphs = session.quickReportText
    ? session.quickReportText.split('\n\n').filter(Boolean)
    : []

  return (
    <div className={styles.screen}>
      {/* Top nav */}
      <nav className={styles.topNav}>
        <span className={styles.navBtnHidden} aria-hidden>
          <span style={{ width: 22, height: 22, display: 'block' }} />
        </span>
        <button className={styles.navBtn} onClick={() => navigate('/')} aria-label="닫기">
          <X size={22} strokeWidth={1.8} />
        </button>
      </nav>

      {/* Display header */}
      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Your 3D Fit Profile.</h1>
        <p className={styles.subtitle}>What to know before buying your next shoes.</p>
      </div>

      {/* Measurements */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Measurements.</h2>

        <div className={styles.photoRow}>
          <FootPhoto url={session.leftPhotoUrl} side="Left" />
          <FootPhoto url={session.rightPhotoUrl} side="Right" />
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span className={styles.tableHeaderLabel}>mm</span>
            <span className={styles.tableHeaderCol}>Left</span>
            <span className={styles.tableHeaderCol}>Right</span>
          </div>
          {measurements.map((m) => (
            <div key={m.label} className={styles.tableRow}>
              <span className={styles.tableRowLabel}>{m.label}</span>
              <span className={styles.tableRowVal}>{m.left > 0 ? m.left.toFixed(1) : '—'}</span>
              <span className={styles.tableRowVal}>{m.right > 0 ? m.right.toFixed(1) : '—'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Fit Report */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Fit Report.</h2>
        <div className={styles.reportCard}>
          {paragraphs.length > 0 ? (
            paragraphs.map((para, i) => (
              <p key={i} className={styles.reportParagraph}>{para}</p>
            ))
          ) : (
            <p className={styles.reportEmpty}>리포트를 불러오는 중입니다...</p>
          )}
        </div>
      </section>

      {/* CTAs */}
      <div className={styles.ctaBlock}>
        <button className={styles.primaryBtn} onClick={() => navigate('/report/deep-survey')}>
          Get My Full Fit Report
        </button>
        <p className={styles.finePrint}>
          MatchUp can also use this same scan to compare your feet with specific shoes and recommend a size.
        </p>
        <button className={styles.saveBtn} onClick={() => alert('결과가 저장되었습니다.')}>
          Save Your Results
        </button>
      </div>
    </div>
  )
}

function FootPhoto({ url, side }: { url?: string; side: string }) {
  return (
    <div className={styles.photo}>
      {url ? (
        <img src={url} alt={`${side} foot`} className={styles.photoImg} />
      ) : (
        <>
          <svg className={styles.photoPlaceholderIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <span className={styles.photoPlaceholderLabel}>{side} foot</span>
        </>
      )}
    </div>
  )
}
