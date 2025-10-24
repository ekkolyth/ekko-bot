import { createFileRoute } from '@tanstack/react-router'
import { authClient } from "@/lib/auth/client"
import { Spinner } from '@/components/ui/spinner'
import { useNavigate } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'

export const Route = createFileRoute('/(authenticated)/dashboard/')({
  component: Dashboard,
})

function Dashboard() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()

  if (isPending)
    return <Spinner />

  if (!isPending && !session) {
    navigate({ to: "/auth/sign-in" })
  }

  return (
    <div>
      <p>
        Welcome to /(authenticated)/dashboard/, {session?.user.name}!
      </p>
      <Field>
        <Input
          type="text"
          placeholder='Enter YouTube URL'
          aria-description='Input to Enter YouTube URL'
        />
      </Field>
    </div>
  )
}
