import { Card } from '@/components/ui/card'
import { createFileRoute } from '@tanstack/react-router'
import { Music } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { authClient } from '@/lib/auth/client'

export const Route = createFileRoute('/(authenticated)/dashboard/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: session } = authClient.useSession()

  return (
    <div className='p-8'>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Welcome, {session?.user.name}!</h1>
      </div>
      <Link to='/music'>
        <Card className='bg-card p-8'>
          <div className='flex flex-row gap-2 items-center'>
            <div className='p-2 rounded-md border border-border'>
              <Music className='size-5' />
            </div>
            <h1 className='text-2xl font-semibold'>Listen to Music</h1>
          </div>
          <p className=''>Enjoy your favorite tunes from YouTube.</p>
        </Card>
      </Link>
    </div>
  )
}
