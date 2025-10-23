import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { authClient } from "@/lib/auth/client"
import { useState } from "react"
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldDescription,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/auth/sign-in")({
  component: SignInPage,
})

function SignInPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emailInputId = "auth-email"
  const passwordInputId = "auth-password"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const { data, error } = await authClient.signIn.email(
      {
        email,
        password,
        callbackURL: "/",
      },
      {
        onRequest: () => {
          setIsSubmitting(true)
        },

        onSuccess: async (ctx) => {

          // Ensure session cookie is present before navigating
          await authClient.getSession()

          // redirect if Better Auth provides a callbackURL
          if (ctx.redirect && ctx.url) {
            window.location.assign(ctx.url)
            return
          }
          await navigate({ to: "/", replace: true })
        },
        onError: (ctx) => {
          setErrorMessage(ctx.error?.message ?? "Sign-in failed. Please try again.")
        },
      },
    )

    // If you want an immediate local check in addition to onError:
    if (error) {
      setErrorMessage(error.message ?? "Sign-in failed. Please try again.")
    }

    // End submit state once callbacks have run
    setIsSubmitting(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 max-w-sm space-y-6"
      noValidate
    >
      <FieldSet>
        <FieldLegend className="text-xl font-semibold">Sign in</FieldLegend>
        <FieldDescription>Access your account with email and password.</FieldDescription>

        <FieldGroup className="space-y-4">
          <Field>
            <FieldLabel htmlFor={emailInputId}>Email</FieldLabel>
            <Input
              id={emailInputId}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isSubmitting}
              aria-invalid={errorMessage ? true : undefined}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor={passwordInputId}>Password</FieldLabel>
            <Input
              id={passwordInputId}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isSubmitting}
              aria-invalid={errorMessage ? true : undefined}
            />
            {errorMessage && <FieldError>{errorMessage}</FieldError>}
          </Field>
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? "Signing in…" : "Sign In"}
        </Button>
      </FieldSet>
    </form>
  )
}
