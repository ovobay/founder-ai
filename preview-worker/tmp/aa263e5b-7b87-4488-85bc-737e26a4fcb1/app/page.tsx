import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeatureGrid";
import CTA from "@/components/CTA";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Hero />
        <FeatureGrid />
        <CTA />
      </div>
    </main>
  );
}