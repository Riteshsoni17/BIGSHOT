import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import { requireSession } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireSession();
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
