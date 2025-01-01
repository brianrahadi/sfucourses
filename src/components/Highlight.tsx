import { escapeRegExp } from "lodash";

interface HighlightProps {
  text: string;
  query?: string;
  className?: string;
  initialText?: string;
}

export const Highlight: React.FC<HighlightProps> = ({
  text,
  query,
  className,
  initialText,
}) => {
  return (
    <span className={className}>
      {initialText ? initialText : ""}
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