import React from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = "",
}) => {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">{title}</label>
      {description && (
        <p className="text-sm text-gray-400 mb-2">{description}</p>
      )}
      {children}
    </div>
  );
};

export default FormSection;
