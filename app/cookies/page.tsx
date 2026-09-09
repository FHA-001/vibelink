import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";

export default function CookiePolicyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navigation />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-6"
            >
              Cookie Policy
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-foreground/70 mb-4"
            >
              Last updated: {currentYear}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-foreground/70"
            >
              This Cookie Policy explains how VibeLink uses cookies and similar technologies.
            </motion.p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">What Are Cookies?</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">How VibeLink Uses Cookies</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  VibeLink uses cookies primarily for authentication and session management through our authentication provider, Supabase. These cookies are essential for the service to function properly.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Authentication Cookies:</strong> Used to keep you signed in to your account</li>
                  <li><strong>Session Cookies:</strong> Maintain your session state as you navigate the application</li>
                  <li><strong>Security Cookies:</strong> Help protect your account from unauthorized access</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Essential Cookies</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  Essential cookies are necessary for the website to function properly. These cookies cannot be disabled because they are required for core functionality such as:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>User authentication and session management</li>
                  <li>Security features and fraud prevention</li>
                  <li>Remembering your preferences</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Third-Party Cookies</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  VibeLink uses Supabase for authentication, which may set cookies for authentication purposes. These cookies are managed by Supabase according to their own privacy policy.
                </p>
                <p>
                  We do not use third-party cookies for advertising, analytics, or tracking purposes.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Managing Cookies</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  Most web browsers allow you to control cookies through their settings. You can:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Block all cookies</li>
                  <li>Accept only essential cookies</li>
                  <li>Delete existing cookies</li>
                  <li>Set notifications when cookies are sent</li>
                </ul>
                <p>
                  Please note that disabling essential cookies may prevent VibeLink from functioning properly, as authentication and session management require cookies.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Cookie Duration</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  Authentication and session cookies are typically set to expire after a period of inactivity or when you sign out. This helps maintain security by requiring re-authentication after extended periods.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Updates to This Policy</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify users of significant changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  If you have questions about this Cookie Policy or how we use cookies, please contact us at:
                </p>
                <p>
                  <a href="mailto:hello@vibelink.name.ng" className="text-primary hover:underline">
                    hello@vibelink.name.ng
                  </a>
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
