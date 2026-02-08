import ShipmentForm from "@/components/ShipmentForm";
import { getProfile } from "@/lib/auth";

export default async function NewShipmentPage() {
  const profile = await getProfile();
  const canEdit = profile.role === "admin" || profile.role === "operator";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Create New Shipment</h1>
        <p className="mt-1 text-sm text-slate-600">Enter the master shipment details to begin tracking.</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <ShipmentForm mode="create" canEdit={canEdit} />
        {!canEdit ? (
          <p className="mt-4 text-sm text-slate-500">You have read-only access.</p>
        ) : null}
      </div>
    </div>
  );
}
