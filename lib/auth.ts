import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export const getSession = async () => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
};

export const requireSession = async () => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
};

export const getProfile = async () => {
  const session = await requireSession();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, role, full_name, created_at")
    .eq("user_id", session.user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as { user_id: string; role: Role; full_name: string | null; created_at: string };
};

export const requireRole = async (roles: Role[]) => {
  const profile = await getProfile();
  if (!roles.includes(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
};
