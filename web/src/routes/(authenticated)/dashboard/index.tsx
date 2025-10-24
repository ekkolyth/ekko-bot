import { createFileRoute } from '@tanstack/react-router'
import { authClient } from "@/lib/auth/client"
import { Spinner } from '@/components/ui/spinner'
import { useNavigate } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'

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

  function InputURL() {
    const form = useForm({
      defaultValues: {
        URL: '',
      },
      onSubmit: async ({ value }) => {
        handleSubmit(value.URL)
      },
    })

    const handleSubmit = async (url: string) => {
      try {
        const response = await fetch('/api/queue', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ URL: url })
        })
        const data = await response.json()
        console.log('Success:', data)
      } catch (error) {
        console.error('Error', error)
      }
    }


    return (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >

        <form.Field
          name="URL"
        >
          {(field) => (
            <Field>
              <Input
                type="text"
                placeholder='Enter YouTube URL'
                aria-description='Input to Enter YouTube URL'
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
              />
            </Field>
          )}
        </form.Field>
        <Button
          className='mt-4'
          type='submit'
        >
          Submit
        </Button>
      </form>
    )
  }
  return (
    <div className='container p-8 space-y-4'>
      <p>
        Welcome to /(authenticated)/dashboard/, {session?.user.name}!
      </p>
      <InputURL />
    </div>
  )
}
