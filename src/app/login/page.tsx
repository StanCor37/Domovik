import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8">
        <h1 className="text-xl font-semibold tracking-tight">Domovik</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in with your staff account.</p>
        <LoginForm />
      </div>
    </div>
  );
}
