import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "@utils";
import { formatShortDescriptiveDate } from "@utils/format";

interface HeroProps {
  subtitle?: string;
  title: string;
  backgroundImage: string;
  children?: React.ReactNode;
}

export const Hero: React.FC<HeroProps> = ({
  subtitle,
  title,
  backgroundImage,
  children,
}) => {
  const { data: health, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });

  const formatUpdated = (value?: string) =>
    isLoading
      ? ""
      : value
      ? formatShortDescriptiveDate(new Date(value))
      : "N/A";

  return (
    <header
      className="container hero"
      style={{
        backgroundImage: `linear-gradient(
    180deg,
    var(--colour-neutral-1200) 0%,
    rgba(var(--colour-neutral-1200-rgb), 0.75) 100%
  ),
  url("${backgroundImage}")`,
      }}
    >
      <p>{subtitle}</p>
      <h1>{title}</h1>
      <p className="gray-text">
        data last updated: {formatUpdated(health?.lastDataUpdate)}
      </p>
      <p className="gray-text">
        review data last updated: {formatUpdated(health?.lastReviewUpdate)}
      </p>
      {children}
    </header>
  );
};

export default Hero;
