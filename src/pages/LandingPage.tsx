import Features from "../components/Features";
import Hero from "../components/Hero";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Removed LightRays for better readability */}
      <div className="relative z-10">
        <Hero />
        <Features />
      </div>
    </div>
  );
}
