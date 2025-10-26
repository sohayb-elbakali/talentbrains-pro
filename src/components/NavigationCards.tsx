import { Link } from "react-router-dom";

interface NavigationCard {
  title: string;
  description: string;
  icon: string;
  link: string;
  color: string;
}

const cards: NavigationCard[] = [
  {
    title: "Find Talent",
    description: "Browse through our pool of verified professionals",
    icon: "👥",
    link: "/talents",
    color: "bg-blue-50 hover:bg-blue-100",
  },
  {
    title: "Browse Jobs",
    description: "Discover exciting opportunities from top companies",
    icon: "💼",
    link: "/jobs",
    color: "bg-green-50 hover:bg-green-100",
  },
  {
    title: "AI Matching",
    description: "Let our AI find the perfect match for you",
    icon: "🤖",
    link: "/ai-matching",
    color: "bg-purple-50 hover:bg-purple-100",
  },
  {
    title: "Get Started",
    description: "Create your profile and start connecting",
    icon: "🚀",
    link: "/auth",
    color: "bg-orange-50 hover:bg-orange-100",
  },
];

export default function NavigationCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
      {cards.map((card) => (
        <Link
          key={card.title}
          to={card.link}
          className={`${card.color} rounded-lg p-6 transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md`}
        >
          <div className="text-4xl mb-4">{card.icon}</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800">
            {card.title}
          </h3>
          <p className="text-gray-600 text-sm">{card.description}</p>
        </Link>
      ))}
    </div>
  );
}
