"use client";

import { motion } from "framer-motion";
import { 
  User, 
  QrCode, 
  Share2, 
  Download, 
  History, 
  Smartphone 
} from "lucide-react";

export function Features() {
  const features = [
    {
      icon: User,
      title: "Digital Profile",
      description: "Create a stunning digital profile with your photo, bio, social links, and contact information.",
    },
    {
      icon: QrCode,
      title: "Personalized QR",
      description: "Get a unique QR code that links directly to your profile. Customizable and always up-to-date.",
    },
    {
      icon: Share2,
      title: "Instant Sharing",
      description: "Share your profile instantly via QR code, link, or direct message. No apps required for scanners.",
    },
    {
      icon: Download,
      title: "Save Connections",
      description: "Save contacts directly to your phone with one tap. Never lose a connection again.",
    },
    {
      icon: History,
      title: "Connection History",
      description: "Track who you've connected with and when. Keep your network organized and accessible.",
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Optimized for mobile devices. Your profile looks great on any screen size.",
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Everything you need to make meaningful connections
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-card rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full border border-border/50 hover:border-primary/30">
                {/* Icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}