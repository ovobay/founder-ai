import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import CollectionGrid from "@/components/CollectionGrid";
import ProductGrid from "@/components/ProductGrid";
import ProductDetailPreview from "@/components/ProductDetailPreview";
import CartPreview from "@/components/CartPreview";
import StoreBenefits from "@/components/StoreBenefits";
import Reviews from "@/components/Reviews";
import LaunchChecklist from "@/components/LaunchChecklist";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Hero />
        <TrustBar />
        <CollectionGrid />
        <ProductGrid />
        <ProductDetailPreview />
        <CartPreview />
        <StoreBenefits />
        <Reviews />
        <LaunchChecklist />
      </div>
      <Footer />
    </main>
  );
}