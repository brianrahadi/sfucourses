interface ButtonProps {
  label: string;
  type?: string;
  className?: string;
  onClick?: () => void;
  icon?: JSX.Element;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  type = "primary",
  className,
  onClick,
  icon,
}) => {
  return (
    <button onClick={onClick} className={`btn ${type} ${className}`}>
      {icon}
      {label}
    </button>
  );
};

export default Button;
