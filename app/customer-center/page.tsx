import { DashboardLayout } from "@/components/dashboard-layout"
import SidebarProfile from "@/components/sidebar-profile"
import { CustomerCenterContent } from "@/components/customer-center/customer-center-content"

export default function CustomerCenterPage() {
  return (
    <DashboardLayout sidebarProfile={<SidebarProfile />}>
      <CustomerCenterContent />
    </DashboardLayout>
  )
}

