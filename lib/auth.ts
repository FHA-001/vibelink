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