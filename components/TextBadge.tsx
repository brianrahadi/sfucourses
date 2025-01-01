import Image from "next/image";

interface TextBadgeProps {
  content: JSX.Element | string;
  className?: string;
  icon?: JSX.Element;
}

export const TextBadge: React.FC<TextBadgeProps> = ({
  content,
  className,
  icon,
}) => {
  return (
    <div className={`text-badge ${className}`}>
      {icon}
      {content}
    </div>
  );
};
