#!/bin/bash

# Seoul Founders Club - 테스트 헬퍼 스크립트

echo "========================================="
echo "Seoul Founders Club - 테스트 환경 시작"
echo "========================================="
echo ""

# 1. 개발 서버 시작
echo "✓ 개발 서버 시작 중..."
npm run dev &
DEV_PID=$!

# 2. 서버가 준비될 때까지 대기
echo "✓ 서버 준비 중..."
sleep 5

# 3. 브라우저에서 테스트할 주요 URL들
echo ""
echo "========================================="
echo "주요 테스트 URL:"
echo "========================================="
echo ""
echo "🏠 홈페이지:"
echo "   http://localhost:3000"
echo ""
echo "👤 인증:"
echo "   http://localhost:3000/auth/login"
echo "   http://localhost:3000/auth/sign-up"
echo ""
echo "👥 프로필 & 멤버:"
echo "   http://localhost:3000/community/profile"
echo "   http://localhost:3000/member"
echo ""
echo "💬 커뮤니티:"
echo "   http://localhost:3000/community"
echo "   http://localhost:3000/community/board/vangol"
echo "   http://localhost:3000/community/board/hightalk"
echo "   http://localhost:3000/community/board/free"
echo "   http://localhost:3000/community/board/announcements"
echo ""
echo "📅 이벤트:"
echo "   http://localhost:3000/events"
echo ""
echo "ℹ️ 소개:"
echo "   http://localhost:3000/about"
echo ""
echo "🔧 관리자:"
echo "   http://localhost:3000/admin"
echo ""
echo "========================================="
echo ""
echo "✓ Ctrl+C를 눌러 서버를 종료할 수 있습니다"
echo ""

# 4. Ctrl+C 처리
trap "echo ''; echo '서버 종료 중...'; kill $DEV_PID; exit" INT

# 서버 유지
wait $DEV_PID

