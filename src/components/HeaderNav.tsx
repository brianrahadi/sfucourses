import Link from "next/link";

export const HeaderNav: React.FC = () => {
  return (
    <div className="header-nav">
      <div className="container">
        <Link href="/" className="page-link">
          <h2>sfucourses</h2>
        </Link>

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
            <Link href={`/schedule`} className="page-link">
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
