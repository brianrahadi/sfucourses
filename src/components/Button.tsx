interface ButtonProps {
  label: string | JSX.Element;
  type?: string;
  className?: string;
  onClick?: () => void;
  icon?: JSX.Element;
  disabled?: boolean;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  type = "primary",
  className,
  onClick,
  icon,
  disabled,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`btn ${type} ${className}`}
      disabled={disabled}
    >
      {icon}
      {label}
    </button>
  );
};

export default Button;
