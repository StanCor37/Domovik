"use client";

import { useActionState } from "react";
import { Button, Field } from "@/components/ui";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Email">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
        />
      </Field>
      <Field label="Password">
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input"
        />
      </Field>
      {state?.error && <p className="error-text">{state.error}</p>}
      <Button type="submit" disabled={pending} className="disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
