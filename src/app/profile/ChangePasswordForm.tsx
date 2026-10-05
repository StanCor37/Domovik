"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Field } from "@/components/ui";
import { changePassword } from "./actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const formRef = useRef<HTMLFormElement | null>(null);

  // Clear the fields once the new password is saved.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex max-w-sm flex-col gap-3">
      <Field label="Current password">
        <input name="currentPassword" type="password" required autoComplete="current-password" className="input" />
      </Field>
      <Field label="New password">
        <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="input" />
        <span className="text-[13px] leading-4 text-zinc-500">At least 8 characters.</span>
      </Field>
      <Field label="Confirm new password">
        <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </Field>
      {state && !state.ok && <p className="error-text">{state.error}</p>}
      {state?.ok && (
        <p role="status" className="text-[14px] leading-5 text-success-ink">
          Password changed. Use the new one next time you sign in.
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
