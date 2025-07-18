import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Library } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { typography } from "@/lib/typography";

export const ExploreSection = () => {
  const navigate = useNavigate();

  const handleExerciseLibraryClick = () => {
    navigate("/all-exercises");
  };

  return (
    <section className="space-y-4">
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(typography.text.secondary, "text-lg text-center")}
      >
        Explore
      </motion.h2>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div
          className="rounded-xl cursor-pointer group transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.1) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            filter: 'drop-shadow(0 8px 16px rgba(139, 92, 246, 0.1)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
          }}
          onClick={handleExerciseLibraryClick}
        >
          {/* Subtle inner highlight */}
          <div 
            className="absolute inset-0 rounded-xl opacity-50"
            style={{
              background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
              mixBlendMode: 'overlay'
            }}
          />
          
          {/* Content */}
          <div className="p-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #F97316 100%)'
                  }}
                >
                  <Library className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className={cn(typography.text.primary, "text-lg font-semibold mb-1")}>
                  📚 Exercise Library
                </h3>
                <p className={cn(typography.text.secondary, "text-sm opacity-80")}>
                  Browse 500+ exercises with proper form and technique
                </p>
              </div>
              
              <div className="text-gray-400 group-hover:text-white transition-colors duration-300">
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};