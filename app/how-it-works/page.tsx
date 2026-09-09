import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";
import { User, QrCode, Smartphone, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const steps = [
  {
    number: "1",
    icon: User,
    title: "Create Your Profile",
    description: "Sign up and build your digital profile card. Add your name, job title, bio, and optional social links.",
  },
  {
    number: "2",
    icon: QrCode,
    title: "Get Your QR Code",
    description: "Your unique QR code is generated automatically. Download it or access it anytime from your card.",
  },
  {
    number: "3",
    icon: Smartphone,
    title: "Share Your Code",
    description: "Print your QR code, add it to business cards, or share it digitally. Anyone can scan it.",
  },
  {
    number: "4",
    icon: Users,
    title: "Connect Instantly",
    description: "When someone scans your code, they see your profile and can send a connection request.",
  },
];

export default function HowItWorksPage() {
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
              How VibeLink works
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-foreground/70"
            >
              Four simple steps to meaningful connections
            </motion.p>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-card rounded-2xl p-8 border border-bordered h-full">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                          <step.icon className="w-8 h-8 text-primary" />
                        </div>
                        <span className="text-4xl font-bold text-primary/20">{step.number}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                        <p className="text-foreground/70">{step.description}</p>
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-8 h-8 text-primary/30" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Explanation */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-foreground mb-12 text-center"
            >
              The VibeLink experience
            </motion.h2>

            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-card rounded-2xl p-8 border border-border"
              >
                <h3 className="text-xl font-semibold text-foreground mb-4">Your Digital Profile Card</h3>
                <p className="text-foreground/70 mb-4">
                  Your VibeLink profile is more than just a bio—it's your digital introduction card. Include your name, job title, company, bio, interests, and social links. Add a profile photo to make it personal.
                </p>
                <p className="text-foreground/70">
                  Your profile is publicly accessible via your unique username URL (vibelink.name.ng/u/username), making it easy to share anywhere.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-card rounded-2xl p-8 border border-border"
              >
                <h3 className="text-xl font-semibold text-foreground mb-4">QR Code Magic</h3>
                <p className="text-foreground/70 mb-4">
                  Every VibeLink profile comes with a unique QR code. When someone scans it with their phone camera, they're instantly directed to your public profile.
                </p>
                <p className="text-foreground/70">
                  Download your QR code as an image, print it on business cards, add it to conference badges, or share it digitally. It's the fastest way to connect.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-card rounded-2xl p-8 border border-border"
              >
                <h3 className="text-xl font-semibold text-foreground mb-4">Privacy-First Connections</h3>
                <p className="text-foreground/70 mb-4">
                  Not everyone needs to see everything. Non-connected users only see a preview of your profile (name, job title, bio). Full details are visible only to people you've connected with.
                </p>
                <p className="text-foreground/70">
                  You control who sees what. Accept connection requests from people you want to connect with, and decline the rest.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-card rounded-2xl p-8 border border-border"
              >
                <h3 className="text-xl font-semibold text-foreground mb-4">Build Your Network</h3>
                <p className="text-foreground/70 mb-4">
                  Manage your connections from the Connections page. See who's sent you requests, accept or decline them, and view your growing network.
                </p>
                <p className="text-foreground/70">
                  Get notified when someone sends you a request or accepts yours. Stay connected and never miss an opportunity.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-foreground mb-12 text-center"
            >
              Perfect for any situation
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border text-center"
              >
                <h3 className="font-semibold text-foreground mb-2">Conferences & Events</h3>
                <p className="text-foreground/70 text-sm">
                  Add your QR code to your badge and let people connect without exchanging business cards.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-card rounded-2xl p-6 border border-border text-center"
              >
                <h3 className="font-semibold text-foreground mb-2">Networking Events</h3>
                <p className="text-foreground/70 text-sm">
                  Make meaningful connections at meetups and networking sessions with a simple scan.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-card rounded-2xl p-6 border border-border text-center"
              >
                <h3 className="font-semibold text-foreground mb-2">Social Gatherings</h3>
                <p className="text-foreground/70 text-sm">
                  Break the ice at parties and social events by sharing your VibeLink profile.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
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
              Join VibeLink today and transform how you make connections.
            </motion.p>
            <Link href="/welcome">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-base px-8 py-6 rounded-2xl"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
