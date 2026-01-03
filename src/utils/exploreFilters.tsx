import { SUBJECTS } from "@const";
import { FaLeaf } from "react-icons/fa";
import { LuFlower } from "react-icons/lu";
import { BsSun } from "react-icons/bs";

export const subjectOptions = SUBJECTS.map((subj) => {
  return { value: subj, label: subj };
});
export const levelOptions = ["1XX", "2XX", "3XX", "4XX", "5XX+"];
export const termOptions = [
  "Spring 2025",
  "Summer 2025",
  "Fall 2025",
  "Spring 2026",
  "Summer 2026",
];
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
          style={{ fill: "#FFD700", verticalAlign: "middle" }}
          title="Summer"
        />
      );
    default:
      return undefined;
  }
};
