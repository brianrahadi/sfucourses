import React from "react";
import { Hero, HeroSearch } from "@components";
import Link from "next/link";
import LandingPageHeroSrc from "../assets/images/landing-page/hero.webp";
import { Search, Calendar, GitBranch, Book } from "react-feather";
import { PiGraphFill } from "react-icons/pi";

const features = [
  {
    title: "Explore",
    description: "Browse courses, instructors, and reviews",
    href: "/explore",
    icon: Search,
    color: "var(--colour-sosy-green-500)",
  },
  {
    title: "Schedule",
    description: "Build and share your weekly timetable",
    href: "/schedule",
    icon: Calendar,
    color: "var(--colour-cyber-500)",
  },
  {
    title: "Graph",
    description: "Visualize prerequisites and course paths",
    href: "/graph",
    icon: PiGraphFill,
    color: "#7c8cf8",
  },
  {
    title: "Degree Planner",
    description: "Track progress toward your degree",
    href: "/progress",
    icon: Book,
    color: "#f87c8c",
  },
];

const LandingPage: React.FC = () => {
  return (
    <div className="page landing-page">
      <Hero
        title="sfucourses"
        subtitle="explore and schedule the best course plan at"
        backgroundImage={LandingPageHeroSrc.src}
      />
      <main>
        <section className="container landing-search-section">
          <HeroSearch />
        </section>
        <section className="container landing-features">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="feature-card"
            >
              <div
                className="feature-card__icon"
                style={{ color: feature.color }}
              >
                <feature.icon size={28} />
              </div>
              <h3 className="feature-card__title">{feature.title}</h3>
              <p className="feature-card__desc">{feature.description}</p>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
