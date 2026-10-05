import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { getTheme } from "@/lib/theme";
import { Avatar, Card } from "@/components/ui";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { ThemeSwitch } from "./ThemeSwitch";

export const metadata: Metadata = { title: "Profile" };

const SECTION_TITLE = "title-section";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const theme = await getTheme();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card className="flex items-center gap-4">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-[22px] leading-7 text-zinc-900">{user.name}</p>
          <p className="truncate text-[15px] leading-5 text-zinc-500">{user.email}</p>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div>
          <h2 className={SECTION_TITLE}>Appearance</h2>
          <p className="text-[15px] leading-5 text-zinc-500">
            Applies to this browser. System follows your computer&apos;s light or dark setting.
          </p>
        </div>
        <ThemeSwitch theme={theme} />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className={SECTION_TITLE}>Change password</h2>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
