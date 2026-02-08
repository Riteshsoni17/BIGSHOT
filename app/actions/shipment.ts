"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { shipmentSchema, shipmentUpdateSchema } from "@/lib/validation";

const normalizeAwb = (awb: string) => awb.trim().toUpperCase();

export async function createShipment(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const parsed = shipmentSchema.safeParse(rawData);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = createSupabaseServerClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    return { error: { form: "You must be signed in." } };
  }

  const awb = normalizeAwb(parsed.data.awb);

  const { data: existing } = await supabase
    .from("shipments")
    .select("id")
    .eq("awb", awb)
    .maybeSingle();

  if (existing) {
    return { error: { awb: ["AWB already exists."] } };
  }

  const { error } = await supabase.from("shipments").insert({
    awb,
    customer_name: parsed.data.customer_name,
    phone: parsed.data.phone ?? null,
    address: parsed.data.address ?? null,
    pincode: parsed.data.pincode ?? null,
    courier: parsed.data.courier ?? null,
    shipment_date: parsed.data.shipment_date ?? null,
    expected_delivery: parsed.data.expected_delivery ?? null,
    cod_amount: parsed.data.cod_amount ?? null,
    current_status: parsed.data.current_status ?? null,
    remarks: parsed.data.remarks ?? null,
    created_by: sessionData.session.user.id
  });

  if (error) {
    return { error: { form: error.message } };
  }

  revalidatePath("/dashboard");
  return { success: true, awb };
}

export async function updateShipment(awb: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const parsed = shipmentSchema.safeParse({ ...rawData, awb });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("shipments")
    .update({
      customer_name: parsed.data.customer_name,
      phone: parsed.data.phone ?? null,
      address: parsed.data.address ?? null,
      pincode: parsed.data.pincode ?? null,
      courier: parsed.data.courier ?? null,
      shipment_date: parsed.data.shipment_date ?? null,
      expected_delivery: parsed.data.expected_delivery ?? null,
      cod_amount: parsed.data.cod_amount ?? null,
      current_status: parsed.data.current_status ?? null,
      remarks: parsed.data.remarks ?? null,
      last_updated_at: new Date().toISOString()
    })
    .eq("awb", normalizeAwb(awb));

  if (error) {
    return { error: { form: error.message } };
  }

  revalidatePath(`/shipments/${awb}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addShipmentUpdate(awb: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const parsed = shipmentUpdateSchema.safeParse(rawData);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = createSupabaseServerClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    return { error: { form: "You must be signed in." } };
  }

  const { data: shipment, error: shipmentError } = await supabase
    .from("shipments")
    .select("id")
    .eq("awb", normalizeAwb(awb))
    .single();

  if (shipmentError || !shipment) {
    return { error: { form: "Shipment not found." } };
  }

  const { error: insertError } = await supabase.from("shipment_updates").insert({
    shipment_id: shipment.id,
    status: parsed.data.status,
    remark: parsed.data.remark ?? null,
    location: parsed.data.location ?? null,
    created_by: sessionData.session.user.id
  });

  if (insertError) {
    return { error: { form: insertError.message } };
  }

  const { error: updateError } = await supabase
    .from("shipments")
    .update({
      current_status: parsed.data.status,
      last_updated_at: new Date().toISOString()
    })
    .eq("id", shipment.id);

  if (updateError) {
    return { error: { form: updateError.message } };
  }

  revalidatePath(`/shipments/${awb}`);
  revalidatePath("/dashboard");
  return { success: true };
}
