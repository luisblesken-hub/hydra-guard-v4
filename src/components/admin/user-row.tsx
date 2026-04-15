"use client";

import { useTransition, useState } from "react";
import { updateUserRoleAction } from "./user-role-actions";

type Role = "owner" | "sanierer" | "versicherung" | "mieter" | "admin";

export function UserRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string | null;
}) {
  const [role, setRole] = useState<Role>((currentRole as Role) ?? "owner");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function handleChange(newRole: Role) {
    const prev = role;
    setRole(newRole);
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole);
      if (res.success) {
        setMsg("✓");
        setTimeout(() => setMsg(null), 1500);
      } else {
        setRole(prev);
        setMsg(res.message ?? "Fehler");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={(e) => handleChange(e.target.value as Role)}
        disabled={isPending}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs disabled:opacity-50"
      >
        <option value="owner">Eigentümer</option>
        <option value="sanierer">Sanierer</option>
        <option value="versicherung">Versicherung</option>
        <option value="mieter">Mieter</option>
        <option value="admin">Admin</option>
      </select>
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </div>
  );
}
