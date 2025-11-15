import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { sidebarSections } from '@/components/Navbar'
import { authClient } from '@/lib/auth/client'
import { createFileRoute, Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard } from 'lucide-react'

export const Route = createFileRoute('/(authenticated)/dashboard/')({
  component: RouteComponent,
})

type DashboardCardItem = {
  label: string
  href: string
  icon: LucideIcon
  isExternal?: boolean
}

const dashboardCards: DashboardCardItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ...sidebarSections.flatMap((section) => section.items),
]

const cardDescriptions: Record<string, string> = {
  Dashboard: 'Review the latest status info and quick widgets.',
  Jukebox: 'Control the music queue for your guild.',
  Games: 'Launch community games and mini events.',
  'Welcome Channel': 'Customize greetings for new members.',
  'Reaction Roles': 'Let members self-select their roles.',
  'Moderator Controls': 'Adjust moderation tools at a glance.',
  Commands: 'Manage custom slash and text commands.',
  Polls: 'Collect feedback with quick polls.',
  'Message Embeds': 'Craft rich embed announcements.',
  Reminders: 'Schedule timely reminders for channels.',
  Notifications: 'Tune how alerts reach your community.',
  Donations: 'Highlight and track supporter activity.',
  Help: 'Get guidance and support resources.',
  'Extra Life': 'Visit the Extra Life fundraiser hub.',
  Merch: 'Browse official merch and supporter gear.',
}

function RouteComponent() {
  const { data: session } = authClient.useSession()

  return (
    <div className='p-8 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-foreground'>Welcome, {session?.user.name}!</h1>
        <p className='text-muted-foreground'>Choose an action to get started.</p>
      </div>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {dashboardCards.map((item) => {
          const ItemIcon = item.icon
          const description = cardDescriptions[item.label] ?? `Open ${item.label.toLowerCase()}.`

          return (
            <Card
              key={`${item.label}-${item.href}`}
              className='border-border/60 transition-colors hover:border-primary/50'
            >
              <CardHeader className='gap-4'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg border border-border/70 bg-muted/40 p-2 text-primary'>
                    <ItemIcon className='size-5' />
                  </div>
                  <div>
                    <CardTitle className='text-lg'>{item.label}</CardTitle>
                  </div>
                </div>
                <CardAction>
                  {item.isExternal ? (
                    <Button variant='outline' size='sm' asChild>
                      <a href={item.href} target='_blank' rel='noreferrer'>
                        Visit
                      </a>
                    </Button>
                  ) : (
                    <Button variant='outline' size='sm' asChild>
                      <Link to={item.href}>Open</Link>
                    </Button>
                  )}
                </CardAction>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
