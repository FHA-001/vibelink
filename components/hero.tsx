"use client";

import { motion } from "framer-motion";
import { ArrowRight, QrCode, User, Mail, Link as LinkIcon } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            >
              Break the ice.
              <br />
              <span className="text-primary">Build real connections.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-foreground/70 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Create your digital introduction card, share your QR code, and build meaningful real-world connections.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/welcome">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-base px-8 py-6 rounded-2xl"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-foreground/20 hover:border-foreground/40 text-foreground text-base px-8 py-6 rounded-2xl"
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>

          {/* Right side - Digital Profile Card Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <div className="relative bg-card rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md mx-auto">
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Sarah Johnson</h3>
                    <p className="text-sm text-foreground/60">Product Designer</p>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
              </div>

              {/* Bio */}
              <p className="text-foreground/70 text-sm mb-6">
                Passionate about creating beautiful digital experiences. Love connecting with creative minds and building meaningful relationships.
              </p>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-foreground/70">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>sarah@vibelink.com</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-colors"
                >
                  <LinkIcon className="w-5 h-5 text-foreground/70" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-colors"
                >
                  <LinkIcon className="w-5 h-5 text-foreground/70" />
                </a>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
            </div>

            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-8 -right-8 bg-white rounded-2xl shadow-lg p-4 hidden sm:block"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">Scan to connect</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}