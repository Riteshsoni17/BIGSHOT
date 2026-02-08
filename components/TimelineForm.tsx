"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { shipmentUpdateSchema } from "@/lib/validation";
import { addShipmentUpdate } from "@/app/actions/shipment";
import { z } from "zod";

const formSchema = shipmentUpdateSchema;

type FormValues = z.infer<typeof formSchema>;

type Props = {
  awb: string;
  canEdit: boolean;
};

export default function TimelineForm({ awb, canEdit }: Props) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema)
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
      const result = await addShipmentUpdate(awb, formData);
      if (result?.error) {
        const message = (result.error as Record<string, string[]>).form?.[0] ?? "Unable to add update.";
        setFormError(message);
        return;
      }
      reset();
    });
  };

  if (!canEdit) {
    return <p className="text-sm text-slate-500">You have read-only access.</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Status</label>
          <input {...register("status")} className="mt-1 w-full" />
          {errors.status ? <p className="mt-1 text-xs text-red-600">{errors.status.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Location</label>
          <input {...register("location")} className="mt-1 w-full" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Remark</label>
          <input {...register("remark")} className="mt-1 w-full" />
        </div>
      </div>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      <button type="submit" className="bg-slate-900 text-white hover:bg-slate-800" disabled={isPending}>
        {isPending ? "Adding..." : "Add Timeline Update"}
      </button>
    </form>
  );
}
