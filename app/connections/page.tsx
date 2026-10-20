"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Check, X, Loader2, Trash2, Calendar, Clock, Search, ArrowUpDown, MessageSquare, Tag, Plus, Edit2, Save } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import { SafetyMenu } from "@/components/profile/safety-menu";
import { BlockDialog } from "@/components/profile/block-dialog";
import { ReportDialog } from "@/components/profile/report-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      } else {
        console.error("Accept request failed:", result.error);
        alert(`Failed to accept request: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      alert("Failed to accept request. Please try again.");
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      const result = await updateConnectionRequestStatus(requestId, 'declined');
      if (result.success) {
        loadPendingRequests();
      }
    } catch (error) {
      console.error("Error declining request:", error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Cancel this connection request?")) return;

    setCancellingRequestId(requestId);

    try {
      const result = await cancelConnectionRequest(requestId);
      if (result.success) {
        loadSentRequests();
      } else {
        alert(`Failed to cancel request: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Failed to cancel request. Please try again.");
    } finally {
      setCancellingRequestId(null);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm("Are you sure you want to remove this connection?")) return;

    try {
      const result = await deleteConnection(connectionId);
      if (result.success) {
        loadConnections();
      }
    } catch (error) {
      console.error("Error removing connection:", error);
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
    } else {
      alert(`Failed to save note: ${result.error}`);
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
      alert(`Failed to create tag: ${result.error}`);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm("Delete this tag? It will be removed from all connections.")) return;

    const result = await deleteConnectionTag(tagId);
    if (result.success) {
      loadUserTags();
      // Reload connections to refresh tag assignments
      loadConnections();
    } else {
      alert(`Failed to delete tag: ${result.error}`);
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
      alert(`Failed to assign tag: ${result.error}`);
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
      alert(`Failed to remove tag: ${result.error}`);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-border">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-2xl font-bold text-foreground mb-6">Connections</h1>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-6"
              >
                <div className="bg-card rounded-2xl shadow-lg p-4 border-2 border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Pending Requests ({pendingRequests.length})
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
                              <p className="text-xs text-foreground/70 truncate">
                                {request.sender_profile.bio}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptRequest(request.id)}
                              className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-lg transition-colors"
                              aria-label="Accept request"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(request.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg transition-colors"
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
                <div className="bg-card rounded-2xl shadow-lg p-4 border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-foreground/70" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Sent Requests ({sentRequests.length})
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
                              <p className="text-xs text-foreground/70 truncate">
                                {receiverProfile.bio}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-foreground/70 font-medium">Pending</span>
                            <button
                              onClick={() => handleCancelRequest(request.id)}
                              disabled={cancellingRequestId === request.id}
                              className="p-2 text-foreground/50 hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No connections yet
                </h2>
                <p className="text-foreground/70 mb-6">
                  Share your QR code to receive connection requests.
                </p>
              </div>
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
                  <h2 className="text-lg font-semibold text-foreground">My Connections ({connections.length})</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTagDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4" />
                    Manage Tags
                  </Button>
                </div>

                {/* Search and Sort Controls */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
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
                    <ArrowUpDown className="w-4 h-4 text-foreground/50" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name_asc" | "name_desc")}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                    <p className="text-foreground/70">No connections match your search.</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  {filteredAndSortedConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className="bg-card rounded-xl p-4 shadow-sm border border-border hover:border-primary/30 transition-colors"
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
                            <span className="text-primary font-semibold">
                              {connection.other_user_profile?.full_name?.charAt(0) || connection.other_user_profile?.username?.charAt(0)}
                            </span>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/u/${connection.other_user_profile?.username}`}
                            className="block"
                          >
                            <p className="font-medium text-foreground text-sm hover:text-primary transition-colors">
                              {connection.other_user_profile?.full_name || connection.other_user_profile?.username}
                            </p>
                          </Link>
                          <p className="text-xs text-foreground/70">
                            {connection.other_user_profile?.job_title}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-foreground/50 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>Connected {new Date(connection.created_at).toLocaleDateString()}</span>
                          </div>

                          {/* Tags */}
                          {connectionNotes[connection.id]?.tags && connectionNotes[connection.id].tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {connectionNotes[connection.id].tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
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
                                className="w-full px-2 py-1 text-xs border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                rows={2}
                                aria-label="Edit connection note"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveNote(connection.id)}
                                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                  aria-label="Save note"
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEditNote}
                                  className="text-xs text-foreground/50 hover:text-foreground transition-colors"
                                  aria-label="Cancel editing note"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : connectionNotes[connection.id]?.note ? (
                            <div className="mt-2 p-2 bg-muted/30 rounded-md">
                              <p className="text-xs text-foreground/70 italic">{connectionNotes[connection.id].note}</p>
                              <button
                                onClick={() => handleStartEditNote(connection.id)}
                                className="mt-1 text-xs text-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
                                aria-label="Edit note"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditNote(connection.id)}
                              className="mt-2 text-xs text-foreground/50 hover:text-primary transition-colors flex items-center gap-1"
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
                            className="p-2 text-foreground/50 hover:text-primary transition-colors"
                            aria-label="Add tags"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveConnection(connection.id)}
                            className="p-2 text-foreground/50 hover:text-destructive transition-colors"
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
      {showTagDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {selectedConnectionForTags ? 'Add Tags to Connection' : 'Manage Tags'}
            </h3>

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
                <p className="text-sm text-foreground/50 text-center py-4">
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
        </div>
      )}
    </div>
  );
}