"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Check, X, Loader2, Trash2, Calendar, Clock } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import { SafetyMenu } from "@/components/profile/safety-menu";
import { BlockDialog } from "@/components/profile/block-dialog";
import { ReportDialog } from "@/components/profile/report-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  getCurrentUser, 
  getPendingRequests, 
  getSentRequests,
  updateConnectionRequestStatus, 
  ConnectionRequestWithProfile,
  getUserConnections,
  deleteConnection,
  ConnectionWithProfile
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

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadPendingRequests();
      loadSentRequests();
      loadConnections();
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
    } catch (error) {
      console.error("Error loading connections:", error);
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
                      const receiverUsername = request.sender_profile?.username || '';
                      return (
                        <div
                          key={request.id}
                          className="bg-muted/30 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">
                              @{receiverUsername}
                            </p>
                            {request.sender_profile?.bio && (
                              <p className="text-xs text-foreground/70 truncate">
                                {request.sender_profile.bio}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-foreground/70 font-medium">Pending</span>
                            {request.sender_profile && (
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
                <h2 className="text-lg font-semibold text-foreground mb-4">My Connections ({connections.length})</h2>
                
                <div className="space-y-3">
                  {connections.map((connection) => (
                    <Link
                      key={connection.id}
                      href={`/u/${connection.other_user_profile?.username}`}
                      className="block"
                    >
                      <div className="bg-card rounded-xl p-4 shadow-sm border border-border hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
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
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">
                              {connection.other_user_profile?.full_name || connection.other_user_profile?.username}
                            </p>
                            <p className="text-xs text-foreground/70">
                              {connection.other_user_profile?.job_title}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-foreground/50 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>Connected {new Date(connection.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleRemoveConnection(connection.id);
                              }}
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
                    </Link>
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
    </div>
  );
}