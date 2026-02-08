import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export default async function AppHeader() {
  const profile = await getProfile();
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user.email ?? "Unknown";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
            AWB Data Management
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            <Link href="/dashboard" className="hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/shipments/new" className="hover:text-slate-900">
              New Shipment
            </Link>
            {profile.role === "admin" ? (
              <Link href="/admin/users" className="hover:text-slate-900">
                User Admin
              </Link>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="text-right">
            <p className="font-medium text-slate-900">{profile.full_name ?? email}</p>
            <p className="text-xs uppercase tracking-wide text-slate-500">{profile.role}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="border border-slate-300 text-slate-700 hover:bg-slate-100" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
