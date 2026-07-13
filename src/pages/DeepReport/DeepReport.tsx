import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import type { ScanSession, DeepReportJson } from '@/types/api'
import { SECTION_DEFAULT_ILLUSTRATION } from '@/lib/illustrations'
import { IllustrationImage } from '@/components/IllustrationImage'
import styles from './DeepReport.module.css'

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

// **굵은 텍스트** 또는 첫 문장에서 핵심 구문 추출
function extractKeyPhrase(guide?: string): string {
  if (!guide) return ''
  const boldMatch = guide.match(/\*\*(.*?)\*\*/)
  if (boldMatch) return boldMatch[1].replace(/[.。!?]$/, '')
  return guide.split(/[.。]/)[0].trim()
}

const SPEC_LABELS: Record<string, string> = {
  toe_box: '토룸',
  upper_material: '갑피 소재',
  outsole_feature: '아웃솔',
  cushion_insole: '쿠션 / 인솔',
}

const WEAR_LABELS: Record<string, string> = {
  asymmetric_fit: '비대칭 피팅',
  lacing_technique: '끈 매는 법',
  orthotic_prescription: '기능성 인솔',
}

function SummaryCard({ data }: { data: DeepReportJson }) {
  const rows = Object.entries(SPEC_LABELS)
    .map(([key, label]) => ({ label, phrase: extractKeyPhrase(data.shoe_specification?.[key]?.guide) }))
    .filter(r => r.phrase)
  if (!rows.length) return null
  return (
    <div className={styles.summaryCard}>
      {rows.map(({ label, phrase }) => (
        <div key={label} className={styles.summaryRow}>
          <span className={styles.summaryLabel}>{label}</span>
          <span className={styles.summaryText}>{phrase}</span>
        </div>
      ))}
    </div>
  )
}

function ReportSection({
  sectionKey, label, guide, insight, illustrationKey,
}: {
  sectionKey: string
  label: string
  guide?: string
  insight?: string
  illustrationKey?: string
}) {
  if (!guide) return null
  const ilKey = illustrationKey ?? SECTION_DEFAULT_ILLUSTRATION[sectionKey]
  return (
    <div className={styles.item}>
      <div className={styles.itemLabel}>{label}</div>
      <div className={styles.itemGuide}>{parseBold(guide)}</div>
      <IllustrationImage illustrationKey={ilKey} className={styles.itemIllustration} />
      {insight && <div className={styles.itemInsight}>{parseBold(insight)}</div>}
    </div>
  )
}

function DeepReportBody({ data }: { data: DeepReportJson }) {
  return (
    <>
      {data.shoe_specification && (
        <section>
          <div className={styles.sectionHeader}>신발 스펙 가이드</div>
          {Object.entries(SPEC_LABELS).map(([key, label]) => {
            const item = data.shoe_specification![key]
            return <ReportSection key={key} sectionKey={key} label={label} guide={item?.guide} insight={item?.data_insight} illustrationKey={item?.illustration_key} />
          })}
        </section>
      )}

      {data.how_to_wear && (
        <section>
          <div className={styles.sectionHeader}>착용 가이드</div>
          {Object.entries(WEAR_LABELS).map(([key, label]) => {
            const item = data.how_to_wear![key]
            return <ReportSection key={key} sectionKey={key} label={label} guide={item?.guide} insight={item?.data_insight} illustrationKey={item?.illustration_key} />
          })}
        </section>
      )}

      {data.precautions && (
        <section>
          <div className={styles.sectionHeader}>주의사항</div>
          {data.precautions.daily_caution && (
            <div className={styles.precautionItem}>
              <div className={styles.itemLabel}>일상 보행</div>
              <div className={styles.itemGuide}>{parseBold(data.precautions.daily_caution)}</div>
            </div>
          )}
          {data.precautions.shopping_tip && (
            <div className={styles.precautionItem}>
              <div className={styles.itemLabel}>구매 팁</div>
              <div className={styles.itemGuide}>{parseBold(data.precautions.shopping_tip)}</div>
            </div>
          )}
        </section>
      )}
    </>
  )
}

export default function DeepReport() {
  const navigate = useNavigate()
  const [session, setSession] = useState<ScanSession | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('scanSession')
    if (!raw) { navigate('/', { replace: true }); return }
    const s = JSON.parse(raw) as ScanSession
    if (!s.deepReportData && !s.deepReportText) { navigate('/report/deep-survey', { replace: true }); return }
    setSession(s)
  }, [navigate])

  if (!session) return null

  return (
    <div className={styles.screen}>
      <nav className={styles.topNav}>
        <button className={styles.navBtn} onClick={() => navigate('/report/deep-survey')} aria-label="뒤로">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <button className={styles.navBtn} onClick={() => navigate('/')} aria-label="닫기">
          <X size={22} strokeWidth={1.8} />
        </button>
      </nav>

      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Personal Footwear Guide.</h1>
        <p className={styles.subtitle}>Scored against your foot shape and survey responses.</p>
      </div>

      <div className={styles.reportBody}>
        {session.deepReportData
          ? <DeepReportBody data={session.deepReportData} />
          : (session.deepReportText || '').split('\n\n').filter(Boolean).map((para, i) => (
              <p key={i} className={styles.paragraph}>{para}</p>
            ))
        }
      </div>

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
