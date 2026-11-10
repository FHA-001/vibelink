import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Everyone who is not the admin gets the same empty 404
export function adminNotFound() {
  return new Response(null, { status: 404 });
}

// Returns a privileged client only if the caller's login token belongs to the admin
export async function requireAdmin(request: Request): Promise<SupabaseClient | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Admin route is missing a server setting");
    return null;
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData.user) return null;

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (!me || me.is_admin !== true) return null;

  return supabase;
}