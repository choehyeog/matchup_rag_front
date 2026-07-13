import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import type { ScanSession, CaseReportJson } from '@/types/api'
import styles from './CaseReport.module.css'

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

const ANALYSIS_LABELS: Record<string, string> = {
  scan_findings: 'Scan Analysis',
  survey_findings: 'Survey Insights',
  overall_assessment: 'Overall Assessment',
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  shoe_specification: 'Shoe Specification',
  wear_guide: 'Wear Guide',
  injury_prevention: 'Injury Prevention',
}

function ReportItem({
  label, guide, insight, warning = false,
}: {
  label: string
  guide?: string
  insight?: string
  warning?: boolean
}) {
  if (!guide) return null
  return (
    <div className={warning ? styles.warningItem : styles.item}>
      <div className={styles.itemLabel}>{label}</div>
      <div className={styles.itemGuide}>{parseBold(guide)}</div>
      {insight && <div className={styles.itemInsight}>{parseBold(insight)}</div>}
    </div>
  )
}

function CaseReportBody({ data }: { data: CaseReportJson }) {
  return (
    <>
      {data.activity_profile && (
        <section>
          <div className={styles.sectionHeader}>Activity Profile</div>
          <ReportItem
            label="Sport Biomechanics"
            guide={data.activity_profile.guide}
            insight={data.activity_profile.data_insight}
          />
        </section>
      )}

      {data.integrated_analysis && (
        <section>
          <div className={styles.sectionHeader}>Integrated Analysis</div>
          {Object.entries(ANALYSIS_LABELS).map(([key, label]) => {
            const item = data.integrated_analysis![key]
            return (
              <ReportItem key={key} label={label} guide={item?.guide} insight={item?.data_insight} />
            )
          })}
        </section>
      )}

      {data.recommendations && (
        <section>
          <div className={styles.sectionHeader}>Recommendations</div>
          {Object.entries(RECOMMENDATION_LABELS).map(([key, label]) => {
            const item = data.recommendations![key]
            return (
              <ReportItem
                key={key}
                label={label}
                guide={item?.guide}
                insight={item?.data_insight}
                warning={key === 'injury_prevention'}
              />
            )
          })}
        </section>
      )}
    </>
  )
}

export default function CaseReport() {
  const navigate = useNavigate()
  const [session, setSession] = useState<ScanSession | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('scanSession')
    if (!raw) { navigate('/', { replace: true }); return }
    const s = JSON.parse(raw) as ScanSession
    if (!s.caseReportData && !s.caseReportText) {
      navigate('/report/case-survey', { replace: true }); return
    }
    setSession(s)
  }, [navigate])

  if (!session) return null

  const bullets = session.caseReportSummary || []
  const hasShoes = (session.matchedShoes || []).length > 0

  return (
    <div className={styles.screen}>
      <nav className={styles.topNav}>
        <button className={styles.navBtn} onClick={() => navigate('/report/case-survey')} aria-label="뒤로">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <button className={styles.navBtn} onClick={() => navigate('/')} aria-label="닫기">
          <X size={22} strokeWidth={1.8} />
        </button>
      </nav>

      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Case Report.</h1>
        <p className={styles.subtitle}>Scored against your foot shape and running style.</p>
      </div>

      {bullets.length > 0 && (
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Key Findings</p>
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

      <div className={styles.reportBody}>
        {session.caseReportData
          ? <CaseReportBody data={session.caseReportData} />
          : (session.caseReportText || '').split('\n\n').filter(Boolean).map((para, i) => (
              <p key={i} className={styles.paragraph}>{para}</p>
            ))
        }
      </div>

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
