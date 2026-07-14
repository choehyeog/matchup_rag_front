import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fittingApi } from '@/api/fitting'
import type { CfdMeasurement, ScanSession } from '@/types/api'
import styles from './ScanInput.module.css'

const SAMPLE_JSON: CfdMeasurement = {
  cfd_no: '070301',
  user_id: '',
  cfd_uuid: '070301',
  highheel: 'N',
  arch_length_l: 180.4,
  arch_length_r: 183.74,
  foot_length_l: 245.58,
  foot_length_r: 245.28,
  foot_width_l: 99.4,
  foot_width_r: 102.2,
  instep_girth_l: 256.18,
  instep_girth_r: 257.55,
  ball_distance_l: 104.66,
  ball_distance_r: 104.9,
  big_toe_angle_l: 16.15,
  big_toe_angle_r: 0.23,
  foot_ball_girth_l: 240.97,
  foot_ball_girth_r: 240.6,
  shoe_fitting_correct: 5.0,
  lang: 'kr',
}

export default function ScanInput() {
  const navigate = useNavigate()
  const leftPhotoRef = useRef<HTMLInputElement>(null)
  const rightPhotoRef = useRef<HTMLInputElement>(null)

  const [jsonText, setJsonText] = useState('')
  const [leftPhotoUrl, setLeftPhotoUrl] = useState<string>('')
  const [rightPhotoUrl, setRightPhotoUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleJsonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setJsonText(ev.target?.result as string)
    reader.readAsText(file, 'utf-8')
  }

  function handlePhoto(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setter(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function loadSample() {
    setJsonText(JSON.stringify(SAMPLE_JSON, null, 2))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    let cfd: CfdMeasurement
    try {
      cfd = JSON.parse(jsonText) as CfdMeasurement
    } catch {
      setError('JSON 형식이 올바르지 않습니다.')
      return
    }
    if (!cfd.cfd_uuid) {
      setError('cfd_uuid 필드가 없습니다.')
      return
    }

    setLoading(true)
    try {
      const res = await fittingApi.quickReport(cfd)
      const session: ScanSession = {
        cfdData: cfd,
        leftPhotoUrl: leftPhotoUrl || undefined,
        rightPhotoUrl: rightPhotoUrl || undefined,
        quickReportText: res.quick_report_text,
        quickReportData: res.quick_report_data,
      }
      sessionStorage.setItem('scanSession', JSON.stringify(session))
      navigate('/report/quick')
    } catch (err) {
      // API 연결 실패 시 mock으로 진행
      console.warn('API 연결 실패, mock으로 진행:', err)
      const session: ScanSession = {
        cfdData: cfd,
        leftPhotoUrl: leftPhotoUrl || undefined,
        rightPhotoUrl: rightPhotoUrl || undefined,
        quickReportText:
          'Your width and ball girth are larger than typical for your foot length, so some shoes may feel tight across the front even when the length feels right.\n\nLook for comments about a roomy toe box, wider fit, softer uppers, or styles that do not taper sharply near the toes. Sizing up may add room, but it can also create extra length or heel looseness, so compare width and shape before choosing a longer size.',
      }
      sessionStorage.setItem('scanSession', JSON.stringify(session))
      navigate('/report/quick')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.logo}>MatchUp</div>
        <p className={styles.desc}>발 측정 데이터를 입력하여 핏 리포트를 받아보세요</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* JSON 입력 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>측정 데이터 JSON</span>
            <button type="button" className={styles.sampleBtn} onClick={loadSample}>
              샘플 불러오기
            </button>
          </div>
          <p className={styles.cardDesc}>PHP 서버에서 전송되는 CFD JSON 파일을 업로드하거나 직접 붙여넣기하세요.</p>

          <label className={styles.fileLabel}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2v10M6 6l4-4 4 4" stroke="#0066cc" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="#0066cc" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span>JSON 파일 선택</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleJsonFile}
              style={{ display: 'none' }}
            />
          </label>

          <textarea
            className={styles.textarea}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={'{\n  "cfd_uuid": "...",\n  "foot_length_l": 260.83,\n  ...\n}'}
            spellCheck={false}
          />
        </div>

        {/* 발 사진 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>발 사진 (선택)</span>
          </div>
          <p className={styles.cardDesc}>PHP 서버가 연결되면 자동으로 전달됩니다. 테스트 시 직접 업로드하세요.</p>
          <div className={styles.photoRow}>
            <PhotoSlot
              label="왼발"
              photoUrl={leftPhotoUrl}
              onSelect={() => leftPhotoRef.current?.click()}
              onRemove={() => setLeftPhotoUrl('')}
            />
            <PhotoSlot
              label="오른발"
              photoUrl={rightPhotoUrl}
              onSelect={() => rightPhotoRef.current?.click()}
              onRemove={() => setRightPhotoUrl('')}
            />
          </div>
          <input ref={leftPhotoRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => handlePhoto(e, setLeftPhotoUrl)} />
          <input ref={rightPhotoRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => handlePhoto(e, setRightPhotoUrl)} />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!jsonText.trim() || loading}
        >
          {loading ? '리포트 생성 중...' : 'Get My Fit Report'}
        </button>
      </form>
    </div>
  )
}

function PhotoSlot({
  label, photoUrl, onSelect, onRemove,
}: {
  label: string
  photoUrl: string
  onSelect: () => void
  onRemove: () => void
}) {
  return (
    <div className={styles.photoSlot}>
      {photoUrl ? (
        <>
          <img src={photoUrl} alt={label} className={styles.photoImg} />
          <button type="button" className={styles.removePhoto} onClick={onRemove}>×</button>
        </>
      ) : (
        <button type="button" className={styles.photoAdd} onClick={onSelect}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#c8c8cc" strokeWidth="1.5"/>
            <path d="M12 8v8M8 12h8" stroke="#c8c8cc" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>{label}</span>
        </button>
      )}
      {!photoUrl && (
        <span className={styles.photoLabel}>{label}</span>
      )}
    </div>
  )
}
