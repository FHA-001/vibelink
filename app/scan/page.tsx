"use client";

import { motion } from "framer-motion";
import { Scan, QrCode } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <Link href="/">
          <Logo />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Scan className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Scan QR Code</h1>
            <p className="text-foreground/70 mb-6">
              Scan someone's VibeLink QR code to view their profile and connect.
            </p>
            <div className="bg-muted/30 rounded-2xl p-8 border-2 border-dashed border-border">
              <QrCode className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
              <p className="text-sm text-foreground/50">
                Camera feature coming soon
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