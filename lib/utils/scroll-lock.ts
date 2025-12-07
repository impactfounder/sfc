/**
 * 모달이 열릴 때 스크롤바로 인한 레이아웃 시프트를 방지하는 유틸리티 함수들
 * 
 * Radix UI의 Dialog, Sheet 등은 모달이 열릴 때 body에 overflow: hidden을 적용합니다.
 * 이로 인해 스크롤바가 사라지면서 레이아웃이 왼쪽으로 밀리는 문제가 발생합니다.
 * 
 * 해결 방법: body에 스크롤바 너비만큼 padding-right를 추가하여 공간을 유지합니다.
 * 
 * 여러 모달이 동시에 열릴 수 있으므로 ref counting을 사용합니다.
 */

const SCROLLBAR_WIDTH_VAR = '--scrollbar-width'
const BODY_PADDING_VAR = '--body-padding-right-original'

// ref counting을 위한 변수
let lockCount = 0
let originalPaddingRight: string | null = null

/**
 * 스크롤바의 너비를 계산합니다 (px)
 * 여러 방법을 시도하여 가장 정확한 값을 얻습니다
 */
function getScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0

  const root = document.documentElement
  const cached = root.style.getPropertyValue(SCROLLBAR_WIDTH_VAR)
  if (cached) {
    const width = parseInt(cached, 10)
    if (!isNaN(width) && width > 0) {
      return width
    }
  }

  // 방법 1: window.innerWidth와 document.documentElement.clientWidth의 차이
  // 이것이 가장 정확한 실제 스크롤바 너비입니다
  const scrollbarWidth1 = window.innerWidth - document.documentElement.clientWidth

  // 방법 2: 임시 요소를 만들어서 계산 (fallback)
  const outer = document.createElement('div')
  outer.style.visibility = 'hidden'
  outer.style.overflow = 'scroll'
  ;(outer.style as any).msOverflowStyle = 'scrollbar' // IE, Edge 대응
  outer.style.position = 'absolute'
  outer.style.top = '-9999px'
  outer.style.width = '100px'
  outer.style.height = '100px'
  document.body.appendChild(outer)

  const inner = document.createElement('div')
  inner.style.width = '100%'
  inner.style.height = '100%'
  outer.appendChild(inner)

  const scrollbarWidth2 = outer.offsetWidth - inner.offsetWidth

  document.body.removeChild(outer)

  // 두 방법 중 더 큰 값을 사용 (안전하게)
  const scrollbarWidth = Math.max(scrollbarWidth1, scrollbarWidth2)

  // CSS 변수로 캐싱
  if (scrollbarWidth > 0) {
    root.style.setProperty(SCROLLBAR_WIDTH_VAR, `${scrollbarWidth}`)
  }

  return scrollbarWidth
}

/**
 * 모달이 열릴 때 body에 스크롤바 너비만큼 padding을 추가합니다
 * 여러 모달이 동시에 열릴 수 있으므로 ref counting 사용
 * 
 * 주의: 인라인 스크립트가 이미 padding을 적용했을 수 있으므로 확인 필요
 */
export function lockBodyScroll(): void {
  if (typeof window === 'undefined') return

  const scrollbarWidth = getScrollbarWidth()
  
  // 스크롤바가 없는 경우 (모바일 등) 아무것도 하지 않음
  if (scrollbarWidth === 0) return

  lockCount++

  const body = document.body

  // 첫 번째 lock일 때만 원본 padding-right 값 저장
  if (lockCount === 1) {
    // 인라인 스크립트가 이미 적용했는지 확인
    const alreadyApplied = body.style.getPropertyValue('--scrollbar-fix-applied')
    const existingOriginalPadding = body.style.getPropertyValue('--body-padding-right-original')
    
    if (alreadyApplied && existingOriginalPadding) {
      // 인라인 스크립트가 이미 적용한 경우, 그 값을 사용
      originalPaddingRight = existingOriginalPadding
      // 추가로 스크롤바 너비만큼 더 추가 (모달이 열릴 때 overflow: hidden이 적용되므로)
      const currentPaddingRight = window.getComputedStyle(body).paddingRight
      const currentPaddingRightValue = parseInt(currentPaddingRight, 10) || 0
      // 이미 스크롤바 너비가 포함되어 있을 수 있으므로 확인
      const basePadding = parseInt(existingOriginalPadding, 10) || 0
      if (currentPaddingRightValue < basePadding + scrollbarWidth) {
        body.style.setProperty('padding-right', `${basePadding + scrollbarWidth}px`, 'important')
      }
    } else {
      // 인라인 스크립트가 적용하지 않은 경우 직접 처리
      const currentPaddingRight = window.getComputedStyle(body).paddingRight
      originalPaddingRight = currentPaddingRight || '0px'
      
      const currentPaddingRightValue = parseInt(originalPaddingRight, 10) || 0
      const newPaddingRight = currentPaddingRightValue + scrollbarWidth
      
      body.style.setProperty('--body-padding-right-original', originalPaddingRight, 'important')
      body.style.setProperty('padding-right', `${newPaddingRight}px`, 'important')
    }
  }
}

/**
 * 모달이 닫힐 때 body의 padding을 원래대로 복원합니다
 * 모든 모달이 닫힐 때만 실제로 복원
 * 
 * 주의: 인라인 스크립트가 이미 padding을 적용했을 수 있으므로 확인 필요
 */
export function unlockBodyScroll(): void {
  if (typeof window === 'undefined') return

  lockCount = Math.max(0, lockCount - 1)

  // 모든 모달이 닫힐 때만 실제로 복원
  if (lockCount === 0) {
    const body = document.body
    
    // 인라인 스크립트가 적용한 원본 padding이 있는지 확인
    const inlineOriginalPadding = body.style.getPropertyValue('--body-padding-right-original')
    
    if (originalPaddingRight !== null) {
      // 모달 lock에서 저장한 값으로 복원
      body.style.setProperty('padding-right', originalPaddingRight, 'important')
      originalPaddingRight = null
    } else if (inlineOriginalPadding) {
      // 인라인 스크립트가 적용한 값으로 복원
      body.style.setProperty('padding-right', inlineOriginalPadding, 'important')
    } else {
      // 저장된 값이 없으면 제거
      body.style.removeProperty('padding-right')
    }
  }
}

