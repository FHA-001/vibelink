"use client";

import { motion } from "framer-motion";
import { QrCode, Tag, Clock, Wifi } from "lucide-react";
import Link from "next/link";

export function PhysicalProducts() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Your connections. Beyond the screen.
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Premium physical products designed to elevate how you share your VibeLink profile in the real world.
          </p>
        </motion.div>

        {/* NFC Card - Flagship Product */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="bg-card rounded-3xl p-8 sm:p-12 shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                <Clock className="w-3 h-3" />
                Coming Soon
              </span>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Card Visual */}
              <div className="relative mx-auto lg:mx-0">
                <div className="relative max-w-sm mx-auto">
                  <img
                    src="/images/vibelink-nfc-card.png"
                    alt="VibeLink NFC Card concept design showing NFC and QR code features"
                    className="rounded-2xl shadow-2xl w-full"
                  />
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
              </div>

              {/* Card Details */}
              <div className="text-center lg:text-left">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto lg:mx-0">
                  <Wifi className="w-8 h-8 text-primary" />
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  VibeLink NFC Card
                </h3>
                <p className="text-foreground/70 leading-relaxed mb-6">
                  Tap to instantly share your profile. No app required for scanners, just a simple tap with any NFC-enabled device. Also features a printed QR code for universal compatibility.
                </p>
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  <span className="text-xs text-foreground/50 bg-muted px-2 py-1 rounded-md">NFC tap to share</span>
                  <span className="text-xs text-foreground/50 bg-muted px-2 py-1 rounded-md">Printed QR code</span>
                  <span className="text-xs text-foreground/50 bg-muted px-2 py-1 rounded-md">Premium finish</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tags Section - Distinct product family */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="bg-card rounded-3xl p-8 sm:p-12 shadow-lg border border-border/50 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                <Clock className="w-3 h-3" />
                Coming Soon
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mb-6">
                  <Tag className="w-8 h-8 text-accent-foreground" />
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  VibeTags
                </h3>
                <p className="text-foreground/70 leading-relaxed mb-6">
                  Stylish branded tags for your bags, backpacks, lanyards, clothing accessories, and other personal items. Each tag displays your unique QR code, making it easy for others to connect with you wherever you go.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-foreground/50 bg-muted px-2 py-1 rounded-md">Bags and backpacks</span>
                  <span className="text-xs text-foreground/50 bg-muted px-2 py-1 rounded-md">Lanyards</span>
                  <span className="text-xs text-foreground/50 bg-muted px-2 py-1 rounded-md">Clothing accessories</span>
                </div>
              </div>

              <div className="relative">
                <div className="relative">
                  <img
                    src="/images/vibetags-showcase.png"
                    alt="VibeTags product family showcase featuring Classic, Circle, and Loop design concepts"
                    className="rounded-2xl shadow-lg w-full"
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA for interest */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-foreground/60 text-sm mb-4">
            Interested in physical products? Let us know.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Contact us for launch updates
            <QrCode className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
