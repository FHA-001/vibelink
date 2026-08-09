"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Scan, Users, Settings, Bell, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCurrentUser, getUnreadNotificationCount, getUserNotifications, markNotificationAsRead, Notification } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "My Card", href: "/my-card", icon: Home },
  { label: "Scan", href: "/scan", icon: Scan },
  { label: "Connections", href: "/connections", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadUnreadCount();
  }, []);

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

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 z-50"
    >
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-foreground/50 hover:text-foreground"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Notification Button */}
          <button
            onClick={() => {
              if (showNotifications) {
                setShowNotifications(false);
              } else {
                loadNotifications();
                setShowNotifications(true);
              }
            }}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-colors relative",
              showNotifications
                ? "text-primary bg-primary/10"
                : "text-foreground/50 hover:text-foreground"
            )}
          >
            <div className="relative">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Alerts</span>
          </button>
        </div>
      </div>
      
      {/* Notification Dropdown */}
      {showNotifications && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-full left-4 right-4 mb-2 bg-card rounded-2xl shadow-xl border border-border max-h-96 overflow-hidden z-[60]"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            <button
              onClick={() => setShowNotifications(false)}
              className="text-foreground/50 hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-foreground/50">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2",
                      notification.is_read ? "bg-foreground/20" : "bg-primary"
                    )} />
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{notification.title}</p>
                      <p className="text-xs text-foreground/70 mt-1">{notification.message}</p>
                      <p className="text-xs text-foreground/50 mt-2">
                        {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}