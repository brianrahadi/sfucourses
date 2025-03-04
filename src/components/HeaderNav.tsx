import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GlobalSearch } from "./GlobalSearch";
import { Home, Search, Calendar, HelpCircle, Database } from "react-feather";

export const HeaderNav: React.FC = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Function to check if a path is active
  const isActivePath = (path: string): boolean => {
    if (path === "/" && router.pathname === "/") {
      return true;
    }
    return path !== "/" && router.pathname.startsWith(path);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Handle hiding/showing based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      // Check if page has been scrolled to add background
      if (currentScrollY > 20) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <div
        className={`header-nav ${!isVisible ? "header-hidden" : ""} ${
          hasScrolled ? "header-scrolled" : ""
        }`}
      >
        <div className="container">
          <div className="header-nav__primary">
            <Link href="/" className="page-link">
              <h2>sfucourses</h2>
            </Link>

            {/* Global Search */}
            <GlobalSearch />
          </div>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <Link href="/explore" className="page-link">
              explore
            </Link>
            <Link href="/schedule" className="page-link">
              schedule
            </Link>
            <Link href="/faq" className="page-link">
              faq
            </Link>
            <Link
              href="https://api.sfucourses.com"
              className="page-link"
              target="_blank"
              rel="noreferrer"
            >
              api
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <Link
          href="/"
          className={`mobile-nav-item ${isActivePath("/") ? "active" : ""}`}
        >
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link
          href="/explore"
          className={`mobile-nav-item ${
            isActivePath("/explore") ? "active" : ""
          }`}
        >
          <Search size={20} />
          <span>Explore</span>
        </Link>
        <Link
          href="/schedule"
          className={`mobile-nav-item ${
            isActivePath("/schedule") ? "active" : ""
          }`}
        >
          <Calendar size={20} />
          <span>Schedule</span>
        </Link>
        <Link
          href="/faq"
          className={`mobile-nav-item ${isActivePath("/faq") ? "active" : ""}`}
        >
          <HelpCircle size={20} />
          <span>FAQ</span>
        </Link>
        <Link
          href="https://api.sfucourses.com"
          className="mobile-nav-item"
          target="_blank"
          rel="noreferrer"
        >
          <Database size={20} />
          <span>API</span>
        </Link>
      </div>
    </>
  );
};

export default HeaderNav;
