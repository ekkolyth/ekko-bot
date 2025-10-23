import { jsx, jsxs } from 'react/jsx-runtime';
import { useNavigate } from '@tanstack/react-router';
import { a as authClient } from './router-Dpgrn-8u.mjs';
import { useState, useMemo } from 'react';
import { cva } from 'class-variance-authority';
import { B as Button, c as cn } from './button-CcoLo67o.mjs';
import * as LabelPrimitive from '@radix-ui/react-label';
import '@tanstack/react-router-devtools';
import '@tanstack/react-devtools';
import 'lucide-react';
import '@tanstack/react-query';
import 'better-auth/react';
import 'better-auth/client/plugins';
import '../virtual/entry.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'dotenv';
import 'node:async_hooks';
import '@tanstack/react-router/ssr/server';
import 'postgres';
import 'better-auth';
import 'drizzle-orm/postgres-js';
import 'better-auth/adapters/drizzle';
import 'better-auth/plugins';
import 'better-auth/react-start';
import '@radix-ui/react-slot';
import 'clsx';
import 'tailwind-merge';

function Label({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    LabelPrimitive.Root,
    {
      "data-slot": "label",
      className: cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      ),
      ...props
    }
  );
}
function FieldSet({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "fieldset",
    {
      "data-slot": "field-set",
      className: cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      ),
      ...props
    }
  );
}
function FieldLegend({
  className,
  variant = "legend",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "legend",
    {
      "data-slot": "field-legend",
      "data-variant": variant,
      className: cn(
        "mb-3 font-medium",
        "data-[variant=legend]:text-base",
        "data-[variant=label]:text-sm",
        className
      ),
      ...props
    }
  );
}
function FieldGroup({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "field-group",
      className: cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className
      ),
      ...props
    }
  );
}
const fieldVariants = cva(
  "group/field flex w-full gap-3 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
        horizontal: [
          "flex-row items-center",
          "[&>[data-slot=field-label]]:flex-auto",
          "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px"
        ],
        responsive: [
          "flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto",
          "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
          "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px"
        ]
      }
    },
    defaultVariants: {
      orientation: "vertical"
    }
  }
);
function Field({
  className,
  orientation = "vertical",
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "group",
      "data-slot": "field",
      "data-orientation": orientation,
      className: cn(fieldVariants({ orientation }), className),
      ...props
    }
  );
}
function FieldLabel({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    Label,
    {
      "data-slot": "field-label",
      className: cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4",
        "has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10",
        className
      ),
      ...props
    }
  );
}
function FieldDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "p",
    {
      "data-slot": "field-description",
      className: cn(
        "text-muted-foreground text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        "last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      ),
      ...props
    }
  );
}
function FieldError({
  className,
  children,
  errors,
  ...props
}) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }
    if (!errors?.length) {
      return null;
    }
    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values()
    ];
    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message;
    }
    return /* @__PURE__ */ jsx("ul", { className: "ml-4 flex list-disc flex-col gap-1", children: uniqueErrors.map(
      (error, index) => error?.message && /* @__PURE__ */ jsx("li", { children: error.message }, index)
    ) });
  }, [children, errors]);
  if (!content) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      role: "alert",
      "data-slot": "field-error",
      className: cn("text-destructive text-sm font-normal", className),
      ...props,
      children: content
    }
  );
}
function Input({ className, type, ...props }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      type,
      "data-slot": "input",
      className: cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      ),
      ...props
    }
  );
}
function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailInputId = "auth-email";
  const passwordInputId = "auth-password";
  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage(null);
    const {
      data,
      error
    } = await authClient.signIn.email({
      email,
      password,
      callbackURL: "/"
    }, {
      onRequest: () => {
        setIsSubmitting(true);
      },
      onSuccess: async (ctx) => {
        await authClient.getSession();
        if (ctx.redirect && ctx.url) {
          window.location.assign(ctx.url);
          return;
        }
        await navigate({
          to: "/",
          replace: true
        });
      },
      onError: (ctx) => {
        setErrorMessage(ctx.error?.message ?? "Sign-in failed. Please try again.");
      }
    });
    if (error) {
      setErrorMessage(error.message ?? "Sign-in failed. Please try again.");
    }
    setIsSubmitting(false);
  }
  return /* @__PURE__ */ jsx("form", { onSubmit: handleSubmit, className: "mx-auto mt-10 max-w-sm space-y-6", noValidate: true, children: /* @__PURE__ */ jsxs(FieldSet, { children: [
    /* @__PURE__ */ jsx(FieldLegend, { className: "text-xl font-semibold", children: "Sign in" }),
    /* @__PURE__ */ jsx(FieldDescription, { children: "Access your account with email and password." }),
    /* @__PURE__ */ jsxs(FieldGroup, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs(Field, { children: [
        /* @__PURE__ */ jsx(FieldLabel, { htmlFor: emailInputId, children: "Email" }),
        /* @__PURE__ */ jsx(Input, { id: emailInputId, type: "email", placeholder: "you@example.com", autoComplete: "email", value: email, onChange: (event) => setEmail(event.target.value), required: true, disabled: isSubmitting, "aria-invalid": errorMessage ? true : void 0 })
      ] }),
      /* @__PURE__ */ jsxs(Field, { children: [
        /* @__PURE__ */ jsx(FieldLabel, { htmlFor: passwordInputId, children: "Password" }),
        /* @__PURE__ */ jsx(Input, { id: passwordInputId, type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "current-password", value: password, onChange: (event) => setPassword(event.target.value), required: true, disabled: isSubmitting, "aria-invalid": errorMessage ? true : void 0 }),
        errorMessage && /* @__PURE__ */ jsx(FieldError, { children: errorMessage })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isSubmitting, className: "mt-2 w-full", children: isSubmitting ? "Signing in\u2026" : "Sign In" })
  ] }) });
}

export { SignInPage as component };
//# sourceMappingURL=sign-in-C2OxrdI4.mjs.map
