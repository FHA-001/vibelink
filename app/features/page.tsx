"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";
import { QrCode, Users, Shield, Smartphone, Zap, Share2, Lock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const features = [
  {
    icon: QrCode,
    title: "QR Code Profiles",
    description: "Generate a unique QR code for your profile. Share it anywhere and let others scan to connect instantly.",
  },
  {
    icon: Users,
    title: "Smart Connections",
    description: "Build meaningful connections with a simple scan. Manage your network and track your connections.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Control what others see. Non-connected users only see a preview of your profile.",
  },
  {
    icon: Smartphone,
    title: "Mobile First",
    description: "Designed for mobile. Scan QR codes with your phone camera and connect on the go.",
  },
  {
    icon: Share2,
    title: "Easy Sharing",
    description: "Share your profile via QR code, link, or social media. Multiple ways to connect.",
  },
  {
    icon: Lock,
    title: "Secure Authentication",
    description: "Your data is protected with industry-standard encryption and security measures.",
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description: "Get notified instantly when someone sends you a connection request or accepts yours.",
  },
  {
    icon: Zap,
    title: "Fast Setup",
    description: "Create your profile in minutes. Just add your details and you're ready to connect.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navigation />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-6"
            >
              Features designed for meaningful connections
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-foreground/70"
            >
              Everything you need to break the ice and build real-world relationships.
            </motion.p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-foreground/70 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Deep Dive */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-foreground mb-12 text-center"
            >
              Built for real-world connections
            </motion.h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Instant QR Code Generation</h3>
                      <p className="text-foreground/70 text-sm">
                        Your unique QR code is generated automatically when you create your profile. Download it, print it, or share it digitally.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Privacy Controls</h3>
                      <p className="text-foreground/70 text-sm">
                        Your profile is public by username, but only connected users see your full details. Control your privacy with connection-based access.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Smart Notifications</h3>
                      <p className="text-foreground/70 text-sm">
                        Stay informed with real-time notifications for connection requests, acceptances, and updates.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Connection Management</h3>
                      <p className="text-foreground/70 text-sm">
                        Easily manage your connections. Accept requests, decline unwanted ones, and remove connections when needed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Mobile Optimized</h3>
                      <p className="text-foreground/70 text-sm">
                        Built for mobile devices. Scan QR codes with your phone camera and manage connections on the go.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Quick Setup</h3>
                      <p className="text-foreground/70 text-sm">
                        Get started in minutes. Create your profile, generate your QR code, and start connecting right away.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl font-bold text-foreground mb-6"
            >
              Ready to start connecting?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-foreground/70 mb-8"
            >
              Create your free VibeLink profile today and experience the future of digital introductions.
            </motion.p>
            <Link href="/welcome">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-base px-8 py-6 rounded-2xl"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

