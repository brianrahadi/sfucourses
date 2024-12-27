import { Button, Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { TERM, YEAR, getData, loadData, numberWithCommas } from "utils";
import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { Breadcrumb } from "components/Breadcrumb";
import { CourseOutline } from "types/api-types";
import { CourseCard } from "components/CourseCard";

interface ExplorePageProps {
  initialOutlines?: CourseOutline[];
}

const ExplorePage: React.FC<ExplorePageProps> = ({ initialOutlines }) => {
  const [outlines, setOutlines] = useState<CourseOutline[]>(
    initialOutlines || []
  );

  useEffect(() => {
    if (outlines.length === 0) {
      loadData("/outlines/all", setOutlines);
    }
  }, []);

  return (
    <div className="page courses-page">
      <Hero title="explore courses @ sfu" backgroundImage={HeroImage.src} />
      <main className="container">
        <section className="main-content">
          <h1>
            discover all {outlines && numberWithCommas(outlines.length)} sfu
            courses
          </h1>
        </section>
        <section className="requirements-section">
          <div className="courses-container">
            {outlines.map((outline) => (
              <CourseCard course={outline} />
              // <Link
              //     className="node"
              //     key={outline.dept + outline.number}
              //     href={`/explore/${outline.dept}/${outline.number}`}
              // >
              //     <Button
              //         label={`${outline.dept}${outline.number ? ` ${outline.number}` : ""} - ${outline.title} - ${outline.description}`}
              //         type="secondary"
              //     />
              // </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ExplorePage;
