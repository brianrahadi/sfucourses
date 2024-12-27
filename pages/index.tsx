import React, { FC } from "react";
import { Hero } from "@components";
import LandingPageHeroImg from "@images/landing-page-hero.jpg";
import Link from "next/link";
import { TERM, YEAR } from "utils";
import LandingPageHeroSrc from "../public/images/landing-page/hero.jpg";

interface LandingPageProps {}

const LandingPage: FC<LandingPageProps> = () => {
  return (
    <div className="page landing-page">
      <Hero
        title="sfucourses"
        subtitle="explore and schedule the best course plan at"
        backgroundImage={LandingPageHeroSrc.src}
      />
      <main>
        <article className="container discover-ssss">
          <header>
            <h2>discover courses at simon fraser university</h2>
          </header>
          <a className="discover-ssss__main-link-item" href={`/explore`}>
            <h3>explore</h3>
            <p>master the course planning game</p>
          </a>

          <section className="discover-ssss__link-items">
            <Link
              href={`/explore-term/${YEAR}/${TERM}`}
              className="discover-ssss__link-item"
            >
              <h3>schedule</h3>
              <p>easily create and share your schedule</p>
            </Link>
          </section>
        </article>
      </main>
    </div>
  );
};

export default LandingPage;
