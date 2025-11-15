import { Card } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(authenticated)/commands/')({
  component: RouteComponent,
})

function RouteComponent() {
  const title = 'Commands'
  const description = 'Review slash commands and shortcuts.'

  return (
    <div className="p-8 space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Feature controls coming soon.</p>
      </Card>
    </div>
  )
}
