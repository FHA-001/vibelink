import { Metadata } from "next";
import { getProfileByUsernameServer } from "@/lib/server-auth";
import { PublicProfileClient } from "./profile-client";

type Props = {
  params: Promise<{ username: string }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = rawUsername.toLowerCase();
  const profile = await getProfileByUsernameServer(username);
  
  if (!profile) {
    return {
      title: 'Profile Not Found',
      description: 'The profile you\'re looking for doesn\'t exist or has been removed.',
    };
  }

  // Profile exists - use privacy-safe metadata
  return {
    title: `@${profile.username} | VibeLink`,
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

export default function PublicProfilePage({ params }: Props) {
  return <PublicProfileClient params={params} />;
}