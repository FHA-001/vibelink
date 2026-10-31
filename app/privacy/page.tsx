"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navigation />
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl font-semibold text-foreground leading-tight mb-6"
            >
              Privacy Policy
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-muted-foreground mb-4"
            >
              Last updated: 31 October 2026
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-muted-foreground"
            >
              This Privacy Policy describes how VibeLink collects, uses, and protects your information.
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
              <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  VibeLink collects the following information to provide our services:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Account Information:</strong> Email address (used for account creation, verification, authentication, and password recovery), user ID, password credentials securely handled by our authentication provider, and authentication session data. Your email address is never displayed publicly on your profile.</li>
                  <li><strong>Profile Information:</strong> Username, full name, job title, company/school, bio, interests, website, and social media links (LinkedIn, Twitter, GitHub, Instagram)</li>
                  <li><strong>Profile Photo:</strong> Optional profile photo uploaded by you</li>
                  <li><strong>Profile Privacy Preferences:</strong> Your settings for which profile fields are visible to others</li>
                  <li><strong>Connection Information:</strong> Your connections and connection request history</li>
                  <li><strong>Notification Data:</strong> Connection requests, acceptances, declines, and related notifications</li>
                  <li><strong>Security Data:</strong> Internal rate-limit and security data used to prevent abuse</li>
                  <li><strong>Private Connection Notes:</strong> Personal notes you write about your connections. These notes are visible only to you and are not shared with the tagged connection or any other users.</li>
                  <li><strong>Personal Tags:</strong> Custom tags you create to organize your connections. These tags are visible only to you and are not shared with tagged connections or any other users.</li>
                  <li><strong>Blocking Information:</strong> Users you have blocked and users who have blocked you</li>
                  <li><strong>Report Data:</strong> Reports you submit about inappropriate profiles</li>
                  <li><strong>Waitlist Product Preferences:</strong> If you join the waitlist for a physical product, we store which product you chose together with your account, and we use it only to tell you when it launches.</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Storage and Security</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We take data security seriously:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Supabase:</strong> We use Supabase for authentication, database, and storage services</li>
                  <li><strong>Vercel:</strong> Our application is hosted and deployed on Vercel infrastructure</li>
                  <li><strong>Encryption:</strong> Passwords are encrypted using industry-standard methods</li>
                  <li><strong>Row Level Security:</strong> Database policies ensure users can only access their own data</li>
                  <li><strong>Storage:</strong> Profile photos are stored securely with access controls</li>
                  <li><strong>Access:</strong> Only authorized personnel can access user data</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-4">Public Profile Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Your profile is accessible via your username URL (vibelink.name.ng/u/username). The visibility of your profile information depends on your privacy settings:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your username is public and used to access your profile</li>
                  <li>Individual profile fields have privacy controls that you can adjust in Edit Profile</li>
                  <li>By default, your profile photo, job title, company/school, bio, and interests are public. Your full name, website, and social links default to private.</li>
                  <li>Connected users may see more profile information than non-connected users</li>
                  <li>Your email address is never displayed publicly on your profile</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Create and maintain your VibeLink account and profile</li>
                  <li>Generate and manage your QR code for profile sharing</li>
                  <li>Facilitate connections between users</li>
                  <li>Send you notifications about connection requests and activity</li>
                  <li>Apply your privacy preferences to control profile visibility</li>
                  <li>Authenticate your account and maintain security</li>
                  <li>Implement rate limiting and abuse prevention measures</li>
                  <li>Send password recovery emails</li>
                  <li>Store and display your private notes about connections for your personal reference</li>
                  <li>Store and apply your personal tags to organize connections</li>
                  <li>Enforce blocking preferences and remove connections/notifications when users block each other</li>
                  <li>Process reports to maintain platform safety and prevent abuse</li>
                  <li>Operate and improve our services</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-4">Third-Party Services</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  VibeLink uses the following third-party services:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Supabase:</strong> Authentication, database, and storage services</li>
                  <li><strong>Vercel:</strong> Hosting and deployment infrastructure</li>
                  <li><strong>Resend:</strong> Transactional authentication emails sent through Supabase Custom SMTP. Resend may process recipient email addresses and authentication email content including reset/verification links.</li>
                </ul>
                <p>
                  These services have their own privacy policies and data handling practices. We encourage you to review their policies.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Retention</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We retain your profile and account data while your account is active. If you delete your account:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your primary profile, connections, connection requests, and notifications are deleted</li>
                  <li>Your profile photo is deleted from storage</li>
                  <li>Your authentication account is deleted</li>
                  <li>Rate-limit and security data associated with your account is deleted</li>
                  <li>Blocked user relationships are deleted</li>
                  <li>Reports submitted by you or about you are deleted</li>
                  <li>Private connection notes and personal tags are deleted</li>
                  <li>This action is intended to be permanent</li>
                </ul>
                <p>
                  Some technical and security records, as well as infrastructure logs, may be retained for limited operational or security periods. Third-party service providers may retain operational records under their own policies. Our retention practices may be updated as VibeLink matures.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-4">Your Rights and Controls</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>View and edit your profile information at any time</li>
                  <li>Adjust your privacy settings to control profile visibility</li>
                  <li>Delete your account and associated data</li>
                  <li>Contact us regarding your personal data or to exercise applicable rights</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-4">Children's Privacy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  VibeLink is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to This Policy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may update this Privacy Policy from time to time. We will notify users of significant changes by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you have questions about this Privacy Policy or how we handle your data, please contact us at:
                </p>
                <p>
                  <a href="mailto:hello@vibelink.name.ng" className="text-gold hover:underline">
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

