import { z } from "zod";

export const shipmentSchema = z.object({
  awb: z.string().min(1, "AWB is required").trim(),
  customer_name: z.string().min(1, "Customer name is required").trim(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  courier: z.string().optional().nullable(),
  shipment_date: z.string().optional().nullable(),
  expected_delivery: z.string().optional().nullable(),
  cod_amount: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : null))
    .refine((value) => value === null || !Number.isNaN(value), "COD amount must be a number"),
  current_status: z.string().optional().nullable(),
  remarks: z.string().optional().nullable()
});

export const shipmentUpdateSchema = z.object({
  status: z.string().min(1, "Status is required").trim(),
  remark: z.string().optional().nullable(),
  location: z.string().optional().nullable()
});

export const roleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "operator", "viewer"])
});
