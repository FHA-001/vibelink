import { Metadata } from "next";
import { getProfileByUsername } from "@/lib/auth";
import { PublicProfileClient } from "./profile-client";

export async function generateMetadata(
  { params }: { params: { username: string } }
): Promise<Metadata> {
  const profile = await getProfileByUsername(params.username);
  
  if (!profile) {
    return {
      title: 'Profile Not Found',
      description: 'The profile you\'re looking for doesn\'t exist or has been removed.',
    };
  }

  // Use generic privacy-safe metadata to avoid exposing hidden profile information
  return {
    title: `@${profile.username}`,
    description: `View ${profile.username}'s VibeLink profile and connect.`,
    openGraph: {
      title: `@${profile.username} | VibeLink`,
      description: `View ${profile.username}'s VibeLink profile and connect.`,
      url: `https://vibelink.name.ng/u/${profile.username}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `@${profile.username} | VibeLink`,
      description: `View ${profile.username}'s VibeLink profile and connect.`,
    },
  };
}

export default function PublicProfilePage() {
  return <PublicProfileClient />;
}