import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"
import SidebarProfile from "@/components/sidebar-profile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:block fixed inset-y-0 left-6 z-50">
        <Sidebar>
          <SidebarProfile />
        </Sidebar>
      </div>

      <MobileHeader />

      <div className="flex-1 flex flex-col lg:pl-[344px] pt-16 lg:pt-0">
        <div className="max-w-4xl mx-auto p-6 w-full">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">이용약관</CardTitle>
              <p className="text-sm text-slate-500">최종 수정일: 2025년 11월 20일</p>
            </CardHeader>
            <CardContent className="prose prose-slate max-w-none">
              <div className="space-y-6 text-sm leading-relaxed text-slate-700">
                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">제1조 (목적)</h3>
                  <p>
                    본 약관은 Seoul Founders Club(이하 "커뮤니티")이 제공하는 온라인 및 오프라인 기반의 커뮤니티 서비스, 이벤트, 콘텐츠 제공 서비스(이하 "서비스")의 이용과 관련하여 커뮤니티와 회원 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">제2조 (용어의 정의)</h3>
                  <p>
                    회원: 본 약관에 동의하고 커뮤니티가 제공하는 서비스를 이용하는 자<br/>
                    서비스: 커뮤니티가 운영하는 웹사이트, 플랫폼, 이벤트, 커뮤니티 활동 전반<br/>
                    콘텐츠: 커뮤니티가 제작하거나 회원이 업로드한 글, 사진, 영상, 프로필, 게시물 등 모든 자료<br/>
                    유료 서비스: 결제를 통해 참여하는 이벤트, 클래스, 멤버십 등<br/>
                    운영자: 커뮤니티의 운영 및 관리를 담당하는 자
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">제3조 (회원의 의무)</h3>
                  <p>
                    1. 회원은 관계 법령, 본 약관, 공지사항 등 커뮤니티가 정한 규정을 준수하여야 합니다.<br/>
                    2. 회원은 다음 각 호의 행위를 하여서는 안 됩니다.<br/>
                    - 타인의 계정 또는 정보를 도용하는 행위<br/>
                    - 허위 정보 등록 및 커뮤니티 운영을 방해하는 행위<br/>
                    - 욕설, 비방, 차별, 혐오 등 커뮤니티 질서를 저해하는 행위<br/>
                    - 음란물, 불법 정보, 저작권 침해 정보 게시<br/>
                    - 광고, 스팸, 상업적 홍보 행위<br/>
                    - 기타 불법 또는 부당한 행위
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">제4조 (서비스의 제공 및 변경)</h3>
                  <p>
                    1. 커뮤니티는 회원에게 다음과 같은 서비스를 제공합니다.<br/>
                    - 온라인 커뮤니티 및 게시판 서비스<br/>
                    - 온/오프라인 이벤트, 네트워킹, 모임<br/>
                    - 멤버십 프로그램 및 회원전용 콘텐츠<br/>
                    2. 커뮤니티는 서비스의 일부 또는 전부를 변경·중단할 수 있으며, 사전 공지를 원칙으로 합니다.<br/>
                    3. 불가피한 상황으로 사전 공지가 어려운 경우, 사후 공지할 수 있습니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">제5조 (유료 서비스 및 환불 규정)</h3>
                  <p>
                    1. 유료 서비스(이벤트, 클래스, 멤버십 등)의 금액, 내용, 조건은 결제 화면 및 안내 페이지에 따릅니다.<br/>
                    2. 결제 취소 및 환불은 커뮤니티의 환불 정책을 따릅니다.<br/>
                    - 이벤트/클래스: 행사 시작 24~48시간 전 취소 가능 여부 명시<br/>
                    - 멤버십: 사용 기간 및 권한 이용 여부를 고려하여 환불 기준 적용<br/>
                    3. 회원이 부정한 방법으로 결제한 경우, 커뮤니티는 해당 결제를 취소하거나 회원의 이용을 제한할 수 있습니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">제6조 (게시물의 관리)</h3>
                  <p>
                    1. 회원이 서비스 내에 게시하는 모든 콘텐츠는 회원 개인의 책임 하에 작성됩니다.<br/>
                    2. 다음에 해당하는 게시물은 사전 통보 없이 수정·삭제될 수 있습니다.<br/>
                    - 타인의 권리를 침해하는 게시물<br/>
                    - 욕설, 비방, 차별, 음란물 등 커뮤니티 운영 기준 위반<br/>
                    - 허위 사실, 불법 정보<br/>
                    3. 커뮤니티는 게시물이 법령을 위반한다고 판단될 경우 관련 기관에 신고할 수 있습니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">제7조 (저작권 및 콘텐츠 사용권)</h3>
                  <p>
                    1. 회원이 작성한 콘텐츠의 저작권은 회원에게 있습니다.<br/>
                    2. 회원은 커뮤니티가 아래 범위 내에서 회원 콘텐츠를 사용할 수 있도록 비독점적 사용권을 부여합니다.<br/>
                    - 서비스 운영, 홍보를 위한 노출<br/>
                    - 향후 플랫폼 개선을 위한 활용<br/>
                    3. 커뮤니티가 저작물이 포함된 콘텐츠를 외부 광고·마케팅에 활용할 경우, 사전 동의를 얻습니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">제8조 (개인정보 보호)</h3>
                  <p>
                    1. 커뮤니티는 회원의 개인정보를 개인정보 처리방침에 따라 처리합니다.<br/>
                    2. 개인정보 처리방침은 서비스 내에 별도 게시하며, 본 약관과 동일한 효력을 가집니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">제9조 (회원 자격 정지 및 탈퇴)</h3>
                  <p>
                    1. 회원이 아래 사항에 해당할 경우, 커뮤니티는 회원 자격을 제한·정지 또는 강제 탈퇴시킬 수 있습니다.<br/>
                    - 커뮤니티 규정 반복 위반<br/>
                    - 타 회원에게 심각한 피해를 주는 행위<br/>
                    - 불법 활동 및 부당 행위<br/>
                    2. 회원은 언제든지 서비스 내 탈퇴 절차를 통해 탈퇴할 수 있습니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">제10조 (책임 제한)</h3>
                  <p>
                    1. 천재지변, 시스템 장애 등 불가항력적 사유로 서비스를 제공할 수 없는 경우, 커뮤니티는 책임을 지지 않습니다.<br/>
                    2. 회원이 게재한 정보·자료·사실의 신뢰도 및 정확성 등에 관해서는 회원 스스로가 책임을 집니다.<br/>
                    3. 회원 간 또는 회원과 제3자 간 발생한 분쟁에 대해 커뮤니티는 개입하지 않습니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">제11조 (분쟁 해결)</h3>
                  <p>
                    본 약관에 관하여 분쟁이 발생하는 경우, 대한민국 법령을 따르며 관할 법원은 서울중앙지방법원으로 합니다.
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

