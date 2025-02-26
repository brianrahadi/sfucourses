import { useQuery } from "@tanstack/react-query";
import { fetchLastUpdated } from "@utils";
import { formatShortDescriptiveDate } from "@utils/format";

interface HeroProps {
  subtitle?: string;
  title: string;
  backgroundImage: string;
}

export const Hero: React.FC<HeroProps> = ({
  subtitle,
  title,
  backgroundImage,
}) => {
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
    <header
      className="container hero"
      style={{
        backgroundImage: `linear-gradient(
    180deg,
    #141515 0%,
    rgba(20, 21, 21, 0.75) 100%
  ),
  url("${backgroundImage}")`,
      }}
    >
      <p>{subtitle}</p>
      <h1>{title}</h1>
      <p className="gray-text">
        data last updated:{" "}
        {!isLoading
          ? formatShortDescriptiveDate(new Date(lastUpdatedData))
          : ""}
      </p>
    </header>
  );
};

export default Hero;
