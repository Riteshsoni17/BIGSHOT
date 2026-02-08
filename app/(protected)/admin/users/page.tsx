import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import UserRoleForm from "@/components/UserRoleForm";

export default async function AdminUsersPage() {
  await requireRole(["admin"]);
  const supabase = createSupabaseServerClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">User Administration</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage user roles. Create users via Supabase Auth or the Admin API, then assign roles here.
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="space-y-4 text-sm text-slate-600">
          <p>
            If you cannot list Auth users directly, use Supabase Studio → Authentication → Add user, then refresh this
            page to update roles.
          </p>
        </div>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">User ID</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Full Name</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles?.length ? (
                profiles.map((profile) => (
                  <tr key={profile.user_id}>
                    <td className="px-4 py-3 text-slate-700">{profile.user_id}</td>
                    <td className="px-4 py-3 text-slate-700">{profile.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <UserRoleForm userId={profile.user_id} currentRole={profile.role} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                    No users found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
