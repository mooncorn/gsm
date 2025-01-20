interface ButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  text?: string;
  className?: string;
  disabled?: boolean;
}

const Button = ({ onClick, icon, text, className, disabled }: ButtonProps) => {
  return (
    <button
      className={`flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${className} ${
        disabled &&
        "bg-neutral-700 opacity-50 cursor-not-allowed hover:bg-gray-700"
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span>{icon}</span>}
      {text && <span>{text}</span>}
    </button>
  );
};

export default Button;
