import Link from "next/link";
import { useEffect, useState } from "react";

export const HeaderNav: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className={`header-nav ${!isVisible ? "header-hidden" : ""}`}>
      <div className="container">
        <div className="header-nav__primary">
          <Link href="/" className="page-link">
            <h2>sfucourses</h2>
          </Link>
        </div>

        <input
          type="checkbox"
          className="mobile-only menu-toggle"
          id="menu-toggle"
        />

        <label htmlFor="menu-toggle">
          <a className="menu-icon">
            <div className="line"></div>
            <div className="line"></div>
          </a>
        </label>

        <div className="content">
          <nav className="pages">
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
    </div>
  );
};

export default HeaderNav;
