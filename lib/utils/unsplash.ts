/**
 * Unsplash 배너 이미지 헬퍼
 * 커뮤니티 설명에 기반하여 적절한 배너 이미지를 제안
 */

// 키워드 → Unsplash 검색어 매핑
const UNSPLASH_KEYWORDS: Record<string, string> = {
  // 기술/개발
  '기술': 'technology,coding',
  '개발': 'programming,code',
  '코딩': 'coding,developer',
  'AI': 'artificial-intelligence,technology',
  '스타트업': 'startup,office',

  // 비즈니스
  '비즈니스': 'business,office',
  '사업': 'business,entrepreneur',
  '창업': 'startup,entrepreneurship',
  '투자': 'finance,investment',
  '마케팅': 'marketing,digital',

  // 라이프스타일
  '음악': 'music,concert',
  '운동': 'fitness,sports',
  '여행': 'travel,adventure',
  '음식': 'food,culinary',
  '독서': 'books,library',
  '게임': 'gaming,esports',
  '영화': 'cinema,film',
  '사진': 'photography,camera',

  // 커뮤니티/소셜
  '네트워킹': 'networking,meetup',
  '모임': 'community,gathering',
  '토론': 'discussion,debate',

  // 기본값
  'default': 'community,collaboration,teamwork'
}

// Unsplash 이미지 ID 목록 (API 호출 대신 정적 이미지 사용)
const UNSPLASH_IMAGES: Record<string, string[]> = {
  'technology': [
    'photo-1518770660439-4636190af475', // circuit board
    'photo-1550751827-4bd374c3f58b', // laptop
    'photo-1531297484001-80022131f5a1', // tech workspace
  ],
  'business': [
    'photo-1507003211169-0a1dd7228f2d', // office
    'photo-1522071820081-009f0129c71c', // team meeting
    'photo-1542744173-8e7e53415bb0', // conference
  ],
  'startup': [
    'photo-1559136555-9303baea8ebd', // startup office
    'photo-1497215842964-222b430dc094', // modern workspace
    'photo-1552664730-d307ca884978', // team collaboration
  ],
  'community': [
    'photo-1529156069898-49953e39b3ac', // group of people
    'photo-1517486808906-6ca8b3f04846', // community gathering
    'photo-1491438590914-bc09fcaaf77a', // people connecting
  ],
  'music': [
    'photo-1511671782779-c97d3d27a1d4', // concert
    'photo-1514320291840-2e0a9bf2a9ae', // music performance
  ],
  'fitness': [
    'photo-1534438327276-14e5300c3a48', // gym
    'photo-1571019614242-c5c5dee9f50b', // workout
  ],
  'food': [
    'photo-1504674900247-0877df9cc836', // food
    'photo-1493770348161-369560ae357d', // cooking
  ],
  'travel': [
    'photo-1469854523086-cc02fe5d8800', // travel
    'photo-1476514525535-07fb3b4ae5f1', // adventure
  ],
  'default': [
    'photo-1521737711867-e3b97375f902', // team collaboration
    'photo-1522071820081-009f0129c71c', // meeting
    'photo-1517245386807-bb43f82c33c4', // workspace
  ]
}

/**
 * 설명에서 키워드를 추출하여 카테고리 반환
 */
function extractCategory(description: string): string {
  if (!description) return 'default'

  const lowerDesc = description.toLowerCase()

  for (const [keyword, _] of Object.entries(UNSPLASH_KEYWORDS)) {
    if (keyword !== 'default' && lowerDesc.includes(keyword.toLowerCase())) {
      // 키워드에 해당하는 카테고리 반환
      if (['기술', '개발', '코딩', 'AI'].some(k => lowerDesc.includes(k.toLowerCase()))) {
        return 'technology'
      }
      if (['비즈니스', '사업', '투자', '마케팅'].some(k => lowerDesc.includes(k.toLowerCase()))) {
        return 'business'
      }
      if (['창업', '스타트업'].some(k => lowerDesc.includes(k.toLowerCase()))) {
        return 'startup'
      }
      if (['네트워킹', '모임', '토론'].some(k => lowerDesc.includes(k.toLowerCase()))) {
        return 'community'
      }
      if (lowerDesc.includes('음악')) return 'music'
      if (lowerDesc.includes('운동') || lowerDesc.includes('피트니스')) return 'fitness'
      if (lowerDesc.includes('음식') || lowerDesc.includes('요리')) return 'food'
      if (lowerDesc.includes('여행')) return 'travel'
    }
  }

  return 'default'
}

/**
 * 커뮤니티 설명 기반 기본 배너 URL 생성
 * @param description 커뮤니티 설명
 * @param seed 랜덤 시드 (커뮤니티 ID 등)
 * @returns Unsplash 이미지 URL
 */
export function getDefaultBannerUrl(description?: string | null, seed?: string): string {
  const category = extractCategory(description || '')
  const images = UNSPLASH_IMAGES[category] || UNSPLASH_IMAGES['default']

  // seed가 있으면 일관된 이미지 선택, 없으면 첫 번째 이미지
  let index = 0
  if (seed) {
    // 간단한 해시 함수로 일관된 인덱스 생성
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i)
      hash = hash & hash
    }
    index = Math.abs(hash) % images.length
  }

  const imageId = images[index]
  return `https://images.unsplash.com/${imageId}?w=1200&h=300&fit=crop&crop=center`
}

/**
 * 카테고리별 추천 배너 URL 목록 반환
 * 설정 모달에서 선택지로 보여줄 때 사용
 */
export function getSuggestedBannerUrls(description?: string | null): string[] {
  const category = extractCategory(description || '')
  const images = UNSPLASH_IMAGES[category] || UNSPLASH_IMAGES['default']

  return images.map(imageId =>
    `https://images.unsplash.com/${imageId}?w=1200&h=300&fit=crop&crop=center`
  )
}

/**
 * Unsplash URL이 유효한지 확인
 */
export function isValidUnsplashUrl(url: string): boolean {
  if (!url) return false
  return url.startsWith('https://images.unsplash.com/') ||
         url.startsWith('https://source.unsplash.com/')
}
