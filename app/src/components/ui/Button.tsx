import React from "react";
import { LuRefreshCw } from "react-icons/lu";

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit" | "reset";
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = "",
  icon,
  disabled = false,
  title,
  type = "button",
  isLoading = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      title={title}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? <LuRefreshCw className="animate-spin" /> : icon}
      {children}
    </button>
  );
};

export default Button;
export type { ButtonProps };
