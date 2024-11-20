import React, { FC } from "react";
import { Dropdown, Hero } from "@components";
import faqs from "@jsons/faqs.json";
import HeroImage from "@images/resources-page/hero-laptop.jpeg";

interface Link {
  text: string;
  href: string;
}

interface FAQ {
  title: string;
  content: string;
}

const FaqPage: FC = () => {
  return (
    <div className="page resources-page">
      <Hero
        title="frequently asked questions"
        backgroundImage={HeroImage.src}
      />
      <main className="container">
        <header>
          <h2>faqs</h2>
        </header>

        <div>
          {faqs.map(({ title, content }: FAQ, id: number) => (
            <Dropdown
              key={id}
              id={id.toString()}
              title={title}
              content={content}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default FaqPage;
