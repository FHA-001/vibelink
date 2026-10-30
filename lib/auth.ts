import { createClient } from "./supabse";
import type { AuthError, User } from "@supabase/supabase-js";

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

export interface ProfileVisibility {
  profile_photo: boolean;
  full_name: boolean;
  job_title: boolean;
  company_school: boolean;
  bio: boolean;
  interests: boolean;
  website: boolean;
  linkedin: boolean;
  twitter: boolean;
  github: boolean;
  instagram: boolean;
}

// Public profile type - fields can be null if not visible to strangers
export interface PublicProfile {
  id: string;
  username: string;
  full_name: string | null;
  job_title: string | null;
  company_school: string | null;
  bio: string | null;
  profile_photo: string | null;
  interests: string[] | null;
  website: string | null;
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  instagram: string | null;
}

// Connected profile type - what connected users get from RPC
// Same as PublicProfile but with created_at, no updated_at or profile_visibility
export interface ConnectedProfile extends PublicProfile {
  created_at: string;
}

// Owner profile type - what owner gets from direct profile query
// job_title and bio are now optional for simplified onboarding
export interface Profile extends ConnectedProfile {
  full_name: string;
  job_title: string | null;
  company_school: string | null;
  bio: string | null;
  updated_at: string;
  profile_visibility: ProfileVisibility;
}

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

// Returns an error message, or null if the username is valid
export function validateUsername(username: string): string | null {
  const value = normalizeUsername(username);
  if (!value) return "Username is required";
  if (value.length < USERNAME_MIN_LENGTH) return `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
  if (value.length > USERNAME_MAX_LENGTH) return `Username must be ${USERNAME_MAX_LENGTH} characters or fewer`;
  if (!/^[a-z0-9_]+$/.test(value)) return "Username can only contain letters, numbers, and underscores";
  return null;
}

export async function signUp(email: string, password: string, redirectTo?: string, captchaToken?: string): Promise<AuthResult> {
  const supabase = createClient();
  
  // Always provide emailRedirectTo to avoid Supabase defaults
  // QR signup: redirect to /u/B
  // Normal signup: redirect to /my-card
  const destination = redirectTo || '/my-card';
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(destination)}`,
      captchaToken,    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user || undefined };
}

export async function signIn(email: string, password: string, captchaToken?: string): Promise<AuthResult> {  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user || undefined };
}

export async function signOut(): Promise<AuthResult> {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function forgotPassword(email: string, captchaToken?: string): Promise<AuthResult> {  const supabase = createClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    captchaToken,  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function resetPassword(newPassword: string): Promise<AuthResult> {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Password update error:", error);
    return { success: false, error: error.message };
  }

  console.log("Password updated successfully for user:", data.user?.id);
  return { success: true };
}

export async function deleteAccount(): Promise<AuthResult> {
  const supabase = createClient();
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Error getting current user:", userError);
      return { success: false, error: "Failed to get current user" };
    }

    // Get user profile to check for profile photo
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_photo')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return { success: false, error: "Failed to fetch profile" };
    }

    // Delete profile photo if it exists
    if (profile?.profile_photo) {
      const fileName = profile.profile_photo.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('profile-photos')
          .remove([`${user.id}/${fileName}`]);
        
        if (storageError) {
          console.error("Error deleting profile photo:", storageError);
          // Continue with deletion even if photo deletion fails
          // Log the error but don't block account deletion
        }
      }
    }

    // Call the PostgreSQL function to delete account data
    const { error: deleteError } = await supabase.rpc('delete_user_account');

    if (deleteError) {
      console.error("Error deleting account:", deleteError);
      return { success: false, error: deleteError.message || "Failed to delete account" };
    }

    // Sign out to clear local session
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Error signing out:", signOutError);
      // Account is deleted, but sign out failed - this is acceptable
    }

    console.log("Account deleted successfully for user:", user.id);
    return { success: true };
  } catch (error) {
    console.error("Unexpected error during account deletion:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  if (!data) {
    return null; // Profile doesn't exist
  }

  // Check if profile is actually completed (has meaningful data)
  // Only username and full_name are required for simplified onboarding
  const profile = data as Profile;
  if (!profile.username || !profile.full_name) {
    return null; // Profile exists but is not completed
  }

  return profile;
}

export async function profileExists(userId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error checking profile existence:', error);
    return false;
  }

  return !!data;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const supabase = createClient();
  
  // Invalid usernames are never available
  if (validateUsername(username)) return false;

  // Use secure RPC for username availability check (always lowercase)
  const { data, error } = await supabase
    .rpc('is_username_available', { candidate_username: normalizeUsername(username) });

  if (error) {
    console.error('Error checking username availability:', error);
    return false;
  }

  return data as boolean;
}

export async function getProfileByUsername(username: string): Promise<ConnectedProfile | PublicProfile | null> {
  const supabase = createClient();
  
  // Use secure RPC for public profile access
  // This function is used for viewing OTHER users' profiles in browser components
  // Own profile is retrieved via getUserProfile() which uses direct SELECT
  const { data, error } = await supabase
    .rpc('get_profile_for_view', { target_username: normalizeUsername(username) });

  // Log only unexpected errors (network, RPC failure, etc.)
  // Blocked/nonexistent profiles return null data without error - this is expected
  if (error) {
    console.error('Unexpected error fetching profile:', error);
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

export async function saveUserProfile(userId: string, profileData: {
  username: string;
  full_name: string;
  job_title?: string | null;
  company_school?: string;
  bio?: string | null;
  profile_photo?: string;
  interests?: string[];
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  instagram?: string;
  profile_visibility?: ProfileVisibility;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  const usernameError = validateUsername(profileData.username);
  if (usernameError) {
    return { success: false, error: usernameError };
  }
  const username = normalizeUsername(profileData.username);

  // First check if profile exists
  const exists = await profileExists(userId);
  
  let error;
  if (exists) {
    // Update existing profile
    // For optional fields: null = explicitly cleared, string = new value (may be same as existing)
    const updateData: {
      username: string;
      full_name: string;
      company_school: string | null;
      profile_photo: string | null;
      interests: string[];
      website: string | null;
      linkedin: string | null;
      twitter: string | null;
      github: string | null;
      instagram: string | null;
      profile_visibility?: ProfileVisibility;
      updated_at: string;
      job_title?: string | null;
      bio?: string | null;
    } = {
      username,
      full_name: profileData.full_name,
      company_school: profileData.company_school || null,
      profile_photo: profileData.profile_photo || null,
      interests: profileData.interests || [],
      website: profileData.website || null,
      linkedin: profileData.linkedin || null,
      twitter: profileData.twitter || null,
      github: profileData.github || null,
      instagram: profileData.instagram || null,
      profile_visibility: profileData.profile_visibility,
      updated_at: new Date().toISOString(),
    };

    // Include job_title in update if provided (null to clear, string to set/change)
    if (profileData.job_title !== undefined) {
      updateData.job_title = profileData.job_title;
    }

    // Include bio in update if provided (null to clear, string to set/change)
    if (profileData.bio !== undefined) {
      updateData.bio = profileData.bio;
    }

    const result = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
    error = result.error;
  } else {
    // Insert new profile
    const result = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username,
        full_name: profileData.full_name,
        job_title: profileData.job_title || null,
        company_school: profileData.company_school || null,
        bio: profileData.bio || null,
        profile_photo: profileData.profile_photo || null,
        interests: profileData.interests || [],
        website: profileData.website || null,
        linkedin: profileData.linkedin || null,
        twitter: profileData.twitter || null,
        github: profileData.github || null,
        instagram: profileData.instagram || null,
        profile_visibility: profileData.profile_visibility,
        updated_at: new Date().toISOString(),
      });
    error = result.error;
  }

  if (error) {
    // 23505 = unique violation (someone already has this username)
    if (error.code === '23505') {
      return { success: false, error: "That username is already taken" };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

// Minimal sender preview for pending requests
export interface SenderPreview {
  id: string;
  username: string;
  full_name: string | null;
  profile_photo: string | null;
  bio: string | null;
}

export interface ConnectionRequestWithProfile extends ConnectionRequest {
  sender_profile?: SenderPreview;
  receiver_profile?: Profile;
}

export async function createConnectionRequest(senderId: string, receiverId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Prevent requesting own profile
  if (senderId === receiverId) {
    return { success: false, error: "You cannot send a connection request to yourself" };
  }

  const { error } = await supabase
    .from('connection_requests')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending',
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getPendingRequests(userId: string): Promise<ConnectionRequestWithProfile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending requests:', error);
    return [];
  }

  // Fetch sender previews using secure RPC
  const requestsWithProfiles = await Promise.all(
    (data || []).map(async (request) => {
      const { data: senderPreview } = await supabase
        .rpc('get_pending_request_sender_preview', { request_id: request.id });
      
      return {
        ...request,
        sender_profile: senderPreview as SenderPreview | undefined,
      } as ConnectionRequestWithProfile;
    })
  );

  return requestsWithProfiles;
}

export async function getSentRequests(userId: string): Promise<ConnectionRequestWithProfile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('sender_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sent requests:', error);
    return [];
  }

  // Fetch receiver previews using secure RPC
  const requestsWithProfiles = await Promise.all(
    (data || []).map(async (request) => {
      const { data: receiverPreview } = await supabase
        .rpc('get_pending_request_receiver_preview', { request_id: request.id });

      return {
        ...request,
        sender_profile: receiverPreview as SenderPreview | undefined,
      } as ConnectionRequestWithProfile;
    })
  );

  return requestsWithProfiles;
}

export async function updateConnectionRequestStatus(requestId: string, status: 'accepted' | 'declined'): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // First, get the request details to know which users are involved
  const { data: requestData, error: fetchError } = await supabase
    .from('connection_requests')
    .select('sender_id, receiver_id')
    .eq('id', requestId)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  // Update the request status
  const { error } = await supabase
    .from('connection_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) {
    return { success: false, error: error.message };
  }

  // If accepting, verify the connection was created by the trigger
  if (status === 'accepted' && requestData) {
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('id')
      .or(`and(user_one_id.eq.${requestData.sender_id},user_two_id.eq.${requestData.receiver_id}),and(user_one_id.eq.${requestData.receiver_id},user_two_id.eq.${requestData.sender_id})`)
      .maybeSingle();

    if (connectionError) {
      console.error('Error verifying connection:', connectionError);
      // Don't fail the whole operation if verification fails, but log it
    }

    if (!connection) {
      console.error('Connection was not created by trigger');
      return { success: false, error: 'Connection was not created. Please try again.' };
    }
  }

  return { success: true };
}

export async function getConnectionRequestStatus(senderId: string, receiverId: string): Promise<ConnectionRequest | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('sender_id', senderId)
    .eq('receiver_id', receiverId)
    .maybeSingle();

  if (error) {
    console.error('Error checking connection request status:', error);
    return null;
  }

  return data as ConnectionRequest | null;
}

export interface Connection {
  id: string;
  user_one_id: string;
  user_two_id: string;
  created_at: string;
}

export interface ConnectionWithProfile extends Connection {
  other_user_profile: Profile;
}

export async function getUserConnections(userId: string): Promise<ConnectionWithProfile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching connections:', error);
    return [];
  }

  // Fetch other user's profile for each connection
  const connectionsWithProfiles = await Promise.all(
    (data || []).map(async (connection) => {
      const otherUserId = connection.user_one_id === userId ? connection.user_two_id : connection.user_one_id;
      
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();
      
      return {
        ...connection,
        other_user_profile: otherProfile,
      } as ConnectionWithProfile;
    })
  );

  return connectionsWithProfiles;
}

export async function areUsersConnected(userA: string, userB: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('connections')
    .select('id')
    .or(`and(user_one_id.eq.${userA},user_two_id.eq.${userB}),and(user_one_id.eq.${userB},user_two_id.eq.${userA})`)
    .maybeSingle();

  if (error) {
    console.error('Error checking connection:', error);
    return false;
  }

  return !!data;
}

export async function deleteConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', connectionId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function cancelConnectionRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error, count } = await supabase
    .from('connection_requests')
    .delete({ count: 'exact' })
    .eq('id', requestId);

  if (error) {
    return { success: false, error: error.message };
  }

  if (count !== 1) {
    return { success: false, error: 'Request not found or cannot be cancelled' };
  }

  return { success: true };
}

export async function getConnectionId(userA: string, userB: string): Promise<string | null> {
  const supabase = createClient();

  const { data: connection } = await supabase
    .from('connections')
    .select('id')
    .or(`and(user_one_id.eq.${userA},user_two_id.eq.${userB}),and(user_one_id.eq.${userB},user_two_id.eq.${userA})`)
    .maybeSingle();

  return connection?.id || null;
}

export async function getConnectionStatus(userA: string, userB: string): Promise<'connected' | 'pending_sent' | 'pending_received' | 'declined' | 'none'> {
  const supabase = createClient();

  // Check if connected
  const { data: connection } = await supabase
    .from('connections')
    .select('id')
    .or(`and(user_one_id.eq.${userA},user_two_id.eq.${userB}),and(user_one_id.eq.${userB},user_two_id.eq.${userA})`)
    .maybeSingle();

  if (connection) {
    return 'connected';
  }

  // Check request status
  const { data: sentRequest } = await supabase
    .from('connection_requests')
    .select('status')
    .eq('sender_id', userA)
    .eq('receiver_id', userB)
    .maybeSingle();

  if (sentRequest) {
    if (sentRequest.status === 'pending') return 'pending_sent';
    if (sentRequest.status === 'declined') return 'declined';
  }

  const { data: receivedRequest } = await supabase
    .from('connection_requests')
    .select('status')
    .eq('sender_id', userB)
    .eq('receiver_id', userA)
    .maybeSingle();

  if (receivedRequest && receivedRequest.status === 'pending') {
    return 'pending_received';
  }

  return 'none';
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'connection_request' | 'connection_accepted' | 'connection_declined';
  title: string;
  message: string;
  related_request_id?: string;
  is_read: boolean;
  created_at: string;
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data as Notification[];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createClient();

  const { data, count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Profile Photo Functions

export async function uploadProfilePhoto(userId: string, file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  const supabase = createClient();
  
  // Validate file
  const validation = validateProfilePhoto(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { success: false, error: 'Failed to upload photo' };
  }
}

export async function deleteProfilePhoto(photoUrl: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  try {
    // Extract path from URL
    const url = new URL(photoUrl);
    const pathParts = url.pathname.split('/profile-photos/');
    if (pathParts.length < 2) {
      return { success: false, error: 'Invalid photo URL' };
    }
    
    const filePath = pathParts[1];
    
    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting photo:', error);
    return { success: false, error: 'Failed to delete photo' };
  }
}

export function validateProfilePhoto(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  // Check file size (5 MB max)
  const maxSize = 5 * 1024 * 1024; // 5 MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5 MB' };
  }

  return { valid: true };
}

// Block and Report Functions (Phase 5C)

export async function createBlock(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .rpc('create_block', { target_user_id: targetUserId });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removeBlock(targetUserId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .rpc('remove_block', { target_user_id: targetUserId });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getMyBlockState(targetUserId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_my_block_state', { target_user_id: targetUserId });

  if (error) {
    console.error('Error checking block state:', error);
    return false;
  }

  return data as boolean;
}

export interface BlockedUser {
  blocked_user_id: string;
  username: string | null;
  blocked_at: string;
}

export async function getMyBlockedUsers(): Promise<BlockedUser[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_my_blocked_users');

  if (error) {
    console.error('Error fetching blocked users:', error);
    return [];
  }

  return (data || []) as BlockedUser[];
}

export async function createProfileReport(
  targetUserId: string,
  reason: string,
  details?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .rpc('create_profile_report', {
      target_user_id: targetUserId,
      report_reason: reason,
      report_details: details || null
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// CONNECTION NOTES AND TAGS TYPES
// ============================================

export interface ConnectionNote {
  id: string;
  user_id: string;
  connection_id: string;
  note: string;
  updated_at: string;
}

export interface ConnectionTag {
  id: string;
  user_id: string;
  tag_name: string;
}

export interface ConnectionTagAssignment {
  id: string;
  user_id: string;
  connection_id: string;
  tag_id: string;
}

export interface ConnectionNotesAndTags {
  note: string | null;
  tags: Array<{ id: string; tag_name: string }>;
}

// ============================================
// CONNECTION NOTES CRUD
// ============================================

export async function upsertConnectionNote(
  connectionId: string,
  note: string
): Promise<{ success: boolean; error?: string; noteId?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('upsert_connection_note', {
      p_connection_id: connectionId,
      p_note: note,
    });

  if (error) {
    console.error('Error upserting connection note:', error);
    return { success: false, error: error.message };
  }

  return { success: true, noteId: data };
}

export async function deleteConnectionNote(
  connectionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .rpc('delete_connection_note', {
      p_connection_id: connectionId,
    });

  if (error) {
    console.error('Error deleting connection note:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// CONNECTION TAGS CRUD
// ============================================

export async function createConnectionTag(
  tagName: string
): Promise<{ success: boolean; error?: string; tagId?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('create_connection_tag', {
      p_tag_name: tagName,
    });

  if (error) {
    console.error('Error creating connection tag:', error);
    return { success: false, error: error.message };
  }

  return { success: true, tagId: data };
}

export async function deleteConnectionTag(
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .rpc('delete_connection_tag', {
      p_tag_id: tagId,
    });

  if (error) {
    console.error('Error deleting connection tag:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getUserTags(): Promise<{ success: boolean; error?: string; tags?: ConnectionTag[] }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_user_tags');

  if (error) {
    // Don't log error - expected when migration not applied yet
    return { success: false, error: error.message };
  }

  return { success: true, tags: data as ConnectionTag[] };
}

// ============================================
// TAG ASSIGNMENTS CRUD
// ============================================

export async function assignTagToConnection(
  connectionId: string,
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .rpc('assign_tag_to_connection', {
      p_connection_id: connectionId,
      p_tag_id: tagId,
    });

  if (error) {
    console.error('Error assigning tag to connection:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removeTagFromConnection(
  connectionId: string,
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .rpc('remove_tag_from_connection', {
      p_connection_id: connectionId,
      p_tag_id: tagId,
    });

  if (error) {
    console.error('Error removing tag from connection:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// GET NOTES AND TAGS FOR CONNECTION
// ============================================

export async function getConnectionNotesAndTags(
  connectionId: string
): Promise<{ success: boolean; error?: string; data?: ConnectionNotesAndTags }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_connection_notes_and_tags', {
      p_connection_id: connectionId,
    });

  if (error) {
    console.error('Error getting connection notes and tags:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as ConnectionNotesAndTags };
}