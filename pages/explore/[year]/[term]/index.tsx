import { Button, Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { TERM, YEAR, getData, loadData } from "utils";
import { Department } from "types/course";
import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { Breadcrumb } from "components/Breadcrumb";

interface YearTermPageProps {
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

export const getStaticProps: GetStaticProps<YearTermPageProps> = async ({
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

const YearTermPage: React.FC<YearTermPageProps> = ({
  initialDepartments,
  params,
}) => {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>(
    initialDepartments || []
  );
  const { year, term } = router.query;

  const yearStr = Array.isArray(year) ? year[0] : year ?? "";
  const termStr = Array.isArray(term) ? term[0] : term ?? "";

  useEffect(() => {
    if (departments.length === 0) {
      loadData(`${yearStr}/${termStr}/`, setDepartments);
    }
  }, [yearStr, termStr]);

  return (
    <div className="page courses-page">
      <Hero title="explore courses @ sfu" backgroundImage={HeroImage.src} />
      <main className="container">
        <section className="main-content">
          <Breadcrumb year={yearStr} term={termStr} />
          <h1>
            {termStr} {yearStr} courses
          </h1>
        </section>
        <section className="requirements-section">
          <div className="courses-container">
            {departments.map((dept) => (
              <Link
                className="node"
                key={dept.value}
                href={`/explore/${yearStr}/${termStr}/${dept.value}`}
              >
                <Button
                  label={`${dept.text}${dept?.name ? ` - ${dept.name}` : ""}`}
                  type="secondary"
                />
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default YearTermPage;
