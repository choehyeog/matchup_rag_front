import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Landing.module.css'

export default function Landing() {
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)
  const [showPolicy, setShowPolicy] = useState(false)

  function handleStart() {
    if (!agreed) {
      alert('개인정보 수집 및 이용에 동의해 주세요.')
      return
    }
    navigate('/scan')
  }

  return (
    <div className={styles.screen}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.wordmark}>MatchUp</div>
        <p className={styles.tagline}>Find shoes that actually fit your feet.</p>
        <img src="/scan/demo.webp" alt="발 스캔 예시" className={styles.heroImg} />
      </div>

      {/* Bottom sheet */}
      <div className={styles.sheet}>
        <p className={styles.sheetTitle}>발 사이즈 분석을 시작합니다</p>
        <p className={styles.sheetDesc}>
          A4 용지 위에 발을 올려 사진을 찍으면, AI가 발의 치수를 분석하고 나에게 맞는 신발을 추천합니다.
        </p>

        <label className={styles.consent}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className={styles.checkbox}
          />
          <span>
            발 사진 및 측정값이{' '}
            <button type="button" className={styles.policyLink} onClick={() => setShowPolicy(true)}>
              개인정보처리방침
            </button>
            에 따라 저장될 수 있음에 동의합니다.
          </span>
        </label>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={handleStart}>
            Start Scanning
          </button>
          <button className={styles.secondaryBtn} onClick={() => navigate('/scan/input')}>
            내 측정 기록 보기
          </button>
        </div>
      </div>

      {/* Privacy policy modal */}
      {showPolicy && (
        <div className={styles.modalBackdrop} onClick={() => setShowPolicy(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>개인정보 수집 및 이용 동의</div>
                <div className={styles.modalSub}>MatchUp 서비스</div>
              </div>
              <button className={styles.modalClose} onClick={() => setShowPolicy(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <p><strong>수집 항목:</strong> 발 사진(좌/우), 발 측정 데이터(길이, 폭, 볼 둘레 등)</p>
              <p><strong>수집 목적:</strong> 발 형태 분석, 신발 핏 리포트 생성, 개인화 추천 서비스 제공</p>
              <p><strong>보유 기간:</strong> 서비스 이용 종료 시까지 또는 이용자 요청 시 즉시 삭제</p>
              <p>위 항목에 동의하지 않으실 경우 서비스 이용이 제한될 수 있습니다.</p>
            </div>
            <button className={styles.modalConfirm} onClick={() => { setAgreed(true); setShowPolicy(false) }}>
              동의합니다
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
