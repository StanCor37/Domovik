import { getCurrentUser } from "@/lib/dal";
import { Button } from "@/components/ui";
import { logout } from "./login/logout-action";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="ml-auto flex items-center gap-3 text-sm">
      <span className="text-zinc-500">{user.name}</span>
      <form action={logout}>
        <Button type="submit" variant="secondary">
          Log out
        </Button>
      </form>
    </div>
  );
}
