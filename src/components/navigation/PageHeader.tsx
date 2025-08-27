
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { surfaceColors, effects, componentPatterns, typography } from "@/utils/tokenUtils";
import { designTokens } from "@/designTokens";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  children?: React.ReactNode;
  /** Optional brand gradient for the title text */
  brandGradient?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  children,
  brandGradient = false
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
    <header
      className={`fixed left-0 right-0 h-[var(--header-h)] flex items-center px-[${designTokens.spacing.lg}] ${surfaceColors.primary()} ${effects.blur.card()} ${effects.elevation.card()} border-b border-white/15 z-10`}
      style={{ top: "env(safe-area-inset-top)" }}
    >
      <div className="flex-1 flex items-center min-w-0">
        {showBackButton && (
          <button
            onClick={handleBack}
            className={`${componentPatterns.button.secondary()} rounded-full p-[${designTokens.spacing.sm}] aspect-square -ml-[${designTokens.spacing.sm}] mr-[${designTokens.spacing.sm}] transition-all ${designTokens.animations.hover.duration} ${designTokens.animations.hover.easing} hover:${designTokens.animations.hover.scale} hover:${effects.glow.purple()}`}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        <h1
          className={`${typography.pageHeading()} truncate ${brandGradient ? typography.brandGradient() : ""}`}
        >
          {title}
        </h1>
      </div>
      {children && (
        <div className={`flex items-center ml-[${designTokens.spacing.sm}]`}>
          {children}
        </div>
      )}
    </header>
  );
};
