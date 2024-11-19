import { Button, Logo, SocialIcon } from "@components";
import FacebookIcon from "@icons/facebook.svg";
import InstagramIcon from "@icons/instagram.svg";
import LinkedInIcon from "@icons/linkedin.svg";
import DiscordIcon from "@icons/discord.svg";
import GithubIcon from "@icons/github.svg";
import Link from "next/link";
import { YEAR, TERM } from "utils";

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
            <Link href={`/explore/${YEAR}/${TERM}`} className="page-link">
              explore
            </Link>
            <Link href={`/schedule/${YEAR}/${TERM}`} className="page-link">
              schedule
            </Link>
            <Link href="/faq" className="page-link">
              faq
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default HeaderNav;
