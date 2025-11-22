import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 현재 사용자가 마스터 관리자인지 확인하는 헬퍼 함수
 * @param userRole - 사용자의 role 값 ('member', 'admin', 'master')
 * @param userEmail - 사용자의 이메일 주소 (선택사항, 이메일 기반 체크용)
 * @returns 마스터 관리자 여부
 */
export function isMasterAdmin(userRole?: string | null, userEmail?: string | null): boolean {
  // role이 'master'인 경우
  if (userRole === 'master') {
    return true
  }
  
  // 이메일 기반 체크 (백업용)
  if (userEmail === 'jaewook@mvmt.city') {
    return true
  }
  
  return false
}

/**
 * 현재 사용자가 관리자(admin 또는 master)인지 확인하는 헬퍼 함수
 * @param userRole - 사용자의 role 값 ('member', 'admin', 'master')
 * @param userEmail - 사용자의 이메일 주소 (선택사항, 이메일 기반 체크용)
 * @returns 관리자 여부
 */
export function isAdmin(userRole?: string | null, userEmail?: string | null): boolean {
  if (userRole === 'admin' || userRole === 'master') {
    return true
  }
  
  // 이메일 기반 마스터 체크
  if (userEmail === 'jaewook@mvmt.city') {
    return true
  }
  
  return false
}