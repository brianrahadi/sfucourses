import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Instructor, InstructorOffering } from "@types";
import { getCourseAPIData } from "@utils";
import { Hero, RedditPosts, Helmet } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";
import { RotatingLines } from "react-loader-spinner";

const InstructorPage = () => {
  const router = useRouter();
  const { name } = router.query;
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name || typeof name !== "string") return;
    setLoading(true);
    setError(null);
    getCourseAPIData(`/instructors/names/${name}`, false)
      .then((data) => {
        setInstructor(data[0]);
        setLoading(false);
      })
      .catch((err) => {
        setError("Could not load instructor details");
        setLoading(false);
      });
  }, [name]);

  return (
    <div className="page courses-page">
      <Helmet
        pageTitle={`${
          instructor ? `${instructor.name} @ sfucourses` : "instructor details"
        }`}
      />
      <Hero
        title={
          instructor ? `${instructor.name} @ sfucourses` : "instructor details"
        }
        backgroundImage={HeroImage.src}
      />
      <main className="container course-container">
        {loading ? (
          <div className="center loading-spinner-container">
            <RotatingLines visible={true} strokeColor="#24a98b" />
          </div>
        ) : error ? (
          <div className="center">
            <h2>{error}</h2>
          </div>
        ) : instructor ? (
          <div className="instructor-details-container">
            <h2>{instructor.name} - Courses Taught</h2>
            <div className="instructor-offerings-list">
              {instructor.offerings && instructor.offerings.length > 0 ? (
                Object.entries(
                  instructor.offerings.reduce((acc, offering) => {
                    if (!acc[offering.term]) acc[offering.term] = [];
                    acc[offering.term].push(offering);
                    return acc;
                  }, {} as Record<string, InstructorOffering[]>)
                ).map(([term, offerings]) => (
                  <div key={term} className="instructor-offering-term-group">
                    <div className="offering-term">
                      <b>{term}</b>
                    </div>
                    <div className="offering-courses">
                      {offerings.map((offering) => (
                        <div
                          key={offering.dept + offering.number + offering.term}
                        >
                          <a
                            href={`/explore/${offering.dept.toLowerCase()}-${
                              offering.number
                            }`}
                            className="offering-course-link"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {offering.dept} {offering.number}
                          </a>
                          {` - ${offering.title}`}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p>No course offerings found.</p>
              )}
            </div>
          </div>
        ) : null}
        {instructor && <RedditPosts query={`${instructor.name}`} />}
      </main>
    </div>
  );
};

export default InstructorPage;
