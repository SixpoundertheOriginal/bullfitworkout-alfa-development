
import { Clock, User as UserIcon, Dumbbell, BarChart3, Zap, Bot } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useWorkoutNavigation } from "@/context/WorkoutNavigationContext";
import { useWorkoutStore } from "@/store/workoutStore";
import { NavigationItem } from "@/components/ui/enhanced/NavigationItem";
import { FEATURE_FLAGS } from "@/constants/featureFlags";

export const BottomNav = () => {
  const location = useLocation();
  const { confirmNavigation } = useWorkoutNavigation();
  const { exercises, elapsedTime } = useWorkoutStore();
  
  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path === "/overview" && location.pathname === "/overview") return true;
    if (path === "/training-session" && location.pathname === "/training-session") return true;
    if (path === "/workouts" && location.pathname === "/workouts") return true;
    if (path === "/profile" && location.pathname === "/profile") return true;
    if (path === "/all-exercises" && location.pathname === "/all-exercises") return true;
    if (path === "/ai-coach" && location.pathname === "/ai-coach") return true;
    return false;
  };
  
  const isWorkoutActive = Object.keys(exercises).length > 0 && elapsedTime > 0;
  
  // Prevent showing bottom nav on dialog or auth page
  const isDialogOpen = document.querySelector('[role="dialog"]') !== null;
  const isAuthPage = location.pathname === '/auth';
  
  if (isDialogOpen || isAuthPage) {
    return null;
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-800/50 bg-gray-900/95 backdrop-blur-sm z-10 safe-bottom">
      <div className="flex justify-around items-center py-2">
        <NavigationItem 
          icon={<Clock size={20} />} 
          label="Home" 
          isActive={isActive('/')} 
          onClick={() => confirmNavigation('/')} 
        />
        <NavigationItem 
          icon={<BarChart3 size={20} />} 
          label="Overview" 
          isActive={isActive('/overview')}
          onClick={() => confirmNavigation('/overview')} 
        />
        {FEATURE_FLAGS.KPI_ANALYTICS_ENABLED && (
          <NavigationItem 
            icon={<BarChart3 size={20} />} 
            label="Analytics" 
            isActive={isActive('/analytics')}
            onClick={() => confirmNavigation('/analytics')} 
          />
        )}
        {isWorkoutActive && (
          <NavigationItem 
            icon={<Zap size={20} />} 
            label="Training"
            isActive={isActive('/training-session')}
            onClick={() => confirmNavigation('/training-session')}
            className="relative"
          />
        )}
        <NavigationItem 
          icon={<Bot size={20} />} 
          label="AI Coach"
          isActive={isActive('/ai-coach')}
          onClick={() => confirmNavigation('/ai-coach')}
        />
        <NavigationItem 
          icon={<Dumbbell size={20} />} 
          label="Exercises"
          isActive={isActive('/all-exercises')}
          onClick={() => confirmNavigation('/all-exercises')}
        />
        <NavigationItem 
          icon={<UserIcon size={20} />} 
          label="Profile" 
          isActive={isActive('/profile')}
          onClick={() => confirmNavigation('/profile')} 
        />
      </div>
    </nav>
  );
};

// NavButton component removed - now using NavigationItem
