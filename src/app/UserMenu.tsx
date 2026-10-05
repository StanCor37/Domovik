import { getCurrentUser } from "@/lib/dal";
import { getTheme } from "@/lib/theme";
import { logout } from "./login/logout-action";
import { UserMenuButton } from "./UserMenuButton";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;

  return <UserMenuButton name={user.name} email={user.email} theme={await getTheme()} logout={logout} />;
}
