"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Share2, MessageSquare, Edit2, Save, Tag, X, Plus } from "lucide-react";
import { getProfileByUsername, PublicProfile, ConnectedProfile, getCurrentUser, getConnectionStatus, getConnectionId, getConnectionNotesAndTags, upsertConnectionNote, deleteConnectionNote, getUserTags, assignTagToConnection, removeTagFromConnection, createConnectionTag, ConnectionNotesAndTags, ConnectionTag } from "@/lib/auth";
import { PublicProfilePreview } from "@/components/profile/public-profile-preview";
import { ProfileCard } from "@/components/profile/profile-card";
import { Logo } from "@/components/logo";
import { BottomNav } from "@/components/bottom-nav";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  params: Promise<{ username: string }>
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
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const result = await createConnectionTag(newTagName.trim());
    if (result.success) {
      await loadUserTags();
      setNewTagName('');
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
      navigator.clipboard.writeText(shareUrl);
      alert("Profile link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="p-4 sm:p-6">
          <Link href="/">
            <Logo />
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Profile Not Found</h1>
            <p className="text-foreground/70 mb-6">
              The profile you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
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
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between border-b border-border">
        <button
          onClick={handleBack}
          className="text-foreground/70 hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Link href="/">
          <Logo />
        </Link>
        <button
          onClick={handleShare}
          className="text-foreground/70 hover:text-foreground"
          aria-label="Share profile"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {isOwner ? (
              // STATE 1: Profile owner - redirect to my-card
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  This is your profile
                </h2>
                <p className="text-foreground/70 mb-6">
                  View your full profile on your card page
                </p>
                <Link
                  href="/my-card"
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl font-medium transition-colors"
                >
                  Go to My Card
                </Link>
              </div>
            ) : isConnected && isFullProfile(profile) ? (
              // STATE 3: Connected user - show full profile
              <div>
                <div className="mb-4 flex items-center justify-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">Connected</span>
                </div>
                <ProfileCard
                  profile={profile}
                  isOwner={false}
                  showActions={false}
                />

                {/* Your Notes Section */}
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Your Notes
                  </h3>
                  {isEditingNote ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        placeholder="Add a private note..."
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        rows={3}
                        aria-label="Edit connection note"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveNote}
                          className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                          aria-label="Save note"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEditNote}
                          className="text-sm text-foreground/50 hover:text-foreground transition-colors"
                          aria-label="Cancel editing note"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : connectionNotes?.note ? (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-foreground/70 italic">{connectionNotes.note}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={handleStartEditNote}
                          className="text-xs text-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
                          aria-label="Edit note"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={handleDeleteNote}
                          className="text-xs text-foreground/50 hover:text-destructive transition-colors"
                          aria-label="Delete note"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartEditNote}
                      className="text-sm text-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
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
                      className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
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
                          className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
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
                    <p className="text-sm text-foreground/50">No tags assigned yet</p>
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
          </motion.div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Tag Management Dialog */}
      {showTagDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Manage Your Tags
            </h3>

            {/* Create new tag */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="New tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="New tag name"
              />
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
                aria-label="Create tag"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Tag list */}
            <div className="space-y-2">
              {userTags.length === 0 ? (
                <p className="text-sm text-foreground/50 text-center py-4">
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
                          className={`text-xs px-2 py-1 rounded ${
                            isAssigned
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background border border-border hover:border-primary/50'
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

            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setShowTagDialog(false);
                  setNewTagName('');
                }}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}