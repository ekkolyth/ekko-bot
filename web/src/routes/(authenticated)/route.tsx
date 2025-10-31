import { createFileRoute } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Navbar } from '@/components/Navbar'

export const Route = createFileRoute('/(authenticated)')({
  component: DashboardLayout,
})

function DashboardLayout() {
  return (
    <SidebarProvider>
      <Navbar />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
