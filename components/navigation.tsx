"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, User, Users, Settings, LogOut } from "lucide-react";
import { Logo } from "./logo";
import { buttonVariants } from "./ui/button";
import { getCurrentUser, signOut } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Features", href: "/features" },
  { name: "How it works", href: "/how-it-works" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
];

const accountLinks = [
  { name: "My Card", href: "/my-card", icon: User },
  { name: "Connections", href: "/connections", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Close menus whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Close user menu on outside click or Escape
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isUserMenuOpen]);

  // Mobile menu: lock page scroll, close on Escape and return focus to the toggle
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    setIsAuthenticated(false);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  const isActive = (href: string) => pathname === href;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        isScrolled || isMobileMenuOpen
          ? "border-b border-border bg-background/90 backdrop-blur-md"
          : "border-b border-transparent bg-background/0"
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:px-8"
      >
        <Link href="/" aria-label="VibeLink home" className="rounded-lg">
          <Logo />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "group relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href) ? "text-navy" : "text-muted-foreground hover:text-navy"
              )}
            >
              {link.name}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-3 -bottom-0.5 h-px origin-left bg-primary transition-transform duration-300 ease-out",
                  isActive(link.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                )}
              />
            </Link>
          ))}

          <div className="ml-4 flex h-10 min-w-[11rem] items-center justify-end gap-2">
            {isLoading ? (
              <div className="skeleton h-10 w-40" aria-hidden="true" />
            ) : isAuthenticated ? (
              <>
                <Link href="/my-card" className={buttonVariants({ variant: "default" })}>
                  My Card
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((open) => !open)}
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                    aria-label="Account menu"
                    className="flex size-10 items-center justify-center rounded-xl border border-input bg-card text-navy transition-colors hover:border-primary/60"
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-200",
                        isUserMenuOpen && "rotate-180"
                      )}
                    />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-xl"
                      >
                        {accountLinks.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <item.icon className="size-4 text-gold" />
                            {item.name}
                          </Link>
                        ))}
                        <div className="my-1.5 h-px bg-border" />
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleSignOut}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <LogOut className="size-4" />
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-navy transition-colors hover:text-gold"
                >
                  Sign in
                </Link>
                <Link href="/welcome" className={buttonVariants({ variant: "default" })}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          className="flex size-11 items-center justify-center rounded-xl text-navy transition-colors hover:bg-muted md:hidden"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
        >
          {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-4 pb-8 pt-3">
              <ul className="divide-y divide-border">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between py-4 text-lg font-medium",
                        isActive(link.href) ? "text-gold" : "text-navy"
                      )}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-3">
                {isLoading ? null : isAuthenticated ? (
                  <>
                    {accountLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={buttonVariants({
                          variant: item.href === "/my-card" ? "default" : "outline",
                          size: "lg",
                          className: "w-full justify-start",
                        })}
                      >
                        <item.icon />
                        {item.name}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "lg",
                        className: "w-full justify-start text-destructive hover:text-destructive",
                      })}
                    >
                      <LogOut />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/welcome"
                      className={buttonVariants({ size: "lg", className: "w-full" })}
                    >
                      Get started
                    </Link>
                    <Link
                      href="/signin"
                      className={buttonVariants({
                        variant: "outline",
                        size: "lg",
                        className: "w-full",
                      })}
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
