import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ShipmentsTable from "@/components/ShipmentsTable";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  await getProfile();

  const { data: shipments, error } = await supabase
    .from("shipments")
    .select("*")
    .order("last_updated_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Search by AWB or review recent activity.</p>
          </div>
          <Link
            href="/shipments/new"
            className="inline-flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800"
          >
            Create New Shipment
          </Link>
        </div>
        <div className="mt-6">
          <SearchBar />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recent Shipments</h2>
            <p className="text-sm text-slate-600">Sorted by last update time.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <form method="get" action="/api/shipments/export" className="flex items-center gap-2">
              <input type="date" name="from" />
              <input type="date" name="to" />
              <button type="submit" className="border border-slate-300 text-slate-700 hover:bg-slate-100">
                Export CSV
              </button>
            </form>
          </div>
        </div>
        <ShipmentsTable shipments={shipments ?? []} />
      </section>
    </div>
  );
}
