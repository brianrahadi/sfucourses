import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { GlobalSearch } from "./GlobalSearch";
import { Home, Search, Calendar, HelpCircle, Database } from "react-feather";

export const HeaderNav: React.FC = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check if a path is active
  const isActivePath = (path: string): boolean => {
    if (path === "/" && router.pathname === "/") {
      return true;
    }
    return path !== "/" && router.pathname.startsWith(path);
  };

  const resetInactivityTimer = () => {
    // Clear any existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Set a new timer to hide header after 3 seconds
    inactivityTimerRef.current = setTimeout(() => {
      if (lastScrollY > 100) {
        // Only hide if scrolled down
        setIsVisible(false);
      }
    }, 2000);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Reset inactivity timer when user scrolls
      resetInactivityTimer();

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      if (currentScrollY > 20) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }

      setLastScrollY(currentScrollY);
    };

    // Track user movement to reset inactivity timer
    const handleMouseMove = () => {
      resetInactivityTimer();
    };

    // Start inactivity timer on component mount
    resetInactivityTimer();

    // Set up event listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
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
            <Link href="/explore" className="page-link" prefetch={false}>
              explore
            </Link>
            <Link href="/schedule" className="page-link" prefetch={false}>
              schedule
            </Link>
            <Link href="/faq" className="page-link" prefetch={false}>
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
