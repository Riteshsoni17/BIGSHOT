"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import type { Shipment } from "@/lib/types";
import { shipmentSchema } from "@/lib/validation";
import { createShipment, updateShipment } from "@/app/actions/shipment";
import { useRouter } from "next/navigation";
import { z } from "zod";

const formSchema = shipmentSchema;

type FormValues = z.infer<typeof formSchema>;

type Props = {
  mode: "create" | "edit";
  awb?: string;
  initialValues?: Partial<Shipment>;
  canEdit: boolean;
};

export default function ShipmentForm({ mode, awb, initialValues, canEdit }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      awb: initialValues?.awb ?? "",
      customer_name: initialValues?.customer_name ?? "",
      phone: initialValues?.phone ?? "",
      address: initialValues?.address ?? "",
      pincode: initialValues?.pincode ?? "",
      courier: initialValues?.courier ?? "",
      shipment_date: initialValues?.shipment_date ?? "",
      expected_delivery: initialValues?.expected_delivery ?? "",
      cod_amount: initialValues?.cod_amount?.toString() ?? "",
      current_status: initialValues?.current_status ?? "",
      remarks: initialValues?.remarks ?? ""
    }
  });

  const onSubmit = (values: FormValues) => {
    setFormError(null);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    startTransition(async () => {
      const result = mode === "create" ? await createShipment(formData) : await updateShipment(awb ?? "", formData);
      if (result?.error) {
        const message = (result.error as Record<string, string[]>).form?.[0] ?? "Unable to save shipment.";
        setFormError(message);
        return;
      }
      if (mode === "create") {
        router.push(`/shipments/${result.awb}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">AWB</label>
          <input
            {...register("awb")}
            className="mt-1 w-full"
            disabled={mode === "edit" || !canEdit}
          />
          {errors.awb ? <p className="mt-1 text-xs text-red-600">{errors.awb.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Customer Name</label>
          <input {...register("customer_name")} className="mt-1 w-full" disabled={!canEdit} />
          {errors.customer_name ? (
            <p className="mt-1 text-xs text-red-600">{errors.customer_name.message}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Phone</label>
          <input {...register("phone")} className="mt-1 w-full" disabled={!canEdit} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Courier</label>
          <input {...register("courier")} className="mt-1 w-full" disabled={!canEdit} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Shipment Date</label>
          <input type="date" {...register("shipment_date")} className="mt-1 w-full" disabled={!canEdit} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Expected Delivery</label>
          <input type="date" {...register("expected_delivery")} className="mt-1 w-full" disabled={!canEdit} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">COD Amount</label>
          <input {...register("cod_amount")} className="mt-1 w-full" disabled={!canEdit} />
          {errors.cod_amount ? <p className="mt-1 text-xs text-red-600">{errors.cod_amount.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Current Status</label>
          <input {...register("current_status")} className="mt-1 w-full" disabled={!canEdit} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700">Address</label>
        <textarea {...register("address")} className="mt-1 w-full" rows={3} disabled={!canEdit} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Pincode</label>
          <input {...register("pincode")} className="mt-1 w-full" disabled={!canEdit} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Remarks</label>
          <input {...register("remarks")} className="mt-1 w-full" disabled={!canEdit} />
        </div>
      </div>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      {canEdit ? (
        <button type="submit" className="bg-slate-900 text-white hover:bg-slate-800" disabled={isPending}>
          {isPending ? "Saving..." : mode === "create" ? "Create Shipment" : "Save Changes"}
        </button>
      ) : null}
    </form>
  );
}
