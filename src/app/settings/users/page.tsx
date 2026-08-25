import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { DeleteButton } from "../DeleteButton";
import { createUser, deleteUser } from "./actions";

export const metadata: Metadata = { title: "Users" };

export default async function UsersSettingsPage() {
  await verifySession();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Staff accounts that can log in. Every account has the same access
          level.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-zinc-500">{u.email}</td>
                <td className="px-4 py-3">
                  <DeleteButton action={deleteUser} id={u.id} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        action={createUser}
        className="flex max-w-md flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6"
      >
        <h2 className="font-medium">Add user</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">Name</span>
          <input name="name" required className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">Email</span>
          <input name="email" type="email" required className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="input"
          />
        </label>
        <button type="submit" className="btn-primary self-start">
          Add user
        </button>
      </form>
    </div>
  );
}
