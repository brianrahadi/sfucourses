import { escapeRegExp } from "lodash";

interface HighlightProps {
  text: string;
  query?: string;
  className?: string;
}

export const Highlight: React.FC<HighlightProps> = ({
  text,
  query,
  className,
}) => {
  return (
    <span className={className}>
      {text
        .split(new RegExp(`(${escapeRegExp(query)})`, "gi"))
        .map((part, i) => (
          <span
            key={i}
            className={
              part.toLowerCase().trim() === query?.toLowerCase().trim()
                ? "text-underline"
                : ""
            }
          >
            {part}
          </span>
        ))}
    </span>
  );
};

export default Highlight;
