"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, MessageSquare, Edit2, Save, Tag, X, Plus, CircleCheckIcon, UserPlus } from "lucide-react";
import { getProfileByUsername, PublicProfile, ConnectedProfile, getCurrentUser, getConnectionStatus, getConnectionId, getConnectionNotesAndTags, upsertConnectionNote, deleteConnectionNote, getUserTags, assignTagToConnection, removeTagFromConnection, createConnectionTag, ConnectionNotesAndTags, ConnectionTag } from "@/lib/auth";
import { PublicProfilePreview } from "@/components/profile/public-profile-preview";
import { ProfileCard } from "@/components/profile/profile-card";
import { Logo } from "@/components/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { downloadVCard } from "@/lib/vcard";
import { getConnectionDetails, saveConnectionDetails, setFollowUpDone, recordProfileView, ConnectionDetails } from "@/lib/auth";
import { MapPin, CalendarClock } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  params: Promise<{ username: string }>
}

function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PublicProfileClient({ params }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  const [profile, setProfile] = useState<ConnectedProfile | PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'pending_sent' | 'pending_received' | 'declined' | 'none'>('none');

  // Notes and tags state
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [connectionNotes, setConnectionNotes] = useState<ConnectionNotesAndTags | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [userTags, setUserTags] = useState<ConnectionTag[]>([]);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Where we met + follow-up reminder
  const [details, setDetails] = useState<ConnectionDetails | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [metAtText, setMetAtText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Type guard to check if profile has full connected user data
  const isFullProfile = (profile: ConnectedProfile | PublicProfile): profile is ConnectedProfile => {
    return 'created_at' in profile && profile.created_at !== null;
  };

  // Resolve async params in client component
  useEffect(() => {
    params.then(({ username: resolvedUsername }) => {
      setUsername(resolvedUsername);
    });
  }, [params]);

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

    // Counts one view per profile per browser tab session, so refreshes don't inflate the number.
  // A QR code opens the profile with ?src=qr, which is counted as a scan.
  const trackView = (profileUsername: string) => {
    try {
      const key = `vl-viewed:${profileUsername}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage unavailable: count anyway
    }
    const source = new URLSearchParams(window.location.search).get("src") === "qr" ? "qr" : "link";
    void recordProfileView(profileUsername, source);
  };

  const loadProfile = async () => {
    if (!username) {
      return;
    }

    try {
      const userProfile = await getProfileByUsername(username);
      if (!userProfile) {
        setError("Profile not found");
        return;
      }
      setProfile(userProfile);
      trackView(userProfile.username);

      // Check if current user is the profile owner
      const currentUser = await getCurrentUser();
      setIsOwner(currentUser?.id === userProfile.id);

      // Check connection status if not owner
      if (currentUser && currentUser.id !== userProfile.id) {
        const status = await getConnectionStatus(currentUser.id, userProfile.id);
        setConnectionStatus(status);
        setIsConnected(status === 'connected');

        // If connected, load connection ID and notes/tags
        if (status === 'connected') {
          const connId = await getConnectionId(currentUser.id, userProfile.id);
          if (connId) {
            setConnectionId(connId);
            await loadConnectionNotesAndTags(connId);
            await loadConnectionDetails(connId);
          }
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const loadConnectionNotesAndTags = async (connId: string) => {
    const result = await getConnectionNotesAndTags(connId);
    if (result.success && result.data) {
      setConnectionNotes(result.data);
    }
  };

  const loadConnectionDetails = async (connId: string) => {
    const result = await getConnectionDetails(connId);
    if (result.success && result.data) {
      setDetails(result.data);
    }
  };

  const handleStartEditDetails = () => {
    setMetAtText(details?.met_at || '');
    setFollowUpDate(details?.follow_up_at || '');
    setIsEditingDetails(true);
  };

  const handleSaveDetails = async () => {
    if (!connectionId) return;

    const result = await saveConnectionDetails(connectionId, metAtText, followUpDate || null);
    if (result.success) {
      await loadConnectionDetails(connectionId);
      setIsEditingDetails(false);
      toast({ title: "Details saved" });
    } else {
      toast({ title: "Could not save the details", description: result.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleToggleFollowUpDone = async () => {
    if (!connectionId || !details) return;

    const result = await setFollowUpDone(connectionId, !details.follow_up_done);
    if (result.success) {
      await loadConnectionDetails(connectionId);
    } else {
      toast({ title: "Could not update the reminder", description: result.error || "Please try again.", variant: "destructive" });
    }
  };

  const loadUserTags = async () => {
    const result = await getUserTags();
    if (result.success && result.tags) {
      setUserTags(result.tags);
    }
  };

  const handleStartEditNote = () => {
    setEditingNoteText(connectionNotes?.note || '');
    setIsEditingNote(true);
  };

  const handleSaveNote = async () => {
    if (!connectionId) return;

    const result = await upsertConnectionNote(connectionId, editingNoteText);
    if (result.success) {
      await loadConnectionNotesAndTags(connectionId);
      setIsEditingNote(false);
      toast({ title: "Note saved" });
    } else {
      toast({ title: "Could not save the note", description: result.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleCancelEditNote = () => {
    setIsEditingNote(false);
    setEditingNoteText('');
  };

  const handleDeleteNote = async () => {
    if (!connectionId) return;

    const result = await deleteConnectionNote(connectionId);
    if (result.success) {
      await loadConnectionNotesAndTags(connectionId);
      toast({ title: "Note deleted" });
    } else {
      toast({ title: "Could not delete the note", description: result.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const result = await createConnectionTag(newTagName.trim());
    if (result.success) {
      await loadUserTags();
      setNewTagName('');
    } else {
      toast({ title: "Could not create the tag", description: result.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleAssignTag = async (tagId: string) => {
    if (!connectionId) return;

    const result = await assignTagToConnection(connectionId, tagId);
    if (result.success) {
      await loadConnectionNotesAndTags(connectionId);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!connectionId) return;

    const result = await removeTagFromConnection(connectionId, tagId);
    if (result.success) {
      await loadConnectionNotesAndTags(connectionId);
    }
  };

  // Load user tags when tag dialog opens
  useEffect(() => {
    if (showTagDialog) {
      loadUserTags();
    }
  }, [showTagDialog]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.full_name} - VibeLink`,
          text: `Check out ${profile?.full_name}'s VibeLink profile!`,
          url: shareUrl,
        });
      } catch (error) {
        console.log("Share failed:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied", description: "The profile link is on your clipboard." });
      } catch (error) {
        console.error("Copy failed:", error);
        toast({
          title: "Could not copy the link",
          description: "Copy it from your browser address bar instead.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveContact = () => {
    if (!profile) return;
    try {
      downloadVCard(profile, `${window.location.origin}/u/${profile.username}`);
      toast({ title: "Contact file downloaded", description: "Open it to add this person to your contacts." });
    } catch (error) {
      console.error("Save contact failed:", error);
      toast({ title: "Could not create the contact file", description: "Please try again.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="page-canvas flex min-h-screen flex-col" aria-busy="true">
        <header className="mx-auto flex h-16 w-full max-w-5xl items-center px-4 sm:px-6">
          <Logo />
        </header>
        <main id="main-content" className="flex-1 px-4 py-8 sm:px-6">
          <span className="sr-only" role="status">Loading profile</span>
          <div className="mx-auto max-w-lg space-y-4">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-canvas flex min-h-screen flex-col">
        <header className="mx-auto flex h-16 w-full max-w-5xl items-center px-4 sm:px-6">
          <Link href="/" aria-label="VibeLink home" className="rounded-lg">
            <Logo />
          </Link>
        </header>
        <main id="main-content" className="flex flex-1 items-center justify-center px-4 sm:px-6">
          <div className="max-w-sm text-center">
            <h1 className="font-heading text-3xl font-semibold">Profile not found</h1>
            <p className="mt-3 text-muted-foreground">
              This profile does not exist, has been removed, or is not available to you.
            </p>
            <Link href="/" className={buttonVariants({ variant: "outline", size: "lg", className: "mt-8" })}>
              <ArrowLeft aria-hidden="true" />
              Back to home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const handleBack = () => {
    // Always navigate to /connections for consistent behavior
    // This works for all scenarios:
    // - From /connections: returns to connections
    // - From direct URL/QR: goes to connections (safe fallback)
    // - From external site: goes to connections (avoids confusion)
    router.push('/connections');
  };

  return (
    <div className="page-canvas min-h-screen flex flex-col pb-24 md:pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={handleBack}
            className="flex size-10 items-center justify-center rounded-xl text-navy transition-colors hover:bg-muted"
            aria-label="Back to connections"
          >
            <ArrowLeft className="size-5" />
          </button>
          <Link href="/" aria-label="VibeLink home" className="rounded-lg">
            <Logo />
          </Link>
          <button
            type="button"
            onClick={handleShare}
            className="flex size-10 items-center justify-center rounded-xl text-navy transition-colors hover:bg-muted"
            aria-label="Share profile"
          >
            <Share2 className="size-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {isOwner ? (
              // STATE 1: Profile owner - redirect to my-card
              <div className="text-center py-12">
                <h2 className="font-heading text-2xl font-semibold mb-2">
                  This is your profile
                </h2>
                <p className="text-muted-foreground mb-6">
                  View your full profile on your card page
                </p>
                <Link
                  href="/my-card"
                  className={buttonVariants({ size: "lg" })}
                >
                  Go to My Card
                </Link>
              </div>
            ) : isConnected && isFullProfile(profile) ? (
              // STATE 3: Connected user - show full profile
              <div>
                <div className="mb-4 flex items-center justify-center gap-2 rounded-full bg-secondary/15 px-4 py-2 text-teal-ink">
                  <CircleCheckIcon className="size-4" aria-hidden="true" />
                  <span className="text-sm font-semibold">Connected</span>
                </div>
                <ProfileCard
                  profile={profile}
                  isOwner={false}
                  showActions={false}
                />

                {/* Where you met + follow-up reminder */}
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Where you met
                  </h3>
                  {isEditingDetails ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label htmlFor="met-at" className="text-sm text-muted-foreground">
                          Place or event
                        </label>
                        <Input
                          id="met-at"
                          type="text"
                          placeholder="For example: Tech meetup in Abuja"
                          maxLength={100}
                          value={metAtText}
                          onChange={(e) => setMetAtText(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="follow-up-date" className="text-sm text-muted-foreground">
                          Remind me to follow up on
                        </label>
                        <Input
                          id="follow-up-date"
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Button size="sm" onClick={handleSaveDetails}>
                          <Save aria-hidden="true" />
                          Save
                        </Button>
                        <button
                          type="button"
                          onClick={() => setIsEditingDetails(false)}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancel
                        </button>
                        {followUpDate && (
                          <button
                            type="button"
                            onClick={() => setFollowUpDate('')}
                            className="ml-auto text-sm text-muted-foreground hover:text-destructive transition-colors"
                          >
                            Clear date
                          </button>
                        )}
                      </div>
                    </div>
                  ) : details && (details.met_at || details.follow_up_at) ? (
                    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                      {details.met_at && (
                        <p className="flex items-center gap-2 text-sm text-foreground">
                          <MapPin className="size-4 shrink-0 text-gold" aria-hidden="true" />
                          {details.met_at}
                        </p>
                      )}
                      {details.follow_up_at && (
                        <div className="flex items-center justify-between gap-3">
                          <p
                            className={`flex items-center gap-2 text-sm ${
                              details.follow_up_done
                                ? 'text-muted-foreground line-through'
                                : details.follow_up_at < todayLocal()
                                  ? 'font-semibold text-destructive'
                                  : 'text-foreground'
                            }`}
                          >
                            <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
                            <span>
                              Follow up {formatDate(details.follow_up_at)}
                              {!details.follow_up_done && details.follow_up_at < todayLocal() ? ' (overdue)' : ''}
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={handleToggleFollowUpDone}
                            className="shrink-0 text-xs font-semibold text-gold hover:underline"
                          >
                            {details.follow_up_done ? 'Undo' : 'Mark done'}
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleStartEditDetails}
                        className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartEditDetails}
                      className="text-sm text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                    >
                      <CalendarClock className="w-4 h-4" />
                      Add where you met and a reminder
                    </button>
                  )}
                </div>

                {/* Your Notes Section */}
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Your Notes
                  </h3>
                  {isEditingNote ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        placeholder="Add a private note"
                        rows={3}
                        aria-label="Edit connection note"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveNote}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-gold transition-colors hover:bg-primary/10"
                          aria-label="Save note"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEditNote}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Cancel editing note"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : connectionNotes?.note ? (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-sm text-muted-foreground italic">{connectionNotes.note}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={handleStartEditNote}
                          className="text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                          aria-label="Edit note"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={handleDeleteNote}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Delete note"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartEditNote}
                      className="text-sm text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                      aria-label="Add note"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Add a private note
                    </button>
                  )}
                </div>

                {/* Your Tags Section */}
                <div className="mt-6 border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Your Tags
                    </h3>
                    <button
                      onClick={() => setShowTagDialog(true)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-gold transition-colors hover:bg-primary/10"
                      aria-label="Manage tags"
                    >
                      <Plus className="w-4 h-4" />
                      Manage
                    </button>
                  </div>
                  {connectionNotes?.tags && connectionNotes.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {connectionNotes.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-gold text-sm rounded-full"
                        >
                          {tag.tag_name}
                          <button
                            onClick={() => handleRemoveTag(tag.id)}
                            className="hover:text-destructive transition-colors"
                            aria-label={`Remove ${tag.tag_name} tag`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tags assigned yet</p>
                  )}
                </div>
              </div>
            ) : (
              // STATE 2: Not connected - show limited preview with Know More button
              <PublicProfilePreview
                profile={profile}
                isOwner={false}
                connectionStatus={connectionStatus}
              />
            )}

            {!isOwner && (
              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleSaveContact}
                >
                  <UserPlus aria-hidden="true" />
                  Save to contacts
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Tag Management Dialog */}
      <Dialog
        open={showTagDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowTagDialog(false);
            setNewTagName('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage your tags</DialogTitle>
            <DialogDescription>Tags are private to you. Other people never see them.</DialogDescription>
          </DialogHeader>
          <div>
            {/* Create new tag */}
            <div className="mb-4 flex gap-2">
              <Input
                type="text"
                placeholder="New tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
                aria-label="New tag name"
              />
              <Button size="icon-lg" onClick={handleCreateTag} disabled={!newTagName.trim()} aria-label="Create tag">
                <Plus aria-hidden="true" />
              </Button>
            </div>

            {/* Tag list */}
            <div className="space-y-2">
              {userTags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tags yet. Create one above.
                </p>
              ) : (
                userTags.map((tag) => {
                  const isAssigned = connectionNotes?.tags?.some(t => t.id === tag.id);

                  return (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                    >
                      <span className="text-sm text-foreground">{tag.tag_name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (isAssigned) {
                              handleRemoveTag(tag.id);
                            } else {
                              handleAssignTag(tag.id);
                            }
                          }}
                          className={`h-8 rounded-lg px-3 text-xs font-semibold transition-colors ${
                            isAssigned
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-input bg-card hover:border-primary/60'
                          }`}
                          aria-label={isAssigned ? 'Remove tag' : 'Assign tag'}
                        >
                          {isAssigned ? 'Assigned' : 'Assign'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
