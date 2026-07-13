import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { fittingApi } from '@/api/fitting'
import { DEEP_SURVEY_CARDS, buildDeepSurveyPayload } from '@/data/surveyQuestions'
import { flattenDeepReport } from '@/utils/reportUtils'
import type { ScanSession } from '@/types/api'
import styles from './DeepSurvey.module.css'

export default function DeepSurvey() {
  const navigate = useNavigate()
  const [session, setSession] = useState<ScanSession | null>(null)
  const [cardIndex, setCardIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('scanSession')
    if (!raw) { navigate('/', { replace: true }); return }
    setSession(JSON.parse(raw) as ScanSession)
  }, [navigate])

  function setAnswer(id: string, value: unknown) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  function toggleCheckbox(id: string, option: string) {
    const current = (answers[id] as string[]) || []
    const next = current.includes(option)
      ? current.filter(v => v !== option)
      : [...current, option]
    setAnswer(id, next)
  }

  const totalCards = DEEP_SURVEY_CARDS.length
  const allAnswered = DEEP_SURVEY_CARDS.every(card =>
    card.questions.every(q => {
      const v = answers[q.id]
      if (q.type === 'checkbox') return Array.isArray(v) && v.length > 0
      if (q.type === 'number') return v !== undefined && v !== ''
      return v !== undefined && v !== null
    })
  )

  async function handleSubmit() {
    if (!session) return
    setLoading(true)
    const cards = buildDeepSurveyPayload(answers)
    try {
      const res = await fittingApi.deepReport({
        cfd_uuid: session.cfdData.cfd_uuid,
        user_id: session.cfdData.user_id || null,
        quick_report_context: session.quickReportText || '',
        ...cards,
      } as import('@/types/api').DeepReportRequest)
      const updated: ScanSession = {
        ...session,
        surveyAnswers: cards as ScanSession['surveyAnswers'],
        deepReportData: res.deep_fitting_solution,
        deepReportText: flattenDeepReport(res.deep_fitting_solution),
      }
      sessionStorage.setItem('scanSession', JSON.stringify(updated))
      navigate('/report/deep')
    } catch (e) {
      console.warn('deep-report API 실패, mock으로 진행:', e)
      const updated: ScanSession = {
        ...session,
        surveyAnswers: cards as ScanSession['surveyAnswers'],
        deepReportText: '[Mock] Personal Footwear Guide\n\nYour foot data has been analyzed. Based on your survey responses, here is your personalized footwear guidance...',
      }
      sessionStorage.setItem('scanSession', JSON.stringify(updated))
      navigate('/report/deep')
    } finally {
      setLoading(false)
    }
  }

  if (!session) return null
  const card = DEEP_SURVEY_CARDS[cardIndex]

  return (
    <div className={styles.screen}>
      {/* Top nav */}
      <nav className={styles.topNav}>
        <button className={styles.navBtn}
          onClick={() => cardIndex === 0 ? navigate('/report/quick') : setCardIndex(i => i - 1)}
          aria-label="뒤로">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <button className={styles.navBtn} onClick={() => navigate('/report/quick')} aria-label="닫기">
          <X size={22} strokeWidth={1.8} />
        </button>
      </nav>

      {/* Display header */}
      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Tell us about you.</h1>
        <p className={styles.subtitle}>Personalize your fit guidance further.</p>
      </div>

      {/* Progress bar */}
      <div className={styles.progress}>
        {DEEP_SURVEY_CARDS.map((_, i) => (
          <div key={i} className={`${styles.progressDot} ${i === cardIndex ? styles.active : ''} ${i < cardIndex ? styles.done : ''}`} />
        ))}
      </div>

      {/* Card */}
      <div className={styles.cardSection}>
        <h2 className={styles.cardTitle}>{card.title}.</h2>

        {card.questions.map(q => (
          <div key={q.id} className={styles.question}>
            <p className={styles.questionLabel}>{q.label}</p>

            {(q.type === 'radio' || q.type === 'image_radio') && q.options?.map(opt => {
              const selected = answers[q.id] === opt
              return (
                <label key={opt} className={`${styles.option} ${selected ? styles.selected : ''}`}>
                  <input type="radio" name={q.id} value={opt} checked={selected}
                    onChange={() => setAnswer(q.id, opt)} className={styles.hiddenInput} />
                  <span className={styles.optionText}>{opt}</span>
                  <span className={styles.checkIcon}><Check size={15} strokeWidth={2.5} /></span>
                </label>
              )
            })}

            {q.type === 'checkbox' && q.options?.map(opt => {
              const checked = ((answers[q.id] as string[]) || []).includes(opt)
              return (
                <label key={opt} className={`${styles.option} ${checked ? styles.selected : ''}`}>
                  <input type="checkbox" value={opt} checked={checked}
                    onChange={() => toggleCheckbox(q.id, opt)} className={styles.hiddenInput} />
                  <span className={styles.optionText}>{opt}</span>
                  <span className={styles.checkIcon}><Check size={15} strokeWidth={2.5} /></span>
                </label>
              )
            })}

            {q.type === 'select' && (
              <select className={styles.select} value={(answers[q.id] as string) || ''}
                onChange={e => setAnswer(q.id, e.target.value)}>
                <option value="">선택하세요</option>
                {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            )}

            {q.type === 'number' && (
              <input type="number" className={styles.numberInput}
                value={(answers[q.id] as string) || ''}
                onChange={e => setAnswer(q.id, e.target.value)}
                placeholder="숫자 입력" />
            )}
          </div>
        ))}
      </div>

      {/* Card navigation */}
      <div className={styles.navRow}>
        <button className={styles.cardNavBtn} onClick={() => setCardIndex(i => i - 1)} disabled={cardIndex === 0} aria-label="이전">
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <span className={styles.cardCount}>{cardIndex + 1} / {totalCards}</span>
        <button className={styles.cardNavBtn} onClick={() => setCardIndex(i => i + 1)} disabled={cardIndex === totalCards - 1} aria-label="다음">
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Submit */}
      <button className={styles.submitBtn} disabled={!allAnswered || loading} onClick={handleSubmit}>
        {loading ? '리포트 생성 중...' : 'Generate Personalized Report'}
      </button>
    </div>
  )
}
