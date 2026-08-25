import { getCurrentUser } from "@/lib/dal";
import { logout } from "./login/logout-action";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="ml-auto flex items-center gap-3 text-sm">
      <span className="text-zinc-500">{user.name}</span>
      <form action={logout}>
        <button type="submit" className="btn-secondary">
          Log out
        </button>
      </form>
    </div>
  );
}
