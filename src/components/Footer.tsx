import { useQuery } from "@tanstack/react-query";
import { fetchLastUpdated } from "@utils";
import Link from "next/link";
import { formatShortDescriptiveDate } from "@utils/format";

export const Footer: React.FC = () => {
  const {
    data: lastUpdatedData,
    error,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["lastUpdated"],
    queryFn: fetchLastUpdated,
  });

  return (
    <div className="footer">
      <div className="container footer-container">
        <p className="align-items">
          with (ɔ◔‿◔)ɔ ♥ by{" "}
          <Link
            className="no-underline"
            href="https://brianrahadi.com"
            target="_blank"
            rel="noreferrer"
          >
            brianrahadi
          </Link>
        </p>
        <p>
          data from&nbsp;
          <Link href="https://api.sfucourses.com" className="no-underline">
            api.sfucourses.com
          </Link>
        </p>
      </div>
    </div>
  );
};
