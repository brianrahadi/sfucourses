interface ButtonProps {
  label: string;
  type?: string;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  type = "primary",
  className,
}) => {
  return <button className={`btn ${type} ${className}`}>{label}</button>;
};

export default Button;
