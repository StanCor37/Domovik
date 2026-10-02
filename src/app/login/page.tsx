import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <PageHeader title="Domovik" subtitle="Sign in with your staff account." className="rounded-none" />
        <div className="p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
