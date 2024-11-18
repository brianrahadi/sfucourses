import { Button, Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { loadData } from "utils";
import { Department } from "types/course";

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};

const YearTermPage: React.FC = () => {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const { year, term } = router.query;

  const yearStr = Array.isArray(year) ? year[0] : year ?? "";
  const termStr = Array.isArray(term) ? term[0] : term ?? "";

  useEffect(() => {
    loadData(`${yearStr}/${termStr}`, setDepartments);
  }, [yearStr, termStr]);

  return (
    <div className="page courses-page">
      <Hero title="courses @ sfu" backgroundImage={HeroImage.src} />
      <main className="container">
        <section className="main-content">
          <h1>
            {termStr} {yearStr} courses
          </h1>
        </section>
        <section className="requirements-section">
          <div className={`courses-container`}>
            {departments.map((dept) => (
              <a
                key={dept.value}
                href={`/explore/${yearStr}/${termStr}/${dept.value}`}
              >
                <Button
                  label={`${dept.text}${dept?.name ? ` - ${dept.name}` : ""}`}
                  type="secondary"
                />
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default YearTermPage;
