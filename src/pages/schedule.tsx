import { Hero } from "@components";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";

const SchedulePage: React.FC = () => {
  return (
    <div className="page courses-page">
      <Hero title={`schedule courses`} backgroundImage={HeroImage.src} />
      <main className="container">
        <h1>in progress hehe</h1>
      </main>
    </div>
  );
};

export default SchedulePage;
