import { Brain, Briefcase, Rocket, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface NavigationCard {
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
}

const cards: NavigationCard[] = [
  {
    title: "Find Talent",
    description: "Browse through our pool of verified professionals",
    icon: Users,
    link: "/talents",
  },
  {
    title: "Browse Jobs",
    description: "Discover exciting opportunities from top companies",
    icon: Briefcase,
    link: "/jobs",
  },
  {
    title: "AI Matching",
    description: "Let our AI find the perfect match for you",
    icon: Brain,
    link: "/ai-matching",
  },
  {
    title: "Get Started",
    description: "Create your profile and start connecting",
    icon: Rocket,
    link: "/auth",
  },
];

export default function NavigationCards() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.link}
              className="bg-white border border-gray-200 rounded-xl p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-lg hover:border-primary group"
            >
              <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <Icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-primary transition-colors">
                {card.title}
              </h3>
              <p className="text-gray-600 text-sm">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
