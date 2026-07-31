import { Navigation } from "@/components/navigation";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Features } from "@/components/features";
import { WhoIsItFor } from "@/components/who-is-it-for";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <WhoIsItFor />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
