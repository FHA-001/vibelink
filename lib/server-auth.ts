import { createServerClient } from "./supabase-server";
import type { ConnectedProfile, PublicProfile } from "./auth";

/**
 * Server-side profile lookup for metadata generation.
 * Uses cookie-aware server Supabase client to preserve authenticated request/session context.
 * This file is server-only and should not be imported by client components.
 */
export async function getProfileByUsernameServer(username: string): Promise<ConnectedProfile | PublicProfile | null> {
  const supabase = await createServerClient();
  
  // Use secure RPC for public profile access
  // This function is used for server-side metadata generation
  // Uses server client to preserve authenticated request/session context
  const { data, error } = await supabase
    .rpc('get_profile_for_view', { target_username: username });

  // Log only unexpected errors (network, RPC failure, etc.)
  // Blocked/nonexistent profiles return null data without error - this is expected
  if (error) {
    console.error('Unexpected error fetching profile (server):', error);
    return null;
  }

  if (!data) {
    // Profile not found, blocked, or unavailable - expected state
    return null;
  }

  // Determine the type based on which fields are present
  // Strangers don't get created_at, connected users do
  const profileData = data as Record<string, any>;
  const hasCreatedAt = 'created_at' in profileData && profileData.created_at !== null;
  
  if (hasCreatedAt) {
    // Connected user gets full profile without internal fields
    return data as ConnectedProfile;
  } else {
    // Stranger gets limited profile based on visibility settings
    return data as PublicProfile;
  }
}
