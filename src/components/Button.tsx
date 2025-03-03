interface ButtonProps {
  label: string | JSX.Element;
  type?: string;
  className?: string;
  onClick?: () => void;
  icon?: JSX.Element;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  type = "primary",
  className,
  onClick,
  icon,
  disabled,
}) => {
  return (
    <button
      onClick={onClick}
      className={`btn ${type} ${className}`}
      disabled={disabled}
    >
      {icon}
      {label}
    </button>
  );
};

export default Button;
