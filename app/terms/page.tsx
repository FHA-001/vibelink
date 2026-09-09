import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";

export default function TermsOfServicePage() {
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
              Terms of Service
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
              By using VibeLink, you agree to these Terms of Service.
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
              <h2 className="text-2xl font-bold text-foreground mb-4">Acceptance of Terms</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  By accessing or using VibeLink, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Account Registration</h2>
              <div className="space-y-4 text-foreground/70">
                <p>To use VibeLink, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Be at least 13 years of age</li>
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized use</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">User-Generated Content</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  You are responsible for the content you post on VibeLink, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Profile information (name, bio, interests, etc.)</li>
                  <li>Profile photos</li>
                  <li>Social links</li>
                </ul>
                <p>
                  You agree not to post content that is:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Illegal, harmful, threatening, or abusive</li>
                  <li>Defamatory, libelous, or invasive of privacy</li>
                  <li>Harassing, hateful, or discriminatory</li>
                  <li>False, misleading, or deceptive</li>
                  <li>In violation of any applicable law</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Connections and Interactions</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  VibeLink facilitates connections between users. You agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use connections for legitimate networking purposes</li>
                  <li>Respect other users' privacy and boundaries</li>
                  <li>Not send unsolicited or inappropriate messages</li>
                  <li>Not use the platform for spam or harassment</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">QR Codes and Profile Sharing</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  Your VibeLink QR code and public profile URL are designed for sharing. By sharing your QR code or profile URL, you understand that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your profile is publicly accessible via your username</li>
                  <li>Non-connected users see limited profile information</li>
                  <li>You are responsible for where and how you share your QR code</li>
                  <li>VibeLink is not responsible for unauthorized use of shared QR codes</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Prohibited Activities</h2>
              <div className="space-y-4 text-foreground/70">
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use VibeLink for any illegal purpose</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Use automated tools to access the service</li>
                  <li>Impersonate any person or entity</li>
                  <li>Collect or harvest user information</li>
                  <li>Reverse engineer or attempt to extract source code</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Account Termination</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  We reserve the right to suspend or terminate your account if you violate these Terms of Service. You may also delete your account at any time through the Settings page.
                </p>
                <p>
                  Upon account deletion, all your data including profile, connections, and notifications will be permanently deleted. This action cannot be undone.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Service Availability</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  VibeLink is provided "as is" and "as available" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free.
                </p>
                <p>
                  We may modify, suspend, or discontinue the service at any time without notice.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Limitation of Liability</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  To the maximum extent permitted by law, VibeLink shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Changes to Terms</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  We may modify these Terms of Service at any time. Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Governing Law</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  These Terms of Service shall be governed by and construed in accordance with applicable laws.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
              <div className="space-y-4 text-foreground/70">
                <p>
                  If you have questions about these Terms of Service, please contact us at:
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
