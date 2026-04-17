import { IconBaseProps } from "react-icons";
import { FaStar, FaBrain, FaComment, FaCheckCircle } from "react-icons/fa";

export const StarIcon = (props: IconBaseProps) => (
  <FaStar {...props} style={{ fill: "#f59e0b", ...props.style }} />
);

export const BrainIcon = (props: IconBaseProps) => (
  <FaBrain {...props} style={{ fill: "#ec4899", ...props.style }} />
);

export const CommentIcon = (props: IconBaseProps) => (
  <FaComment {...props} style={{ fill: "#0ea5e9", ...props.style }} />
);

export const CheckIcon = (props: IconBaseProps) => (
  <FaCheckCircle {...props} style={{ fill: "#10b981", ...props.style }} />
);
