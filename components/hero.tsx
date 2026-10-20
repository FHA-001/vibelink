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
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 break-words"
            >
              Your identity.
              <br />
              <span className="text-primary">One link.</span>
              <br />
              Every connection.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-foreground/70 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Create your premium digital card, share your QR code instantly, and build meaningful connections with private notes and personal tags.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/welcome" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-base px-4 sm:px-6 py-6 rounded-2xl shadow-lg shadow-primary/20"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-border hover:border-primary/50 text-foreground text-base px-4 sm:px-6 py-6 rounded-2xl"
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
            <div className="relative bg-card rounded-3xl shadow-2xl p-4 sm:p-6 max-w-md mx-auto border border-border/50">
              {/* Profile Header */}
              <div className="bg-accent rounded-2xl p-6 mb-6 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 pt-8 pb-16">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 ring-4 ring-white/30 flex items-center justify-center">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white text-center">Sarah Johnson</h3>
                <p className="text-white/80 text-center text-sm">@sarahjohnson</p>
              </div>

              {/* Profile Content */}
              <div className="px-2 sm:px-0 -mt-12">
                <div className="bg-card rounded-2xl shadow-lg p-4 sm:p-6 border border-border/50">
                  <p className="text-sm font-semibold text-foreground text-center mb-1">Product Designer</p>
                  <p className="text-foreground/70 text-xs sm:text-sm text-center mb-4 leading-relaxed">
                    Passionate about creating beautiful digital experiences.
                  </p>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/70">
                      <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="break-all">sarah@vibelink.com</span>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex gap-2 justify-center">
                    <a
                      href="#"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                    >
                      <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </a>
                    <a
                      href="#"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center transition-colors"
                    >
                      <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
            </div>

            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-8 -right-8 bg-white rounded-2xl shadow-lg p-4 hidden sm:block border border-border/50"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
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