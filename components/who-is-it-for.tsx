"use client";

import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Briefcase, 
  Code, 
  Rocket, 
  PenTool, 
  Building2 
} from "lucide-react";

export function WhoIsItFor() {
  const audiences = [
    {
      icon: GraduationCap,
      title: "Students",
      description: "Build your professional network while studying. Make lasting connections with peers and professors.",
    },
    {
      icon: Briefcase,
      title: "Professionals",
      description: "Stand out at conferences and networking events. Share your contact info instantly and professionally.",
    },
    {
      icon: Code,
      title: "Developers",
      description: "Connect with other developers at hackathons and meetups. Share your GitHub and portfolio seamlessly.",
    },
    {
      icon: Rocket,
      title: "Founders",
      description: "Make memorable first impressions with investors and partners. Your startup deserves a premium introduction.",
    },
    {
      icon: PenTool,
      title: "Freelancers",
      description: "Share your portfolio and contact info with potential clients. Make it easy for them to reach out and hire you.",
    },
    {
      icon: Building2,
      title: "Business Owners",
      description: "Elevate your business networking. Share your professional profile and build valuable partnerships.",
    },
  ];

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Who Is It For?
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            VibeLink is perfect for anyone who wants to make meaningful connections
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-card rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full border border-border/50 hover:border-secondary/30">
                {/* Icon */}
                <div className="w-14 h-14 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <audience.icon className="w-7 h-7 text-secondary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {audience.title}
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  {audience.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}