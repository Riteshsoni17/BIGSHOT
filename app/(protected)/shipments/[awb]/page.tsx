import ShipmentForm from "@/components/ShipmentForm";
import TimelineForm from "@/components/TimelineForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import type { ShipmentUpdate } from "@/lib/types";

const normalizeAwb = (awb: string) => awb.trim().toUpperCase();

export default async function ShipmentDetailPage({ params }: { params: { awb: string } }) {
  const profile = await getProfile();
  const canEdit = profile.role === "admin" || profile.role === "operator";
  const supabase = createSupabaseServerClient();
  const awb = normalizeAwb(params.awb);

  const { data: shipment, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("awb", awb)
    .single();

  if (error || !shipment) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">Shipment not found</h1>
        <p className="mt-2 text-sm text-slate-600">No shipment exists for AWB {awb}.</p>
      </div>
    );
  }

  const { data: updates } = await supabase
    .from("shipment_updates")
    .select("*, created_by_profile:profiles(full_name)")
    .eq("shipment_id", shipment.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-slate-900">Shipment {shipment.awb}</h1>
          <p className="text-sm text-slate-600">Last updated {new Date(shipment.last_updated_at).toLocaleString()}</p>
        </div>
        <div className="mt-6">
          <ShipmentForm mode="edit" awb={shipment.awb} initialValues={shipment} canEdit={canEdit} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-slate-900">Timeline Updates</h2>
          <p className="text-sm text-slate-600">Append new updates without overwriting history.</p>
        </div>
        <div className="mt-4">
          <TimelineForm awb={shipment.awb} canEdit={canEdit} />
        </div>
        <div className="mt-6 space-y-4">
          {(updates as ShipmentUpdate[] | null)?.length ? (
            (updates as ShipmentUpdate[]).map((update) => (
              <div key={update.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{update.status}</p>
                    <p className="text-xs text-slate-500">
                      {update.location ? `${update.location} · ` : ""}
                      {new Date(update.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {update.created_by_profile?.full_name ?? "Unknown user"}
                  </p>
                </div>
                {update.remark ? <p className="mt-2 text-sm text-slate-700">{update.remark}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No updates yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
