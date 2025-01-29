import React from "react";

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...props}
          className={`w-4 h-4 bg-gray-800 border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:ring-offset-0 focus:ring-offset-gray-900 focus:outline-none checked:bg-blue-500 checked:border-transparent transition-colors duration-200 ${className}`}
        />
        {label && <span className="text-sm text-gray-300">{label}</span>}
      </label>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Checkbox;
