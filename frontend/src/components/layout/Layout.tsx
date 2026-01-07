import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Footer from "./Footer";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Show footer on landing page and when not authenticated
  const showFooter =
    !isAuthenticated ||
    location.pathname === "/" ||
    location.pathname === "/landing";

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className={isAuthenticated ? "pt-16" : "pt-16"}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
