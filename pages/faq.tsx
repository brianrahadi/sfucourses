import React, { FC } from "react";
import { Dropdown } from "@components";
import links from "@jsons/links.json";
import faqs from "@jsons/faqs.json";

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
      <main>
        <header className="container hero">
          <p>faq</p>
          <h1>frequently asked questions</h1>
        </header>

        <article className="container">
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
        </article>
      </main>
    </div>
  );
};

export default FaqPage;
