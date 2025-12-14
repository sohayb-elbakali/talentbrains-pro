import { Buildings } from "@phosphor-icons/react";
import { useState } from "react";

interface CompanyLogoProps {
  avatarUrl?: string | null;
  companyName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-16 h-16",
  xl: "w-20 h-20",
};

const iconSizes = {
  sm: 20,
  md: 28,
  lg: 32,
  xl: 40,
};

// Simple, professional default company logo
const DefaultCompanyLogo = ({ size, className }: { size: "sm" | "md" | "lg" | "xl"; className: string }) => (
  <div
    className={`${sizeClasses[size]} ${className} bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center`}
  >
    <Buildings weight="regular" size={iconSizes[size]} className="text-primary" />
  </div>
);

export default function CompanyLogo({
  avatarUrl,
  companyName,
  size = "md",
  className = "",
}: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);

  // If no avatar URL or image failed to load, show default logo
  if (!avatarUrl || imageError) {
    return <DefaultCompanyLogo size={size} className={className} />;
  }

  // Try to load the custom logo
  return (
    <img
      src={avatarUrl}
      alt={`${companyName} logo`}
      className={`${sizeClasses[size]} ${className} rounded-2xl object-cover bg-white border border-slate-200`}
      onError={() => setImageError(true)}
    />
  );
}
