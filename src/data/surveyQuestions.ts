export type QuestionType = 'radio' | 'image_radio' | 'checkbox' | 'select' | 'number'

export interface Question {
  id: string
  label: string
  type: QuestionType
  options?: string[]
  apiCard: string
}

export interface SurveyCard {
  cardIndex: number
  title: string
  questions: Question[]
}

// 심층 설문 5개 카드 (survey_schema.json 기반)
export const DEEP_SURVEY_CARDS: SurveyCard[] = [
  {
    cardIndex: 0,
    title: '기본 신체 지표',
    questions: [
      { id: 'gender', label: '성별을 선택해 주세요.', type: 'radio', options: ['남성', '여성', '기타'], apiCard: 'card1_physical' },
      { id: 'age_group', label: '연령대를 선택해 주세요.', type: 'select', options: ['10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대 이상'], apiCard: 'card1_physical' },
      { id: 'height', label: '키(신장)를 입력해 주세요. (cm)', type: 'number', apiCard: 'card1_physical' },
      { id: 'weight_status', label: '본인의 평소 체중 상태를 선택해 주세요.', type: 'select', options: ['가벼운편', '정상', '과체중', '비만'], apiCard: 'card1_physical' },
    ],
  },
  {
    cardIndex: 1,
    title: '발 아치 & 발도장 분석',
    questions: [
      {
        id: 'arch_shape_mirror', label: '체중을 싣고 섰을 때, 거울 속 발 안쪽 곡선(아치)은 어떤가요?', type: 'image_radio',
        options: ['바닥에 완전히 밀착되어 아치 공간이 전혀 없다.', '완만한 곡선을 그리며 바닥과 적당히 떨어져 있다.', '동굴이 매우 높고 깊어 손가락이 쉽게 쑥 들어간다.'],
        apiCard: 'card2_symptoms',
      },
      {
        id: 'footprint_shape', label: '물기 있는 발로 바닥을 딛고 일어섰을 때, 찍히는 발도장 모양은?', type: 'image_radio',
        options: ['잘록한 곳 없이 발바닥 전체가 뚱뚱하게 다 찍힌다.', '중간 부분이 절반쯤 부드럽게 파여서 찍힌다.', '앞등과 뒤꿈치만 찍히고 중간 아치 부위는 끊겨 있다.'],
        apiCard: 'card2_symptoms',
      },
    ],
  },
  {
    cardIndex: 2,
    title: '발가락 모양',
    questions: [
      {
        id: 'big_toe_shape', label: '엄지발가락 모양이 어떻게 보이시나요?', type: 'image_radio',
        options: ['일직선으로 곧게 뻗어 있다.', '안쪽으로 살짝 휘어 뼈가 조금 보이기 시작한다.', '눈에 띄게 휘었고 뼈가 돌출되어 가끔 빨갛게 붓는다.'],
        apiCard: 'card3_arch_pain',
      },
      {
        id: 'other_toes_shape', label: '2, 3, 4번째 발가락 모양이 어떠한가요?', type: 'image_radio',
        options: ['평평하게 잘 펴져 있다.', '발가락 마디가 위로 솟아 구부러져 있다.', '발가락 끝이 아래로 완전히 꺾여 움츠러들어 있다.'],
        apiCard: 'card3_arch_pain',
      },
    ],
  },
  {
    cardIndex: 3,
    title: '신체 및 보행 상태',
    questions: [
      {
        id: 'pain_joints', label: '오래 걷고 난 후, 발 외에 피로하거나 통증이 발생하는 관절은? (중복 선택)', type: 'checkbox',
        options: ['발목 주변', '정강이 안쪽/앞쪽', '무릎 안쪽', '무릎 바깥쪽', '허리/골반'],
        apiCard: 'card4_medical',
      },
      {
        id: 'ankle_stability', label: '평소 평지나 계단을 걸을 때 발목이 흔들리거나 삐끗하는 정도는?', type: 'radio',
        options: ['항상 안정적이다.', '과거에 심하게 삐어서 치료를 받은 적이 있다.', '특별한 이유 없이 상습적으로 자주 발목을 삐끗한다.'],
        apiCard: 'card4_medical',
      },
      {
        id: 'diagnosed_conditions', label: '의사로부터 다음과 같은 진단을 받으신 적이 있나요? (중복 선택)', type: 'checkbox',
        options: ['당뇨병', '류마티스 관절염', '말초신경병증(저림/감각저하)', '없음'],
        apiCard: 'card4_medical',
      },
    ],
  },
  {
    cardIndex: 4,
    title: '신발 마모 패턴',
    questions: [
      {
        id: 'shoe_wear_outsole', label: '자주 신는 운동화 바닥면을 뒤집어 보았을 때, 어디가 가장 많이 닳아 있나요?', type: 'image_radio',
        options: ['바깥쪽 테두리 모서리만 급격하게 사선으로 깎여 닳았다.', '안쪽 면이 평평하게 완전히 마모되었거나 안쪽이 더 많이 닳았다.', '가운데를 중심으로 양쪽이 비교적 균일하게 마모되었다.'],
        apiCard: 'card5_lifestyle',
      },
      {
        id: 'shoe_wear_heel', label: '신발을 평평한 바닥에 내려놓고 뒤에서 보았을 때, 신발 자체가 한쪽으로 기울어 있나요?', type: 'image_radio',
        options: ['신발 뒤축 기둥이 안쪽(내측)으로 완전히 가라앉으며 찌그러졌다.', '신발 뒤축이 바깥쪽(외측)으로 밀려나며 벌어지듯 주저앉았다.', '찌그러짐 현상 없이 중앙 축이 일직선으로 곧게 서 있다.'],
        apiCard: 'card5_lifestyle',
      },
    ],
  },
]

// 케이스 설문 — 러닝 (9문항)
export interface CaseQuestion {
  id: string
  category: string
  text: string
  options: string[]
  optional?: boolean            // true이면 미답변 상태에서도 제출 가능
  freeTextPlaceholder?: string  // 설정 시 옵션 아래에 선택 입력란 표시
  freeTextMaxLength?: number    // 입력 최대 글자 수 (기본값 150)
}

export const CASE_SURVEY: Record<string, CaseQuestion[]> = {
  running: [
    {
      id: 'Q01', category: 'Kinematics',
      text: 'Which part of your foot makes initial contact with the ground at your sustainable running pace?',
      options: [
        'Rearfoot Strike (RFS): Heel hits hard first with noticeable shock passing up the shin.',
        'Midfoot Strike (MFS): Flat landing, distributing the weight evenly across the center.',
        'Forefoot Strike (FFS): Landing on the ball of the foot/toes, ankles feel highly loaded.',
      ],
    },
    {
      id: 'Q02', category: 'Subtalar Mechanics',
      text: 'How do your ankles behave or how does your shoe wear out during the mid-stance phase?',
      options: [
        'Overpronation: Ankles collapse inward; inner side of the shoe sole wears down faster.',
        'Supination / Underpronation: Weight shifts to the outer edge; outer sole wears down faster.',
        'Neutral Stride: Ankles stay aligned dynamically; uniform wear across the center-rear outsole.',
      ],
    },
    {
      id: 'Q03', category: 'Training Load',
      text: 'What is your average cumulative weekly running volume?',
      options: [
        'Low Volume: Under 10 km per week.',
        'Mid Volume: 10 km to 30 km per week.',
        'High Volume: Over 30 km per week.',
      ],
    },
    {
      id: 'Q04', category: 'Pathomechanics',
      text: 'Where do you primarily feel chronic localized discomfort or pain post-run?',
      options: [
        'Sharp pain at the bottom of the heel or arch.',
        'Dull aching pain along the inner shin.',
        'Stiffness or burning along the back of the heel (Achilles).',
        'Sharp pain on the outer side of the knee.',
        'Searing or tingling pain beneath the ball of the foot.',
        'No particular discomfort or pain.',
      ],
      freeTextPlaceholder: 'Any other area?',
    },
    {
      id: 'Q05', category: 'Volumetric Adaptability',
      text: 'What is your primary constraint regarding toe box fit during long runs?',
      options: [
        'Side compression pinching the metatarsal heads.',
        'Toes sliding forward causing bruised nails.',
        'Comfortable fit with no particular hot spots.',
      ],
      freeTextPlaceholder: 'Any other constraints?',
    },
    {
      id: 'Q06', category: 'Tribology & Surface',
      text: 'What is your primary running terrain environment?',
      options: [
        'Paved Roads / Concrete: Hard, high-vibration asphalt or concrete tracks.',
        'Treadmill / Gym Tracks: Indoor motorized belt surfaces.',
        'Trail / Off-road: Loose dirt, rocks, mud, wet grass, and roots.',
      ],
    },
    {
      id: 'Q07', category: 'Bending Stiffness',
      text: 'What is the midsole structure of the shoes you currently wear most often?',
      options: [
        'High Longitudinal Bending Stiffness: Snappy, rigid plate-driven platform maximizing propulsion.',
        'Low Longitudinal Bending Stiffness: Natural, high-flexibility platform mimicking intrinsic anatomy.',
        "I'm not sure.",
      ],
    },
    {
      id: 'Q08', category: 'Dorsal Fit & Closure',
      text: 'What is your primary fitting issue related to upper instep closure or rearfoot security?',
      options: [
        'High Instep Pressure: Focal pinching or numbness on top of the foot.',
        'Heel Slippage: Heel lifting out of the counter cup during toe-off.',
        'Neither of the above issues apply.',
      ],
    },
    {
      id: 'Q09', category: 'Additional Notes',
      text: 'Anything else you would like us to know? (Optional)',
      options: [],
      optional: true,
      freeTextPlaceholder: 'Please describe any other questions or concerns in detail.',
      freeTextMaxLength: 300,
    },
  ],
}

export const SPORT_OPTIONS = [
  { value: 'running', label: 'Running', enabled: true },
  { value: 'court_sports', label: 'Court Sports', enabled: false },
  { value: 'trail_outdoor', label: 'Trail & Outdoor', enabled: false },
  { value: 'dress_boots', label: 'Dress Shoes & Boots', enabled: false },
  { value: 'lifestyle_sneakers', label: 'Lifestyle Sneakers', enabled: false },
]

// 설문 답변 → API 카드 포맷으로 변환
export function buildDeepSurveyPayload(answers: Record<string, unknown>) {
  const cards: Record<string, Record<string, unknown>> = {
    card1_physical: {},
    card2_symptoms: {},
    card3_arch_pain: {},
    card4_medical: {},
    card5_lifestyle: {},
  }
  for (const card of DEEP_SURVEY_CARDS) {
    for (const q of card.questions) {
      const val = answers[q.id]
      if (val !== undefined) {
        cards[q.apiCard][q.id] = val
      }
    }
  }
  return cards
}
