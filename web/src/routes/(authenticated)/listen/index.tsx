import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(authenticated)/listen/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(authenticated)/listen/"!</div>
}
