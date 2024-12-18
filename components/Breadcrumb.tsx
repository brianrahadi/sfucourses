import Link from "next/link";
import { BreadcrumbLink } from "types/course";

export const Breadcrumb: React.FC<BreadcrumbLink> = ({
  year,
  term,
  dept,
  number,
}) => {
  return (
    <div
      className="breadcrumb"
      style={{ display: "flex", gap: "8px", alignItems: "center" }}
    >
      {dept && (
        <>
          <Link
            href={`/explore/${year}/${term}`}
            style={{ textDecoration: "none" }}
          >
            {term} {year}
          </Link>
          <span>&gt;</span> {/* Separator */}
        </>
      )}
      {number ? (
        <>
          <Link
            href={`/explore/${year}/${term}/${dept}`}
            style={{ textDecoration: "none" }}
          >
            {dept}
          </Link>
          <span>&gt;</span> {/* Separator */}
        </>
      ) : (
        <span className="last-child">{dept}</span>
      )}
      {number && <span className="last-child">{number}</span>}
    </div>
  );
};
