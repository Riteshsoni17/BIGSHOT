import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const toCsv = (rows: Record<string, string | number | null>[]) => {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escapeValue = (value: string | number | null) => {
    if (value === null || value === undefined) {
      return "";
    }
    const stringValue = String(value);
    if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((header) => escapeValue(row[header] ?? "")).join(","));
  });

  return lines.join("\n");
};

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("shipments")
    .select("awb, customer_name, phone, address, pincode, courier, shipment_date, expected_delivery, cod_amount, current_status, remarks, last_updated_at, created_at");

  if (from) {
    query = query.gte("shipment_date", from);
  }
  if (to) {
    query = query.lte("shipment_date", to);
  }

  const { data, error } = await query.order("last_updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const csv = toCsv(
    (data ?? []).map((row) => ({
      ...row,
      cod_amount: row.cod_amount ?? null
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=shipments.csv"
    }
  });
}
