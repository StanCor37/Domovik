import type { Metadata } from "next";
import { Logo } from "@/components/ui";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

/** Full-window sign-in: one warm card centred on the canvas, headed by the
 * blue gradient panel carrying the white logo. */
export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-lg border-[1.5px] border-zinc-200 bg-card">
        <div className="hero-band rounded-none">
          <h1>
            <Logo variant="onBlue" height={34} />
          </h1>
          <p className="mt-3 text-[15px] leading-5 text-[#e3ecf4]">Sign in with your staff account.</p>
        </div>
        <div className="p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
