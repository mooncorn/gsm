import React from "react";
import Button from "./Button";
import { TbArrowLeft } from "react-icons/tb";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  backTo?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton = false,
  backTo,
  actions,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button
            onClick={handleBack}
            icon={<TbArrowLeft className="text-xl" />}
          />
        )}
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;
