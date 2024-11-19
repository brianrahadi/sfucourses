import { Button, Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { TERM, YEAR, getData, loadData } from "utils";
import { Department } from "types/course";
import { GetStaticPaths, GetStaticProps } from "next";

interface SchedulePageProps {
  initialDepartments?: Department[];
  params?: {
    year: string;
    term: string;
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [
      {
        params: {
          year: YEAR,
          term: TERM,
        },
      },
    ],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<SchedulePageProps> = async ({
  params,
}) => {
  if (!params?.year || !params?.term) {
    return {
      notFound: true,
    };
  }

  const { year, term } = params;
  const yearStr = Array.isArray(year) ? year[0] : year;
  const termStr = Array.isArray(term) ? term[0] : term;

  try {
    const departments: Department[] = await getData(`${yearStr}/${termStr}`);

    return {
      props: {
        initialDepartments: departments,
        params: { yearStr, termStr } as any,
      },
      // Revalidate every day
      revalidate: 86400, // 24 hours
    };
  } catch (error) {
    console.error("Error loading term data:", error);
    return {
      notFound: true,
    };
  }
};

const SchedulePage: React.FC<SchedulePageProps> = ({
  initialDepartments,
  params,
}) => {
  const router = useRouter();
  const { year, term } = router.query;

  const yearStr = Array.isArray(year) ? year[0] : year ?? "";
  const termStr = Array.isArray(term) ? term[0] : term ?? "";

  return (
    <div className="page courses-page">
      <Hero title="course schedules @ sfu" backgroundImage={HeroImage.src} />
      <main className="container">
        <section className="main-content">
          <h1>
            {termStr} {yearStr} course schedules
          </h1>
        </section>
      </main>
    </div>
  );
};

export default SchedulePage;
