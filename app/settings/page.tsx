"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, LogOut, User, Key, Trash2, AlertTriangle, Shield, UserX } from "lucide-react";
import { getCurrentUser, signOut, getUserProfile, deleteAccount, removeBlock, getMyBlockedUsers, BlockedUser, Profile } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(true);
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadBlockedUsers();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/signin");
        return;
      }

      const userProfile = await getUserProfile(currentUser.id);
      setUser(currentUser);
      setProfile(userProfile);
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/signin");
    } finally {
      setIsLoading(false);
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const users = await getMyBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      console.error("Error loading blocked users:", error);
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  const handleUnblock = async (blockedUserId: string) => {
    setUnblockingUserId(blockedUserId);
    
    try {
      const result = await removeBlock(blockedUserId);
      
      if (result.success) {
        toast({
          title: "User unblocked",
          description: "The user has been unblocked successfully.",
        });
        // Remove from local state
        setBlockedUsers(prev => prev.filter(u => u.blocked_user_id !== blockedUserId));
      } else {
        toast({
          title: "Failed to unblock",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to unblock",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setUnblockingUserId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setDeleteConfirmation("");
    
    if (deleteConfirmation !== "DELETE") {
      setDeleteError("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteAccount();

      if (result.success) {
        setDeleteSuccess(true);
        setShowDeleteModal(false);
        // Redirect to home after a short delay
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setDeleteError(result.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      setDeleteError("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const settingsItems = [
    {
      icon: User,
      label: "Edit Profile",
      description: "Update your profile information",
      href: "/edit-profile",
    },
    {
      icon: Key,
      label: "Reset Password",
      description: "Reset your password via email",
      href: "/forgot-password",
    },
  ];

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
            <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

            {/* User Info */}
            {profile && (
              <div className="bg-card rounded-2xl p-4 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                  {profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{profile.full_name}</p>
                  <p className="text-sm text-foreground/70">@{profile.username}</p>
                </div>
              </div>
            )}

            {/* Settings Items */}
            <div className="space-y-3">
              {settingsItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block bg-card rounded-2xl p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-foreground/70">{item.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Blocked Users Section */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Blocked Users</h2>
              </div>
              
              {isLoadingBlocked ? (
                <div className="bg-card rounded-2xl p-6 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="bg-card rounded-2xl p-6 text-center">
                  <UserX className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
                  <p className="text-foreground/70">No blocked users</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((blockedUser) => (
                    <div
                      key={blockedUser.blocked_user_id}
                      className="bg-card rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                          <UserX className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {blockedUser.username ? `@${blockedUser.username}` : 'Unavailable user'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnblock(blockedUser.blocked_user_id)}
                        disabled={unblockingUserId === blockedUser.blocked_user_id}
                      >
                        {unblockingUserId === blockedUser.blocked_user_id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Unblocking...
                          </>
                        ) : (
                          'Unblock'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full mt-6 bg-destructive/10 hover:bg-destructive/20 text-destructive py-3 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>

            {/* Delete Account */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full mt-3 border-2 border-destructive/30 hover:border-destructive/50 text-destructive py-3 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>

            {/* Delete Account Modal */}
            {showDeleteModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card rounded-2xl p-6 max-w-md w-full"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Delete Account</h2>
                  </div>

                  <p className="text-foreground/70 mb-4">
                    This action is permanent and cannot be undone. All your data including:
                  </p>

                  <ul className="text-sm text-foreground/70 mb-4 space-y-1 list-disc list-inside">
                    <li>Profile information</li>
                    <li>Profile photo</li>
                    <li>Connections</li>
                    <li>Notifications</li>
                    <li>Account access</li>
                  </ul>

                  <p className="text-sm text-foreground/70 mb-4">
                    Type <span className="font-mono font-bold">DELETE</span> to confirm:
                  </p>

                  <Input
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE"
                    className="mb-4"
                    disabled={isDeleting}
                  />

                  {deleteError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{deleteError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteConfirmation("");
                        setDeleteError("");
                      }}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || deleteConfirmation !== "DELETE"}
                      className="flex-1"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Account"
                      )}
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Success Message */}
            {deleteSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 rounded-2xl p-6 text-center"
              >
                <p className="text-foreground font-medium mb-2">
                  Account Deleted Successfully
                </p>
                <p className="text-sm text-foreground/70">
                  Redirecting to home...
                </p>
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