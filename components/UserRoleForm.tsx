"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/app/actions/admin";

const roles = ["admin", "operator", "viewer"] as const;

type Props = {
  userId: string;
  currentRole: string;
};

export default function UserRoleForm({ userId, currentRole }: Props) {
  const [role, setRole] = useState(currentRole);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const onSave = () => {
    setMessage(null);
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("role", role);

    startTransition(async () => {
      const result = await updateUserRole(formData);
      if (result?.error) {
        setMessage("Unable to update role.");
        return;
      }
      setMessage("Saved.");
    });
  };

  return (
    <div className="flex items-center gap-2">
      <select value={role} onChange={(event) => setRole(event.target.value)} className="text-sm">
        {roles.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="border border-slate-300 text-slate-700 hover:bg-slate-100"
        onClick={onSave}
        disabled={isPending}
      >
        {isPending ? "Saving..." : "Save"}
      </button>
      {message ? <span className="text-xs text-slate-500">{message}</span> : null}
    </div>
  );
}
