import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 마스터 관리자 이메일 목록 (환경 변수에서 읽어옴)
 * .env.local에 MASTER_ADMIN_EMAILS=email1@example.com,email2@example.com 형식으로 설정
 */
function getMasterAdminEmails(): string[] {
  const emails = process.env.NEXT_PUBLIC_MASTER_ADMIN_EMAILS || ''
  return emails.split(',').map(email => email.trim()).filter(Boolean)
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

  // 이메일 기반 체크 (환경 변수에서 마스터 이메일 목록 확인)
  if (userEmail && getMasterAdminEmails().includes(userEmail)) {
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
  if (userEmail && getMasterAdminEmails().includes(userEmail)) {
    return true
  }

  return false
}