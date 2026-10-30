"use client";

import { useEffect, useState, useRef } from "react";
import { Download, Edit, Settings, Users, Copy } from "lucide-react";
import { getCurrentUser, getUserProfile, signOut, Profile } from "@/lib/auth";
import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileCompleteness } from "@/components/profile/profile-completeness";
import { QRCode } from "@/components/profile/qr-code";
import { BottomNav } from "@/components/bottom-nav";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { PageIn } from "@/components/motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyCardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/signin");
        return;
      }

      const userProfile = await getUserProfile(currentUser.id);
      if (!userProfile) {
        router.push("/complete-profile");
        return;
      }

      setUser(currentUser);
      setProfile(userProfile);
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/signin");
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Your profile link is on your clipboard." });
    } catch (error) {
      console.error("Copy failed:", error);
      toast({
        title: "Could not copy the link",
        description: "Copy it from the address shown below the QR code.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/u/${profile?.username}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.full_name} - VibeLink`,
          text: `Check out my VibeLink profile!`,
          url: shareUrl,
        });
      } catch (error) {
        // The person closing the share sheet is not an error worth surfacing.
        console.log("Share failed:", error);
      }
    } else {
      // Fallback: copy to clipboard
      await copyLink(shareUrl);
    }
  };

  const handleDownloadQR = () => {
    setShowQR(true);
  };

  const handleDownloadQRImage = () => {
    setDownloadError("");

    if (!qrRef.current) {
      setDownloadError("Failed to access QR code. Please try again.");
      return;
    }

    try {
      const canvas = qrRef.current;

      // Convert canvas to data URL (PNG)
      const dataUrl = canvas.toDataURL('image/png');

      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `vibelink-qr-${profile?.username || 'code'}.png`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "QR code downloaded", description: "Saved as a PNG image." });
    } catch (error) {
      console.error("Error downloading QR:", error);
      setDownloadError("Failed to download QR code. Please try again.");
    }
  };

  const handleEdit = () => {
    router.push("/edit-profile");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="page-canvas flex min-h-screen flex-col pb-24" aria-busy="true">
        <AppHeader />
        <main id="main-content" className="flex-1 px-4 py-8 sm:px-6">
          <span className="sr-only" role="status">Loading your card</span>
          <div className="mx-auto max-w-lg space-y-4">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-5 w-64" />
            <Skeleton className="mt-6 h-[34rem] w-full rounded-3xl" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const publicProfileUrl = `${window.location.origin}/u/${profile.username}`;

  const quickLinks = [
    { href: "/connections", label: "Connections", icon: Users },
    { href: "/edit-profile", label: "Edit profile", icon: Edit },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="page-canvas flex min-h-screen flex-col pb-24 md:pb-28">
      <AppHeader
        right={
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        }
      />

      <main id="main-content" className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg">
          <PageIn>
            <h1 className="font-heading text-3xl font-semibold">My Card</h1>
            <p className="mt-1 text-muted-foreground">Your digital identity, ready to share.</p>

            <ProfileCompleteness profile={profile} onEdit={handleEdit} />

            {/* Quick navigation */}
            <nav aria-label="Shortcuts" className="mb-6 mt-6 grid grid-cols-3 gap-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="lift flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-2 py-4 text-center shadow-sm"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/12 text-gold">
                    <item.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold text-navy">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Profile Card */}
            <ProfileCard
              profile={profile}
              isOwner={true}
              onEdit={handleEdit}
              onShare={handleShare}
              onDownloadQR={handleDownloadQR}
              showQR={true}
              qrUrl={publicProfileUrl}
            />
          </PageIn>
        </div>
      </main>

      {/* QR Code dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent>
          <DialogHeader className="text-center">
            <DialogTitle>Your QR code</DialogTitle>
            <DialogDescription>Anyone who scans this opens your public profile.</DialogDescription>
          </DialogHeader>

          <div className="flex justify-center">
            <QRCode ref={qrRef} value={publicProfileUrl} size={220} />
          </div>

          <p className="break-all text-center text-xs text-muted-foreground">{publicProfileUrl}</p>

          {downloadError && (
            <p role="alert" className="text-center text-sm text-destructive">
              {downloadError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" onClick={handleDownloadQRImage}>
              <Download aria-hidden="true" />
              Download
            </Button>
            <Button size="lg" variant="outline" onClick={() => copyLink(publicProfileUrl)}>
              <Copy aria-hidden="true" />
              Copy link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}