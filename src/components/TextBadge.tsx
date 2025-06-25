import { getDarkColorFromHash } from "@utils/format";
import Image from "next/image";
import { useEffect, useState } from "react";

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
  const bgColor = enableBgColor
    ? getDarkColorFromHash(String(content))
    : undefined;

  return (
    <div
      className={`text-badge ${className ?? ""}`}
      style={{
        backgroundColor: bgColor,
      }}
    >
      {icon}
      {content}
    </div>
  );
};
