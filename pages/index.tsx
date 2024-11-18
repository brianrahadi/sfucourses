import React, { FC } from "react";
import { Hero } from "@components";
import LandingPageHeroImg from "@images/landing-page-hero.jpg"
import Link from "next/link";
import { TERM, YEAR } from "utils";

interface LandingPageProps {}

const LandingPage: FC<LandingPageProps> = () => {
  return (
    <div className="page landing-page">
      <Hero
        title="sfucourses.com"
        subtitle="welcome to"
        backgroundImage={LandingPageHeroImg.src}
      />
      <main>
        <article className="container discover-ssss">
          <header>
            <h2>discover courses at sfu</h2>
          </header>
          <a
            className="discover-ssss__main-link-item"
            href={`/explore/${YEAR}/${TERM}`}
            rel="noreferrer"
            target="_blank"
          >
            <h3>explore</h3>
            <p>master the course planning game</p>
          </a>

          <section className="discover-ssss__link-items">
            <Link href={`/schedule/${YEAR}/${TERM}`} className="discover-ssss__link-item">
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
