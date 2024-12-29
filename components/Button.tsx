interface ButtonProps {
  label: string;
  type?: string;
  className?: string;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  type = "primary",
  className,
  onClick,
}) => {
  return (
    <button onClick={onClick} className={`btn ${type} ${className}`}>
      {label}
    </button>
  );
};

export default Button;
