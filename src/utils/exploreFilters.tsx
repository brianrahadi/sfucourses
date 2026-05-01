import { SUBJECTS } from "@const";
import { FaLeaf } from "react-icons/fa";
import { LuFlower } from "react-icons/lu";
import { BsSun } from "react-icons/bs";

export const subjectOptions = SUBJECTS.map((subj) => {
  return { value: subj, label: subj };
});
export const levelOptions = ["1XX", "2XX", "3XX", "4XX", "5XX+"];

// 5 term options, goes from previous 3 terms, current term, and next term
export const termOptions = (() => {
  const month = new Date().getMonth() + 1;
  const terms = ["Spring", "Summer", "Fall"];
  const currentTermIndex = Math.floor((month - 1) / 4) % 3;
  const currentYear = new Date().getFullYear();

  const result = [];
  for (let i = -3; i <= 1; i++) {
    let termIndex = (currentTermIndex + i) % 3;
    if (termIndex < 0) termIndex += 3;
    const yearOffset = Math.floor((currentTermIndex + i) / 3);
    result.push(`${terms[termIndex]} ${currentYear + yearOffset}`);
  }
  return result;
})();
export const deliveryOptions = ["In Person", "Online"];
export const designationOptions = ["W", "Q", "B-Sci", "B-Hum", "B-Soc"];

export const termToIcon = (term: string) => {
  switch (term) {
    case "Fall":
      return (
        <FaLeaf
          style={{ fill: "#A0522D", verticalAlign: "middle" }}
          title="Fall"
        />
      );
    case "Spring":
      return (
        <LuFlower
          style={{ fill: "#FF69B4", verticalAlign: "middle" }}
          title="Spring"
        />
      );
    case "Summer":
      return (
        <BsSun
          style={{
            fill: "#FFD700",
            stroke: "var(--colour-neutral-000)",
            strokeWidth: "0.5",
            verticalAlign: "middle",
          }}
          title="Summer"
        />
      );
    default:
      return undefined;
  }
};
