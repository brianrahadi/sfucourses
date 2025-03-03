import React, { FC } from "react";
import { Hero } from "@components";
import Link from "next/link";
import LandingPageHeroSrc from "../assets/images/landing-page/hero.webp";
import { getCourseAPIData } from "@utils";
import { useQuery } from "@tanstack/react-query";

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
            <Link href="/schedule" className="discover-ssss__link-item">
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
