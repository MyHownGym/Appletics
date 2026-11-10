import { useScrollReveal } from "@/hooks/useScrollReveal";
import Hero from "@/components/features/Hero";
import KeyMetrics from "@/components/features/KeyMetrics";
import Features from "@/components/features/Features";
import Advantages from "@/components/features/Advantages";
import Testimonials from "@/components/features/Testimonials";
import Pricing from "@/components/features/Pricing";
import FoundersSection from "@/components/features/FoundersSection";
import FAQ from "@/components/features/FAQ";
import DownloadCTA from "@/components/features/DownloadCTA";

export default function Home() {
  const pageRef = useScrollReveal();

  return (
    <main ref={pageRef} className="scroll-reveal-page">
      <Hero />
      <KeyMetrics />
      <Features />
      <Advantages />
      <Testimonials />
      <Pricing />
      <FoundersSection />
      <FAQ />
      <DownloadCTA />
    </main>
  );
}
