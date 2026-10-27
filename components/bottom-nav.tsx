"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Scan, Users, Settings, Bell, X, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, getUnreadNotificationCount, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "My Card", href: "/my-card", icon: User },
  { label: "Scan", href: "/scan", icon: Scan },
  { label: "Connections", href: "/connections", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

const itemBase =
  "relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  // Close notification panel on outside click or escape key
  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(target) &&
        !bellButtonRef.current?.contains(target)
      ) {
        setShowNotifications(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        bellButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showNotifications]);

  const loadUnreadCount = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const count = await getUnreadNotificationCount(user.id);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        const userNotifications = await getUserNotifications(user.id);
        setNotifications(userNotifications);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      loadUnreadCount();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread (non-blocking for navigation)
    if (!notification.is_read) {
      try {
        await handleMarkAsRead(notification.id);
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        // Continue with navigation even if mark-as-read fails
      }
    }

    // Close notification panel
    setShowNotifications(false);

    // All supported notification types (connection_request, connection_accepted,
    // connection_declined) relate to connection requests, so route to /connections.
    router.push('/connections');
  };

  const handleBellClick = async () => {
    if (showNotifications) {
      setShowNotifications(false);
      return;
    }
    setNotificationsLoading(true);
    setShowNotifications(true);
    await loadNotifications();
    setNotificationsLoading(false);
    // Mark all notifications as read when opening the dropdown
    const user = await getCurrentUser();
    if (user) {
      const result = await markAllNotificationsAsRead(user.id);
      if (result.success) {
        // Reload unread count after marking as read
        loadUnreadCount();
      } else {
        console.error("Failed to mark notifications as read:", result.error);
      }
    }
  };

  return (
    <>
      <motion.nav
        aria-label="App"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:inset-x-auto md:bottom-5 md:left-1/2 md:w-[26rem] md:-translate-x-1/2 md:rounded-3xl md:border md:pb-0 md:shadow-xl"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 px-2 py-1.5 sm:gap-1 sm:px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  itemBase,
                  isActive ? "text-navy" : "text-muted-foreground hover:text-navy"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-2xl bg-primary/18"
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative size-5" strokeWidth={isActive ? 2.3 : 1.9} />
                <span className="relative truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* Notification Button */}
          <button
            ref={bellButtonRef}
            type="button"
            onClick={handleBellClick}
            aria-haspopup="dialog"
            aria-expanded={showNotifications}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            className={cn(
              itemBase,
              showNotifications ? "bg-primary/18 text-navy" : "text-muted-foreground hover:text-navy"
            )}
          >
            <span className="relative">
              <Bell className="size-5" strokeWidth={showNotifications ? 2.3 : 1.9} />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            <span>Alerts</span>
          </button>
        </div>
      </motion.nav>

      {/* Notification Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            ref={notificationPanelRef}
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-[5.25rem] z-[60] flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:right-4 sm:w-[400px] md:bottom-24"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-heading text-base font-semibold">Notifications</h2>
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(false);
                  bellButtonRef.current?.focus();
                }}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
                aria-label="Close notifications"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="overflow-y-auto">
              {notificationsLoading ? (
                <div className="space-y-3 p-5" aria-busy="true">
                  <span className="sr-only">Loading notifications</span>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton h-14 w-full" aria-hidden="true" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-12 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <BellOff className="size-5" />
                  </div>
                  <p className="font-medium text-navy">You are all caught up</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Connection requests and replies will show up here.
                  </p>
                </div>
              ) : (
                <ul>
                  {notifications.map((notification) => (
                    <li key={notification.id} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/70",
                          !notification.is_read && "bg-primary/[0.07]"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "mt-1.5 size-2 shrink-0 rounded-full",
                            notification.is_read ? "bg-foreground/20" : "bg-primary"
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-navy">
                            {notification.title}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {notification.message}
                          </span>
                          <span className="mt-1.5 block text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleDateString()} at{" "}
                            {new Date(notification.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
