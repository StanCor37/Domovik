import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="hero-band rounded-none">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Domovik</h1>
          <p className="mt-1 text-sm text-zinc-200">Sign in with your staff account.</p>
        </div>
        <div className="p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
