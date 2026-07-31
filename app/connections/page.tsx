"use client";

import { motion } from "framer-motion";
import { Users, UserPlus } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default function ConnectionsPage() {
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
            
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No connections yet
              </h2>
              <p className="text-foreground/70 mb-6">
                Start scanning QR codes to build your network.
              </p>
              <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-2xl font-medium transition-colors">
                <UserPlus className="w-5 h-5" />
                Add Connection
              </button>
            </div>

            <div className="mt-8 bg-muted/30 rounded-2xl p-6 border-2 border-dashed border-border">
              <p className="text-sm text-foreground/50 text-center">
                Connection history and management coming soon
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}