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
        <Card 
          className="rounded-2xl border-gray-700/50 bg-gray-800/50 hover:bg-gray-800/70 
                     transition-all duration-300 cursor-pointer group
                     hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5"
          onClick={handleExerciseLibraryClick}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 
                               flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Library className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className={cn(typography.text.primary, "text-lg font-semibold mb-1")}>
                  📚 Exercise Library
                </h3>
                <p className={cn(typography.text.secondary, "text-sm")}>
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
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
};