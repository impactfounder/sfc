import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:block fixed inset-y-0 left-6 z-50">
        <Sidebar />
      </div>

      <MobileHeader />

      <div className="flex-1 flex flex-col lg:pl-[344px] pt-16 lg:pt-0">
        <div className="max-w-4xl mx-auto p-6 w-full">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">개인정보 처리방침</CardTitle>
              <p className="text-sm text-slate-500">최종 수정일: 2025년 11월 20일</p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <div className="space-y-6 text-sm leading-relaxed text-slate-700">
                <section>
                  <p className="mb-4">
                    Seoul Founders Club(이하 "커뮤니티")은 이용자의 개인정보를 중요하게 생각하며, 정보통신망법 등 관련 법령에 따라 안전하게 관리합니다. 본 방침은 커뮤니티가 제공하는 서비스 이용과 관련한 개인정보 처리 기준을 설명합니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">1. 개인정보의 수집 및 이용 목적</h3>
                  <p>
                    커뮤니티는 아래 목적을 위해 개인정보를 처리하며, 목적 외 활용은 하지 않습니다.<br/>
                    - 회원 가입 및 본인 확인<br/>
                    - 서비스 제공 및 운영<br/>
                    - 이벤트 신청<br/>
                    - 게시글 작성<br/>
                    - 프로필 관리<br/>
                    - 커뮤니티 내 네트워킹 기능 제공<br/>
                    - 이벤트 주최자의 참가자 명단 관리 기능 제공<br/>
                    - 서비스 품질 개선 및 통계 분석<br/>
                    - 부정 이용 방지, 계정 보호
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">2. 수집하는 개인정보 항목</h3>
                  <p className="mb-2">
                    <strong>① 필수 항목 (Google 소셜 로그인 시 자동 수집)</strong><br/>
                    - 이메일 주소<br/>
                    - 이름(닉네임)<br/>
                    - 프로필 사진
                  </p>
                  <p className="mb-2">
                    <strong>② 선택 입력 항목 (사용자 입력 시)</strong><br/>
                    - 직함<br/>
                    - 소속<br/>
                    - 자기소개 등 프로필 관련 정보
                  </p>
                  <p>
                    <strong>③ 자동 수집 정보</strong><br/>
                    서비스 이용 과정에서 아래 정보가 자동으로 생성·수집될 수 있습니다.<br/>
                    - 접속 로그<br/>
                    - 기기·브라우저 정보<br/>
                    - 이용 기록<br/>
                    - 쿠키(Cookie)
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">3. 개인정보의 보유 및 이용기간</h3>
                  <p className="mb-3">
                    원칙적으로 이용 목적 달성 후 지체 없이 파기합니다.<br/>
                    다만 아래 사항은 관련 법령에 따라 정해진 기간 동안 보관됩니다.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-slate-200 text-xs">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border border-slate-200 px-3 py-2 text-left font-semibold">항목</th>
                          <th className="border border-slate-200 px-3 py-2 text-left font-semibold">보관기간</th>
                          <th className="border border-slate-200 px-3 py-2 text-left font-semibold">관련 법령</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-200 px-3 py-2">서비스 접속 기록</td>
                          <td className="border border-slate-200 px-3 py-2">3개월</td>
                          <td className="border border-slate-200 px-3 py-2">통신비밀보호법</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 px-3 py-2">소비자 분쟁 관련 기록</td>
                          <td className="border border-slate-200 px-3 py-2">3년</td>
                          <td className="border border-slate-200 px-3 py-2">전자상거래법</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-200 px-3 py-2">결제·환불 기록</td>
                          <td className="border border-slate-200 px-3 py-2">5년</td>
                          <td className="border border-slate-200 px-3 py-2">전자상거래법</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">4. 개인정보의 제3자 제공</h3>
                  <p>
                    커뮤니티는 이용자의 개인정보를 외부에 제공하지 않습니다.<br/>
                    단, 아래 경우에 한해 예외적으로 제공될 수 있습니다.<br/>
                    - 이용자가 사전에 동의한 경우<br/>
                    - 법령에 따른 요청이 있는 경우(수사기관·법원 등)
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">5. 개인정보 처리의 위탁</h3>
                  <p>
                    원활한 서비스 운영을 위해 필요한 경우 일부 업무를 외부에 위탁할 수 있으며, 위탁 시 개인정보가 안전하게 관리되도록 감독합니다.<br/>
                    (※ 현재는 위탁 업체 없음)<br/>
                    ※ 향후 서버·호스팅·알림 서비스 등이 추가될 경우 방침에 반영합니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">6. 이용자의 권리</h3>
                  <p>
                    이용자는 아래 권리를 행사할 수 있습니다.<br/>
                    - 개인정보 조회<br/>
                    - 개인정보 수정<br/>
                    - 수집 및 이용 동의 철회(회원 탈퇴)<br/>
                    - 개인정보 삭제 요청<br/>
                    요청 시 커뮤니티는 지체 없이 필요한 조치를 취합니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">7. 이벤트 주최자의 개인정보 열람·관리 권한</h3>
                  <p className="mb-3">
                    Seoul Founders Club 서비스 구조상, 이벤트 주최자는 본인이 생성한 이벤트의 운영을 위해 필요한 범위에서만 참여자 정보를 열람·관리할 수 있습니다.
                  </p>
                  <p className="mb-2">
                    <strong>주최자가 열람할 수 있는 정보</strong><br/>
                    - 참여자의 이름(닉네임)<br/>
                    - 프로필 사진<br/>
                    - 직함·소속(선택 입력 시)<br/>
                    - 이메일 주소<br/>
                    - 신청 시간 및 상태(참가/대기/취소 등)
                  </p>
                  <p className="mb-2">
                    <strong>열람 목적</strong><br/>
                    - 이벤트 운영<br/>
                    - 참석자 관리<br/>
                    - 현장 출석 확인<br/>
                    - 안내 및 커뮤니케이션
                  </p>
                  <p>
                    <strong>접근 범위 제한</strong><br/>
                    - 주최자는 자신이 생성한 이벤트의 명단만 확인할 수 있습니다.<br/>
                    - 다른 이벤트 또는 비회원 정보는 접근할 수 없습니다.<br/>
                    - 데이터 접근은 권한 기반 구조로 엄격히 제한됩니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">8. 개인정보의 파기 절차 및 방법</h3>
                  <p>
                    이용 목적 달성, 보유기간 만료 등의 사유 발생 시 지체 없이 파기합니다.<br/>
                    - 전자 파일: 복구 불가 방식으로 영구 삭제<br/>
                    - 종이 문서: 분쇄 또는 소각
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">9. 개인정보의 안전성 확보조치</h3>
                  <p>
                    커뮤니티는 개인정보 보호를 위해 아래와 같은 조치를 취합니다.<br/>
                    - 접근 권한 최소화<br/>
                    - 데이터 암호화(가능한 경우)<br/>
                    - 보안 프로그램 설치<br/>
                    - 접속 기록 관리 및 위·변조 방지<br/>
                    - 서버 및 데이터베이스 접근 통제<br/>
                    - 권한 기반(Host 기반) 데이터 접근 구조
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">10. 개인정보 보호책임자</h3>
                  <p>
                    개인정보 관련 문의, 열람·정정·삭제 요청 등은 아래 연락처로 문의할 수 있습니다.<br/>
                    개인정보 보호책임자 이메일: master@mvmt.city
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">11. 개인정보 처리방침의 변경</h3>
                  <p>
                    법령 또는 서비스 정책 변경 시 본 방침을 개정하며, 중요한 변경이 있는 경우 사전에 공지합니다.
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

