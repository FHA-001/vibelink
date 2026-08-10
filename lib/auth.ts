import { createClient } from "./supabse";
import type { AuthError, User } from "@supabase/supabase-js";

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  job_title: string;
  company_school?: string;
  bio: string;
  profile_photo?: string;
  interests?: string[];
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  instagram?: string;
  created_at: string;
  updated_at: string;
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, user: data.user || undefined };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
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
  const profile = data as Profile;
  if (!profile.username || !profile.full_name || !profile.job_title || !profile.bio) {
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
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('Error checking username availability:', error);
    return false;
  }

  return !data; // Returns true if username is available (no data found)
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile by username:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return data as Profile;
}

export async function saveUserProfile(userId: string, profileData: {
  username: string;
  full_name: string;
  job_title: string;
  company_school?: string;
  bio: string;
  profile_photo?: string;
  interests?: string[];
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  instagram?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  // First check if profile exists
  const exists = await profileExists(userId);
  
  let error;
  if (exists) {
    // Update existing profile
    const result = await supabase
      .from('profiles')
      .update({
        username: profileData.username,
        full_name: profileData.full_name,
        job_title: profileData.job_title,
        company_school: profileData.company_school || null,
        bio: profileData.bio,
        profile_photo: profileData.profile_photo || null,
        interests: profileData.interests || [],
        website: profileData.website || null,
        linkedin: profileData.linkedin || null,
        twitter: profileData.twitter || null,
        github: profileData.github || null,
        instagram: profileData.instagram || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    error = result.error;
  } else {
    // Insert new profile
    const result = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: profileData.username,
        full_name: profileData.full_name,
        job_title: profileData.job_title,
        company_school: profileData.company_school || null,
        bio: profileData.bio,
        profile_photo: profileData.profile_photo || null,
        interests: profileData.interests || [],
        website: profileData.website || null,
        linkedin: profileData.linkedin || null,
        twitter: profileData.twitter || null,
        github: profileData.github || null,
        instagram: profileData.instagram || null,
        updated_at: new Date().toISOString(),
      });
    error = result.error;
  }

  if (error) {
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

export interface ConnectionRequestWithProfile extends ConnectionRequest {
  sender_profile?: Profile;
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

  // Fetch sender profiles separately
  const requestsWithProfiles = await Promise.all(
    (data || []).map(async (request) => {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, job_title, profile_photo')
        .eq('id', request.sender_id)
        .single();
      
      return {
        ...request,
        sender_profile: senderProfile,
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
    return { success: false, error: error.message };
  }

  return { success: true };
}