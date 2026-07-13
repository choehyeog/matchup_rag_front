import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { fittingApi } from '@/api/fitting'
import { CASE_SURVEY, SPORT_OPTIONS } from '@/data/surveyQuestions'
import { flattenCaseReport } from '@/utils/reportUtils'
import type { ScanSession, ShoeMatch, CaseReportJson } from '@/types/api'
import styles from './CaseSurvey.module.css'

/* shoe-match-detail을 병렬 호출해 실제 점수로 정렬한 신발 목록을 반환 */
async function scoreShoes(
  cfdUuid: string,
  userId: string | null,
  sportType: string,
): Promise<ShoeMatch[]> {
  const { products } = await fittingApi.shoeProducts()
  console.log(`[scoreShoes] 전체 신발 ${products.length}개 로드`)

  const targets = products.filter(
    p => !p.sport_type || p.sport_type === sportType,
  )
  console.log(`[scoreShoes] sport_type="${sportType}" 대상 ${targets.length}개`)

  const results = await Promise.allSettled(
    targets.map(p =>
      fittingApi.shoeMatchDetail({
        cfd_uuid: cfdUuid,
        user_id: userId,
        sport_type: sportType,
        product_id: p.product_code,
      }),
    ),
  )

  const scored: ShoeMatch[] = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const d = r.value.detail
      console.log(`[scoreShoes] ✅ ${targets[i].product_code} → ${d.overall_score}점`)
      scored.push({
        product_code: targets[i].product_code,
        brand: d.brand,
        model_name: d.model_name,
        overall_score: d.overall_score,
        image_url: d.image_url,
        sport_type: sportType,
      })
    } else {
      console.warn(`[scoreShoes] ❌ ${targets[i].product_code} 실패:`, r.reason?.message)
    }
  })

  console.log(`[scoreShoes] 채점 완료: ${scored.length}/${targets.length}개 성공`)
  return scored.sort((a, b) => b.overall_score - a.overall_score)
}

export default function CaseSurvey() {
  const navigate = useNavigate()
  const [session,   setSession]   = useState<ScanSession | null>(null)
  const [sportType, setSportType] = useState('running')
  const [answers,   setAnswers]   = useState<Record<string, string>>({})
  const [cardIndex, setCardIndex] = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')

  useEffect(() => {
    const raw = sessionStorage.getItem('scanSession')
    if (!raw) { navigate('/', { replace: true }); return }
    setSession(JSON.parse(raw) as ScanSession)
  }, [navigate])

  const questions   = CASE_SURVEY[sportType] || []
  const totalCards  = questions.length
  const currentQ    = questions[cardIndex]
  const allAnswered = questions
    .filter(q => !q.optional && q.options.length > 0)
    .every(q => !!answers[q.id])

  function handleSportChange(value: string) {
    setSportType(value)
    setAnswers({})
    setCardIndex(0)
  }

  async function handleSubmit() {
    if (!session) return
    setLoading(true)

    // 발 사진(base64)은 QuickReport 이후 불필요 — 용량 절약을 위해 제거
    const { leftPhotoUrl: _l, rightPhotoUrl: _r, ...coreSession } = session

    let caseReportText = ''
    let caseReportSummary: string[] | undefined
    let caseReportData: CaseReportJson | undefined

    try {
      /* 1. 케이스 리포트 생성 */
      setLoadingMsg('리포트 생성 중...')
      const res = await fittingApi.caseReport({
        cfd_uuid: session.cfdData.cfd_uuid,
        user_id: session.cfdData.user_id || null,
        sport_type: sportType,
        case_survey_data: answers,
      })
      caseReportData    = res.integrated_case_solution
      caseReportText    = flattenCaseReport(res.integrated_case_solution)
      caseReportSummary = res.summary_bullets
    } catch (e) {
      console.warn('case-report API 실패:', e)
      caseReportText = '[리포트 생성 실패] 신발 적합도 결과를 확인하세요.'
    }

    /* 2. 신발 전체를 실제 측정값으로 병렬 채점 */
    let matchedShoes: ShoeMatch[] = []
    try {
      setLoadingMsg('신발 적합도 계산 중...')
      matchedShoes = await scoreShoes(
        session.cfdData.cfd_uuid,
        session.cfdData.user_id || null,
        sportType,
      )
    } catch (e) {
      console.warn('신발 채점 실패:', e)
    }

    /* 3. 세션 저장 후 이동
     * 이 시점 이후에는 quickReportText / deepReportText / surveyAnswers / 사진이
     * 더 이상 필요 없으므로 모두 제거해서 용량을 확보한다.
     * matchedShoes의 image_url도 제외 — ShoeDetail에서 shoe-match-detail API로 재조회한다.
     */
    const lean: ScanSession = {
      cfdData:           coreSession.cfdData,      // ShoeDetail API 호출에 필요
      sportType,
      caseSurveyAnswers: answers,
      caseReportData,
      caseReportText,
      caseReportSummary,
      matchedShoes: matchedShoes.map(({ image_url: _, ...rest }) => rest),
    }
    sessionStorage.setItem('scanSession', JSON.stringify(lean))
    setLoading(false)
    setLoadingMsg('')
    navigate('/report/case')
  }

  if (!session || !currentQ) return null

  return (
    <div className={styles.screen}>
      {/* Top nav */}
      <nav className={styles.topNav}>
        <button className={styles.navBtn}
          onClick={() => cardIndex === 0 ? navigate('/report/deep') : setCardIndex(i => i - 1)}
          aria-label="뒤로">
          <ArrowLeft size={22} strokeWidth={1.8} />
        </button>
        <button className={styles.navBtn} onClick={() => navigate('/')} aria-label="닫기">
          <X size={22} strokeWidth={1.8} />
        </button>
      </nav>

      {/* Display header */}
      <div className={styles.headerBlock}>
        <h1 className={styles.title}>Tell us more.</h1>
        <p className={styles.subtitle}>Scored against your foot shape and activity type.</p>
      </div>

      {/* Sport selector */}
      <div className={styles.sportSection}>
        <span className={styles.sportLabel}>Activity type</span>
        <div className={styles.sportGrid}>
          {SPORT_OPTIONS.map(s => (
            <button
              key={s.value}
              className={`${styles.sportBtn} ${sportType === s.value ? styles.sportSelected : ''} ${!s.enabled ? styles.sportDisabled : ''}`}
              onClick={() => s.enabled && handleSportChange(s.value)}
              disabled={!s.enabled}
            >
              {s.label}
              {!s.enabled && <span className={styles.badge}>준비중</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progress}>
        {questions.map((_, i) => (
          <div key={i} className={`${styles.progressDot} ${i === cardIndex ? styles.active : ''} ${i < cardIndex ? styles.done : ''}`} />
        ))}
      </div>

      {/* Current question card */}
      <div className={styles.cardSection}>
        <span className={styles.questionCategory}>{currentQ.category}</span>
        <p className={styles.questionLabel}>{currentQ.text}</p>

        {currentQ.options.map(opt => {
          const selected = answers[currentQ.id] === opt
          return (
            <label key={opt} className={`${styles.option} ${selected ? styles.selected : ''}`}>
              <input type="radio" name={currentQ.id} value={opt} checked={selected}
                onChange={() => setAnswers(prev => ({ ...prev, [currentQ.id]: opt }))}
                className={styles.hiddenInput} />
              <span className={styles.optionText}>{opt}</span>
              <span className={styles.checkIcon}><Check size={14} strokeWidth={2.5} /></span>
            </label>
          )
        })}

        {currentQ.freeTextPlaceholder && (
          <div className={styles.freeTextWrapper}>
            <div className={styles.freeTextHeader}>
              <span className={styles.freeTextLabel}>Optional</span>
              <span className={styles.freeTextCount}>
                {(answers[`${currentQ.id}_text`] || '').length} / {currentQ.freeTextMaxLength ?? 150}
              </span>
            </div>
            <textarea
              className={styles.freeTextInput}
              placeholder={currentQ.freeTextPlaceholder}
              rows={3}
              maxLength={currentQ.freeTextMaxLength ?? 150}
              value={answers[`${currentQ.id}_text`] || ''}
              onChange={e => setAnswers(prev => ({ ...prev, [`${currentQ.id}_text`]: e.target.value }))}
            />
          </div>
        )}
      </div>

      {/* Card navigation */}
      <div className={styles.navRow}>
        <button className={styles.cardNavBtn} onClick={() => setCardIndex(i => i - 1)}
          disabled={cardIndex === 0} aria-label="이전">
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <span className={styles.cardCount}>{cardIndex + 1} / {totalCards}</span>
        <button className={styles.cardNavBtn} onClick={() => setCardIndex(i => i + 1)}
          disabled={cardIndex === totalCards - 1} aria-label="다음">
          <ChevronRight size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Submit */}
      <button className={styles.submitBtn} disabled={!allAnswered || loading} onClick={handleSubmit}>
        {loading ? loadingMsg || '처리 중...' : 'Generate Personalized Report'}
      </button>
    </div>
  )
}
