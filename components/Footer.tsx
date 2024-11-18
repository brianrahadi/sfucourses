import Image from "next/image";
import Link from "next/link";
import { Logo, SocialIcon } from "@components";
import FacebookIcon from "@icons/facebook.svg";
import InstagramIcon from "@icons/instagram.svg";
import LinkedInIcon from "@icons/linkedin.svg";
import DiscordIcon from "@icons/discord.svg";
import GithubIcon from "@icons/github.svg";
import OfficeBuildingIcon from "@icons/office-building.svg";
import ContactUsIcon from "@icons/contact-us.svg";

export const Footer: React.FC = () => {
  return (
    <div className="footer">
      <div className="container">
        <p>
          with (ɔ◔‿◔)ɔ ♥ by{" "}
          <Link 
            href="https://brianrahadi.com"
            target="_blank" 
            rel="noreferrer">
              brianrahadi
          </Link> - {" "}
          <Link 
            href="https://github.com/brianrahadi"
            target="_blank"
            rel="noreferrer">
              github
          </Link> - {" "}
          <Link
            href="https://www.linkedin.com/in/brianrahadi/"
            target="_blank"
            rel="noreferrer">
              linkedin
            </Link> - hire me pls
        </p>

        {/* <div className="get-in-touch icon-container">
          <div className="gray-backdrop left-icon">
            <Image
              src={ContactUsIcon.src}
              height={48}
              width={48}
              alt="Contact Us Icon"
            />
          </div>
          <div className="address icon-right-content">
            <h4>hire me pls</h4>
            <address>
              <a href="mailto:brian.rahadi@gmail.com">brian.rahadi@gmail.com</a>
            </address>
          </div>
        </div>

        <div className="footer-socials icon-contianer">
          <SocialIcon
            href="https://www.linkedin.com/in/brianrahadi/"
            src={LinkedInIcon.src}
            alt="LinkedIn icon"
          />
          <SocialIcon
            href="https://github.com/brianrahadi"
            src={GithubIcon.src}
            alt="Discord icon"
          />
        </div> */}
      </div>
    </div>
  );
};
