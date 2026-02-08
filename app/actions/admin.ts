"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { roleSchema } from "@/lib/validation";

export async function updateUserRole(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const parsed = roleSchema.safeParse(rawData);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("user_id", parsed.data.user_id);

  if (error) {
    return { error: { form: error.message } };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
