import Header from '@/components/Header'
import { createFileRoute } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/(authenticated)')({
  component: DashboardLayout,
})

function DashboardLayout() {
  return <div>
    <Header />
    <Outlet />
  </div>
}
