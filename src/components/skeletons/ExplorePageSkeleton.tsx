import React from "react";
import { BoneShell, BoneFile } from "../bones/BoneShell";
import { ExploreCardsSkeleton } from "./ExploreSkeletons";
import header from "src/bones/explore-header.bones.json";
import search from "src/bones/explore-search.bones.json";
import filter from "src/bones/explore-filter.bones.json";

/** /explore while its data loads (shown during in-app navigation). */
export const ExplorePageSkeleton: React.FC<{
  mode: "courses" | "instructors";
  hero: React.ReactNode;
}> = ({ mode, hero }) => (
  <div className="page courses-page">
    {hero}
    <main id="explore-container" className="container">
      <section className="courses-section">
        <BoneShell
          name="explore-header"
          bones={header as BoneFile}
          className="courses-section__explore-header"
        />
        <BoneShell
          name="explore-search"
          bones={search as BoneFile}
          className="search-bar"
        />
        <div className="courses-container">
          <ExploreCardsSkeleton mode={mode} count={6} />
        </div>
      </section>
      <BoneShell
        name="explore-filter"
        bones={filter as BoneFile}
        as="section"
        className="filter-section"
        contentWidth
      />
    </main>
  </div>
);
