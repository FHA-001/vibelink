"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Check, X, Loader2, Trash2, Calendar, Clock, Search, ArrowUpDown, MessageSquare, Tag, Plus, Edit2, Save } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { AppHeader } from "@/components/app-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SafetyMenu } from "@/components/profile/safety-menu";
import { BlockDialog } from "@/components/profile/block-dialog";
import { ReportDialog } from "@/components/profile/report-dialog";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  getPendingRequests,
  getSentRequests,
  updateConnectionRequestStatus,
  cancelConnectionRequest,
  ConnectionRequestWithProfile,
  getUserConnections,
  deleteConnection,
  ConnectionWithProfile,
  getConnectionNotesAndTags,
  upsertConnectionNote,
  deleteConnectionNote,
  getUserTags,
  createConnectionTag,
  deleteConnectionTag,
  assignTagToConnection,
  removeTagFromConnection,
  ConnectionNotesAndTags,
  ConnectionTag
} from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

export default function ConnectionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequestWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequestWithProfile[]>([]);
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    run: () => void | Promise<void>;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name_asc" | "name_desc">("newest");

  // Notes and tags state
  const [connectionNotes, setConnectionNotes] = useState<Record<string, ConnectionNotesAndTags>>({});
  const [userTags, setUserTags] = useState<ConnectionTag[]>([]);
  const [editingNoteConnectionId, setEditingNoteConnectionId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedConnectionForTags, setSelectedConnectionForTags] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadPendingRequests();
      loadSentRequests();
      loadConnections();
      loadUserTags();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/signin");
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/signin");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const requests = await getPendingRequests(user.id);
      setPendingRequests(requests);
    } catch (error) {
      console.error("Error loading pending requests:", error);
    }
  };

  const loadSentRequests = async () => {
    try {
      const requests = await getSentRequests(user.id);
      setSentRequests(requests);
    } catch (error) {
      console.error("Error loading sent requests:", error);
    }
  };

  const loadConnections = async () => {
    try {
      const userConnections = await getUserConnections(user.id);
      setConnections(userConnections);

      // Load notes and tags for each connection
      for (const connection of userConnections) {
        const result = await getConnectionNotesAndTags(connection.id);
        if (result.success && result.data) {
          setConnectionNotes(prev => ({
            ...prev,
            [connection.id]: result.data!
          }));
        }
      }
    } catch (error) {
      console.error("Error loading connections:", error);
    }
  };

  const loadUserTags = async () => {
    try {
      const result = await getUserTags();
      if (result.success && result.tags) {
        setUserTags(result.tags);
      }
    } catch (error) {
      console.error("Error loading user tags:", error);
      // Set empty array as fallback if RPC doesn't exist yet (migration not applied)
      setUserTags([]);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const result = await updateConnectionRequestStatus(requestId, 'accepted');
      if (result.success) {
        loadPendingRequests();
        loadConnections();
        toast({ title: "Connection accepted", description: "You can now see their full profile." });
      } else {
        console.error("Accept request failed:", result.error);
        toast({
          title: "Could not accept the request",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      toast({
        title: "Could not accept the request",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const result = await updateConnectionRequestStatus(requestId, 'declined');
      if (result.success) {
        loadPendingRequests();
        toast({ title: "Request declined" });
      } else {
        toast({
          title: "Could not decline the request",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error declining request:", error);
      toast({
        title: "Could not decline the request",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelRequest = (requestId: string) => {
    setConfirmAction({
      title: "Cancel this request?",
      description: "The other person will no longer see your connection request.",
      confirmLabel: "Cancel request",
      run: () => performCancelRequest(requestId),
    });
  };

  const performCancelRequest = async (requestId: string) => {
    setCancellingRequestId(requestId);

    try {
      const result = await cancelConnectionRequest(requestId);
      if (result.success) {
        loadSentRequests();
        toast({ title: "Request cancelled" });
      } else {
        toast({
          title: "Could not cancel the request",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Could not cancel the request",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingRequestId(null);
    }
  };

  const handleRemoveConnection = (connectionId: string) => {
    setConfirmAction({
      title: "Remove this connection?",
      description: "You will no longer see each other's full profiles. Your private note and tags for this person will go with it.",
      confirmLabel: "Remove connection",
      run: () => performRemoveConnection(connectionId),
    });
  };

  const performRemoveConnection = async (connectionId: string) => {
    try {
      const result = await deleteConnection(connectionId);
      if (result.success) {
        loadConnections();
        toast({ title: "Connection removed" });
      } else {
        toast({
          title: "Could not remove the connection",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing connection:", error);
      toast({
        title: "Could not remove the connection",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Notes handlers
  const handleStartEditNote = (connectionId: string) => {
    const currentNote = connectionNotes[connectionId]?.note || "";
    setEditingNoteConnectionId(connectionId);
    setEditingNoteText(currentNote);
  };

  const handleSaveNote = async (connectionId: string) => {
    if (!editingNoteText.trim()) {
      // Delete note if empty
      const result = await deleteConnectionNote(connectionId);
      if (result.success) {
        setConnectionNotes(prev => ({
          ...prev,
          [connectionId]: { note: null, tags: prev[connectionId]?.tags || [] }
        }));
        setEditingNoteConnectionId(null);
        setEditingNoteText("");
      }
      return;
    }

    const result = await upsertConnectionNote(connectionId, editingNoteText);
    if (result.success) {
      setConnectionNotes(prev => ({
        ...prev,
        [connectionId]: { note: editingNoteText, tags: prev[connectionId]?.tags || [] }
      }));
      setEditingNoteConnectionId(null);
      setEditingNoteText("");
      toast({ title: "Note saved" });
    } else {
      toast({ title: "Could not save the note", description: result.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleCancelEditNote = () => {
    setEditingNoteConnectionId(null);
    setEditingNoteText("");
  };

  // Tags handlers
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const result = await createConnectionTag(newTagName.trim());
    if (result.success) {
      loadUserTags();
      setNewTagName("");
    } else {
      toast({ title: "Could not create the tag", description: result.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleDeleteTag = (tagId: string) => {
    setConfirmAction({
      title: "Delete this tag?",
      description: "It will be removed from every connection it is assigned to.",
      confirmLabel: "Delete tag",
      run: () => performDeleteTag(tagId),
    });
  };

  const performDeleteTag = async (tagId: string) => {
    const result = await deleteConnectionTag(tagId);
    if (result.success) {
      loadUserTags();
      // Reload connections to refresh tag assignments
      loadConnections();
      toast({ title: "Tag deleted" });
    } else {
      toast({ title: "Could not delete the tag", description: result.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleAssignTag = async (connectionId: string, tagId: string) => {
    const result = await assignTagToConnection(connectionId, tagId);
    if (result.success) {
      // Reload this connection's notes and tags
      const notesResult = await getConnectionNotesAndTags(connectionId);
      if (notesResult.success && notesResult.data) {
        setConnectionNotes(prev => ({
          ...prev,
          [connectionId]: notesResult.data!
        }));
      }
    } else {
      toast({ title: "Could not assign the tag", description: result.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleRemoveTag = async (connectionId: string, tagId: string) => {
    const result = await removeTagFromConnection(connectionId, tagId);
    if (result.success) {
      // Reload this connection's notes and tags
      const notesResult = await getConnectionNotesAndTags(connectionId);
      if (notesResult.success && notesResult.data) {
        setConnectionNotes(prev => ({
          ...prev,
          [connectionId]: notesResult.data!
        }));
      }
    } else {
      toast({ title: "Could not remove the tag", description: result.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleBlock = async () => {
    if (!selectedUser) return;
    
    try {
      const { createBlock } = await import('@/lib/auth');
      const result = await createBlock(selectedUser.id);
      
      if (result.success) {
        toast({
          title: "User blocked",
          description: `@${selectedUser.username} has been blocked.`,
        });
        setBlockDialogOpen(false);
        loadPendingRequests();
        loadConnections();
      } else {
        toast({
          title: "Failed to block user",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to block user",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleReport = async (reason: string, details?: string) => {
    if (!selectedUser) return;
    
    try {
      const { createProfileReport } = await import('@/lib/auth');
      const result = await createProfileReport(selectedUser.id, reason, details);
      
      if (result.success) {
        toast({
          title: "Report submitted",
          description: "Thank you for helping keep VibeLink safe.",
        });
        setReportDialogOpen(false);
      } else {
        const errorMessage = result.error || "Please try again.";
        toast({
          title: "Unable to submit report",
          description: errorMessage.includes("rate limit") 
            ? "You've submitted several reports recently. Please try again later."
            : errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Unable to submit report",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const openBlockDialog = (userId: string, username: string) => {
    setSelectedUser({ id: userId, username });
    setBlockDialogOpen(true);
  };

  const openReportDialog = (userId: string, username: string) => {
    setSelectedUser({ id: userId, username });
    setReportDialogOpen(true);
  };

  // Filter and sort connections
  const filteredAndSortedConnections = connections
    .filter((connection) => {
      if (!searchQuery.trim()) return true;

      const profile = connection.other_user_profile;
      const query = searchQuery.toLowerCase();

      // Search in name, username, job title, company/school
      const searchableFields = [
        profile?.full_name || "",
        profile?.username || "",
        profile?.job_title || "",
        profile?.company_school || "",
      ].join(" ").toLowerCase();

      return searchableFields.includes(query);
    })
    .sort((a, b) => {
      const profileA = a.other_user_profile;
      const profileB = b.other_user_profile;

      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc":
          const nameA = (profileA?.full_name || profileA?.username || "").toLowerCase();
          const nameB = (profileB?.full_name || profileB?.username || "").toLowerCase();
          return nameA.localeCompare(nameB);
        case "name_desc":
          const nameADesc = (profileA?.full_name || profileA?.username || "").toLowerCase();
          const nameBDesc = (profileB?.full_name || profileB?.username || "").toLowerCase();
          return nameBDesc.localeCompare(nameADesc);
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="page-canvas flex min-h-screen flex-col pb-24" aria-busy="true">
        <AppHeader />
        <main id="main-content" className="flex-1 px-4 py-8 sm:px-6">
          <span className="sr-only" role="status">Loading your connections</span>
          <div className="mx-auto max-w-2xl space-y-4">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-canvas min-h-screen flex flex-col pb-24 md:pb-28">
      {/* Header */}
      <AppHeader />

      {/* Main Content */}
      <main id="main-content" className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-heading text-3xl font-semibold">Connections</h1>
            <p className="mb-8 mt-1 text-muted-foreground">
              The people you have met, with notes and tags only you can see.
            </p>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-6"
              >
                <div className="bg-card rounded-2xl shadow-lg p-5 border border-primary/40">
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="w-5 h-5 text-gold" />
                    <h2 className="font-heading text-lg font-semibold">
                      Pending requests ({pendingRequests.length})
                    </h2>
                  </div>
                  
                  <div className="space-y-3">
                    {pendingRequests.map((request) => {
                      const senderUsername = request.sender_profile?.username || '';
                      return (
                        <div
                          key={request.id}
                          className="bg-muted/30 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">
                              @{senderUsername}
                            </p>
                            {request.sender_profile?.bio && (
                              <p className="text-xs text-muted-foreground truncate">
                                {request.sender_profile.bio}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptRequest(request.id)}
                              className="flex size-10 items-center justify-center rounded-xl bg-secondary/15 text-teal-ink transition-colors hover:bg-secondary/25 active:scale-95"
                              aria-label="Accept request"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(request.id)}
                              className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-colors hover:bg-destructive/15 active:scale-95"
                              aria-label="Decline request"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            {request.sender_profile && (
                              <SafetyMenu
                                onBlock={() => openBlockDialog(request.sender_id, senderUsername)}
                                onReport={() => openReportDialog(request.sender_id, senderUsername)}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sent Requests Section */}
            {sentRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mb-6"
              >
                <div className="bg-card rounded-2xl shadow-md p-5 border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <h2 className="font-heading text-lg font-semibold">
                      Sent requests ({sentRequests.length})
                    </h2>
                  </div>
                  
                  <div className="space-y-3">
                    {sentRequests.map((request) => {
                      const receiverProfile = request.sender_profile;
                      const receiverUsername = receiverProfile?.username || 'Unknown';
                      const receiverFullName = receiverProfile?.full_name || '';
                      return (
                        <div
                          key={request.id}
                          className="bg-muted/30 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">
                              {receiverFullName ? `${receiverFullName} (@${receiverUsername})` : `@${receiverUsername}`}
                            </p>
                            {receiverProfile?.bio && (
                              <p className="text-xs text-muted-foreground truncate">
                                {receiverProfile.bio}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium">Pending</span>
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              disabled={cancellingRequestId === request.id}
                              className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Cancel request"
                            >
                              {cancellingRequestId === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                            {receiverProfile && (
                              <SafetyMenu
                                onBlock={() => openBlockDialog(request.receiver_id, receiverUsername)}
                                onReport={() => openReportDialog(request.receiver_id, receiverUsername)}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* No Connections State */}
            {pendingRequests.length === 0 && sentRequests.length === 0 && connections.length === 0 && (
              <EmptyState
                icon={<Users />}
                title="No connections yet"
                description="Share your QR code or profile link. When someone sends a request, it will appear here."
                action={
                  <Link href="/my-card" className={buttonVariants({ size: "lg" })}>
                    Show my QR code
                  </Link>
                }
              />
            )}

            {/* My Connections Section */}
            {connections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-xl font-semibold">My connections ({connections.length})</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTagDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4" />
                    Manage tags
                  </Button>
                </div>

                {/* Search and Sort Controls */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by name, username, job title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      aria-label="Search connections"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name_asc" | "name_desc")}
                      className="flex-1 h-11 bg-card border border-input rounded-xl px-3 text-sm text-foreground focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/25"
                      aria-label="Sort connections"
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="name_asc">Name (A-Z)</option>
                      <option value="name_desc">Name (Z-A)</option>
                    </select>
                  </div>
                </div>

                {/* No Results State */}
                {filteredAndSortedConnections.length === 0 && searchQuery.trim() && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No connections match your search.</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {filteredAndSortedConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className="bg-card rounded-2xl p-4 shadow-sm border border-border hover:border-primary/40 hover:shadow-md transition-[border-color,box-shadow]"
                    >
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/u/${connection.other_user_profile?.username}`}
                          className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0"
                        >
                          {connection.other_user_profile?.profile_photo ? (
                            <img
                              src={connection.other_user_profile.profile_photo}
                              alt={connection.other_user_profile.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gold font-semibold">
                              {connection.other_user_profile?.full_name?.charAt(0) || connection.other_user_profile?.username?.charAt(0)}
                            </span>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/u/${connection.other_user_profile?.username}`}
                            className="block"
                          >
                            <p className="font-medium text-foreground text-sm hover:text-gold transition-colors">
                              {connection.other_user_profile?.full_name || connection.other_user_profile?.username}
                            </p>
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {connection.other_user_profile?.job_title}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>Connected {new Date(connection.created_at).toLocaleDateString()}</span>
                          </div>

                          {/* Tags */}
                          {connectionNotes[connection.id]?.tags && connectionNotes[connection.id].tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {connectionNotes[connection.id].tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-gold text-xs rounded-full"
                                >
                                  {tag.tag_name}
                                  <button
                                    onClick={() => handleRemoveTag(connection.id, tag.id)}
                                    className="hover:text-destructive transition-colors"
                                    aria-label={`Remove ${tag.tag_name} tag`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Note */}
                          {editingNoteConnectionId === connection.id ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                placeholder="Add a private note..."
                                className="w-full px-3 py-2 text-sm bg-card border border-input rounded-xl focus:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/25 resize-none"
                                rows={2}
                                aria-label="Edit connection note"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveNote(connection.id)}
                                  className="text-xs text-gold hover:text-gold/80 transition-colors flex items-center gap-1"
                                  aria-label="Save note"
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEditNote}
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Cancel editing note"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : connectionNotes[connection.id]?.note ? (
                            <div className="mt-2 p-2 bg-muted/30 rounded-md">
                              <p className="text-xs text-muted-foreground italic">{connectionNotes[connection.id].note}</p>
                              <button
                                onClick={() => handleStartEditNote(connection.id)}
                                className="mt-1 text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                                aria-label="Edit note"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditNote(connection.id)}
                              className="mt-2 text-xs text-muted-foreground hover:text-gold transition-colors flex items-center gap-1"
                              aria-label="Add note"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Add note
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => {
                              setSelectedConnectionForTags(connection.id);
                              setShowTagDialog(true);
                            }}
                            className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/12 hover:text-gold"
                            aria-label="Add tags"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveConnection(connection.id)}
                            className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Remove connection"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {connection.other_user_profile && (
                            <SafetyMenu
                              onBlock={() => openBlockDialog(connection.other_user_profile.id, connection.other_user_profile.username)}
                              onReport={() => openReportDialog(connection.other_user_profile.id, connection.other_user_profile.username)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Dialogs */}
      {selectedUser && (
        <>
          <BlockDialog
            open={blockDialogOpen}
            onOpenChange={setBlockDialogOpen}
            targetUsername={selectedUser.username}
            onConfirm={handleBlock}
          />
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            targetUsername={selectedUser.username}
            onConfirm={handleReport}
          />
        </>
      )}

      {/* Tag Management Dialog */}
      <Dialog
        open={showTagDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowTagDialog(false);
            setSelectedConnectionForTags(null);
            setNewTagName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedConnectionForTags ? 'Add tags to this connection' : 'Manage tags'}
            </DialogTitle>
            <DialogDescription>Tags are private to you. Other people never see them.</DialogDescription>
          </DialogHeader>
          <div>

            {/* Create new tag */}
            <div className="flex gap-2 mb-4">
              <Input
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
                aria-label="New tag name"
              />
              <Button
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                size="sm"
              >
                <Plus className="w-4 h-4" />
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
                  const isAssigned = selectedConnectionForTags
                    ? connectionNotes[selectedConnectionForTags]?.tags?.some(t => t.id === tag.id)
                    : false;

                  return (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                    >
                      <span className="text-sm text-foreground">{tag.tag_name}</span>
                      <div className="flex gap-2">
                        {selectedConnectionForTags && (
                          <button
                            onClick={() => {
                              if (isAssigned) {
                                handleRemoveTag(selectedConnectionForTags, tag.id);
                              } else {
                                handleAssignTag(selectedConnectionForTags, tag.id);
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
                        )}
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-xs text-destructive hover:text-destructive/80"
                          aria-label="Delete tag"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTagDialog(false);
                  setSelectedConnectionForTags(null);
                  setNewTagName("");
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description}
        confirmLabel={confirmAction?.confirmLabel}
        destructive
        onConfirm={async () => {
          await confirmAction?.run();
        }}
      />
    </div>
  );
}