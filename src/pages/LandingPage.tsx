import AIMatching from "../components/AIMatching";
import Features from "../components/Features";
import Hero from "../components/Hero";
import JobListings from "../components/JobListings";
import TalentProfiles from "../components/TalentProfiles";
import NavigationCards from "../components/NavigationCards";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <NavigationCards />
      <Features />
      <AIMatching />
      <JobListings />
      <TalentProfiles />
    </>
  );
}
