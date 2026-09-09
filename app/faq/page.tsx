import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is VibeLink?",
        a: "VibeLink is a digital introduction platform that helps you break the ice and build meaningful real-world connections. Create your digital profile card, share your QR code, and let others connect with you instantly."
      },
      {
        q: "How do I create a VibeLink account?",
        a: "Click 'Get Started' on the homepage, sign up with your email, and complete your profile. You'll need to provide your username, name, job title, and a brief bio to get started."
      },
      {
        q: "Is VibeLink free to use?",
        a: "Yes! VibeLink is currently free to use. You can create your profile, generate QR codes, and build unlimited connections at no cost."
      },
      {
        q: "What information do I need to provide?",
        a: "To create your profile, you'll need a username (3-20 characters, letters, numbers, underscores), your full name, job title, and a bio (10-500 characters). You can also optionally add your company/school, interests, website, and social links."
      }
    ]
  },
  {
    category: "QR Codes & Profiles",
    questions: [
      {
        q: "How do I get my QR code?",
        a: "Once you complete your profile, go to 'My Card' to see your QR code. You can download it as an image and share it anywhere."
      },
      {
        q: "How do people scan my QR code?",
        a: "Anyone with a smartphone camera can scan your VibeLink QR code. They'll be directed to your public profile where they can learn more about you and send a connection request."
      },
      {
        q: "Can I customize my QR code?",
        a: "Currently, QR codes are automatically generated with your profile URL. Custom QR designs are coming soon in our Pro plan."
      },
      {
        q: "What happens when someone scans my QR code?",
        a: "When someone scans your QR code, they see your public profile. If they're not connected with you, they can send a connection request. Once you accept, you'll be connected and can see each other's full profiles."
      }
    ]
  },
  {
    category: "Connections",
    questions: [
      {
        q: "How do I connect with someone?",
        a: "Scan their QR code or visit their public profile URL (vibelink.name.ng/u/username). Click 'Connect' to send a connection request. They'll need to accept it for the connection to be established."
      },
      {
        q: "Can I see someone's full profile without connecting?",
        a: "No. Non-connected users only see a limited preview of your profile (name, job title, bio). Full profile details are only visible to connected users."
      },
      {
        q: "How do I remove a connection?",
        a: "Go to the Connections page, find the person you want to remove, and click the trash icon. You can always reconnect later if you change your mind."
      },
      {
        q: "What happens when I decline a connection request?",
        a: "The request is removed from your pending requests. The sender won't be notified of the decline, but they won't be able to send another request to you."
      }
    ]
  },
  {
    category: "Privacy & Security",
    questions: [
      {
        q: "Is my profile public?",
        a: "Your profile is publicly accessible via your username URL, but only connected users can see your full profile details. Non-connected users see a limited preview."
      },
      {
        q: "Can I make my profile private?",
        a: "Currently, all profiles are publicly accessible via username. Privacy controls are being considered for future updates."
      },
      {
        q: "How is my data protected?",
        a: "We use Supabase for authentication and data storage with Row Level Security (RLS) policies ensuring users can only access their own data. Your profile photo is stored securely with access controls."
      },
      {
        q: "Can I delete my account?",
        a: "Yes, you can delete your account from the Settings page. This will permanently delete你的 profile, connections, notifications, and all associated data. This action cannot be undone."
      }
    ]
  },
  {
    category: "Profile Management",
    questions: [
      {
        q: "How do I edit my profile?",
        a: "Go to Settings and click 'Edit Profile' or navigate directly to /edit-profile. You can update all your profile information including your photo, bio, interests, and social links."
      },
      {
        q: "Can I change my username?",
        a: "Yes, you can change your username from the Edit Profile page. The new username must be unique and follow the same format rules (3-20 characters, letters, numbers, underscores only)."
      },
      {
        q: "How do I upload a profile photo?",
        a: "In the Edit Profile page, click on the profile photo area to upload an image. Supported formats include JPG, PNG, and WebP. Maximum file size is 5MB."
      },
      {
        q: "Can I remove my profile photo?",
        a: "Yes, you can remove your profile photo from the Edit Profile page. Your profile will then display your initials instead."
      }
    ]
  },
  {
    category: "Account & Authentication",
    questions: [
      {
        q: "How do I sign in?",
        a: "Click 'Sign In' on the homepage and enter your email and password. If you forgot your password, click 'Forgot Password' to reset it via email."
      },
      {
        q: "How do I reset my password?",
        a: "Click 'Forgot Password' on the sign-in page, enter your email, and we'll send you a password reset link. Follow the instructions in the email to create a new password."
      },
      {
        q: "Can I change my email address?",
        a: "Currently, email address changes are not supported. If you need to change your email, please contact us for assistance."
      },
      {
        q: "How do I sign out?",
        a: "Click 'Sign Out' in the Settings page or from the header on authenticated pages. This will clear your session and redirect you to the homepage."
      }
    ]
  }
];

export default function FAQPage() {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setOpenCategory(openCategory === category ? null : category);
    setOpenQuestion(null);
  };

  const toggleQuestion = (questionId: string) => {
    setOpenQuestion(openQuestion === questionId ? null : questionId);
  };

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
              Frequently Asked Questions
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-foreground/70"
            >
              Everything you need to know about VibeLink
            </motion.p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {faqs.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                className="mb-8"
              >
                <button
                  onClick={() => toggleCategory(category.category)}
                  className="w-full bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">{category.category}</h2>
                    {openCategory === category.category ? (
                      <ChevronUp className="w-5 h-5 text-foreground/70" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-foreground/70" />
                    )}
                  </div>
                </button>

                {openCategory === category.category && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                  >
                    {category.questions.map((faq, questionIndex) => {
                      const questionId = `${category.category}-${questionIndex}`;
                      return (
                        <div
                          key={questionId}
                          className="bg-muted/30 rounded-xl border border-border overflow-hidden"
                        >
                          <button
                            onClick={() => toggleQuestion(questionId)}
                            className="w-full p-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <span className="font-medium text-foreground">{faq.q}</span>
                            {openQuestion === questionId ? (
                              <ChevronUp className="w-4 h-4 text-foreground/70 flex-shrink-0 ml-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-foreground/70 flex-shrink-0 ml-4" />
                            )}
                          </button>
                          {openQuestion === questionId && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-4 pb-4 pt-0"
                            >
                              <p className="text-foreground/70">{faq.a}</p>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-foreground mb-4"
            >
              Still have questions?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-foreground/70 mb-8"
            >
              Can't find the answer you're looking for? Please reach out to our team.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="/contact">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-base px-8 py-6 rounded-2xl"
                >
                  Contact Us
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
