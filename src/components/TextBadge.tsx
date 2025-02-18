import { getDarkColorFromHash } from "@utils";
import Image from "next/image";

interface TextBadgeProps {
  content: JSX.Element | string;
  className?: string;
  icon?: JSX.Element;
  enableBgColor?: boolean;
}

export const TextBadge: React.FC<TextBadgeProps> = ({
  content,
  className,
  icon,
  enableBgColor,
}) => {
  return (
    <div
      className={`text-badge ${className}`}
      style={{
        backgroundColor: enableBgColor
          ? getDarkColorFromHash(String(content))
          : "",
      }}
    >
      {icon}
      {content}
    </div>
  );
};
