"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Check, X, Loader2, Trash2, Calendar } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  getCurrentUser, 
  getPendingRequests, 
  updateConnectionRequestStatus, 
  ConnectionRequestWithProfile,
  getUserConnections,
  deleteConnection,
  ConnectionWithProfile
} from "@/lib/auth";

export default function ConnectionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequestWithProfile[]>([]);
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadPendingRequests();
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
      }
    } catch (error) {
      console.error("Error accepting request:", error);
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
      <header className="p-4 border-b border-border">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
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
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-muted/30 rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">
                            @{request.sender_profile?.username}
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* No Connections State */}
            {pendingRequests.length === 0 && connections.length === 0 && (
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
    </div>
  );
}