import Features from "../../components/landing/Features";
import Hero from "../../components/landing/Hero";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <div className="relative z-10">
        <Hero />
        <Features />
      </div>
    </div>
  );
}
