
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  showBackButton = false, 
  onBack,
  children
}) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center px-4 bg-gray-900/95 backdrop-blur-sm z-10 border-b border-gray-800/50">
      <div className="flex-1 flex items-center min-w-0">
        {showBackButton && (
          <button onClick={handleBack} className="mr-2 p-2 -ml-2">
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-xl font-bold truncate">{title}</h1>
      </div>
      {children && (
        <div className="flex items-center ml-2">
          {children}
        </div>
      )}
    </header>
  );
};
