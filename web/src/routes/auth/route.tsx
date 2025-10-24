import { Outlet } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return <div className='flex w-full h-screen justify-center items-center'>
    <Outlet />
  </div>
}
