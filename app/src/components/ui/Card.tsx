import React from "react";

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
      {title && (
        <h4 className="text-sm font-medium text-blue-400 mb-2">{title}</h4>
      )}
      {children}
    </div>
  );
};

export default Card;
