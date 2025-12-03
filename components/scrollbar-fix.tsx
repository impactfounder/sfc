"use client"

import { useEffect } from "react"

/**
 * 페이지 로드 시 스크롤바로 인한 레이아웃 시프트를 방지하는 컴포넌트
 * 
 * 인라인 스크립트가 이미 적용했을 수 있으므로, 확인 후 필요시 보완합니다.
 * 리사이즈 시에도 스크롤바 너비를 재계산합니다.
 */
export function ScrollbarFix() {
  useEffect(() => {
    const fixScrollbar = () => {
      try {
        // 스크롤바 너비 계산
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

        // 스크롤바가 없는 경우 (모바일 등) 아무것도 하지 않음
        if (scrollbarWidth <= 0) return

        const body = document.body
        if (!body) return

        // 인라인 스크립트가 이미 적용했는지 확인
        const alreadyApplied = body.style.getPropertyValue('--scrollbar-fix-applied')
        
        if (!alreadyApplied) {
          // 인라인 스크립트가 적용하지 않은 경우에만 적용
          const currentPaddingRight = window.getComputedStyle(body).paddingRight
          const currentPaddingRightValue = parseInt(currentPaddingRight, 10) || 0

          // 원본 padding-right 값 저장
          body.style.setProperty('--body-padding-right-original', currentPaddingRight || '0px', 'important')
          
          // 스크롤바 너비만큼 padding-right 추가
          const newPaddingRight = currentPaddingRightValue + scrollbarWidth
          body.style.setProperty('padding-right', `${newPaddingRight}px`, 'important')
          body.style.setProperty('--scrollbar-fix-applied', 'true')
        } else {
          // 이미 적용된 경우, 값이 올바른지 확인하고 필요시 보정
          const currentPaddingRight = window.getComputedStyle(body).paddingRight
          const currentPaddingRightValue = parseInt(currentPaddingRight, 10) || 0
          const originalPadding = body.style.getPropertyValue('--body-padding-right-original')
          const originalPaddingValue = parseInt(originalPadding || '0', 10) || 0
          
          // 예상되는 padding 값
          const expectedPadding = originalPaddingValue + scrollbarWidth
          
          // 차이가 있으면 보정 (반올림 오차 허용: 2px)
          if (Math.abs(currentPaddingRightValue - expectedPadding) > 2) {
            body.style.setProperty('padding-right', `${expectedPadding}px`, 'important')
          }
        }
      } catch (error) {
        // 에러 발생 시 무시
        console.warn('ScrollbarFix error:', error)
      }
    }

    // 즉시 실행
    fixScrollbar()

    // 리사이즈 시에도 다시 계산 (디바운싱)
    let resizeTimer: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(fixScrollbar, 100)
    }

    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimer)
    }
  }, [])

  return null
}

