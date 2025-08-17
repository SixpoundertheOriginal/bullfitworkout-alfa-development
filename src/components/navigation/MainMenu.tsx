
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Clock, BarChart3, Zap, Dumbbell, User } from "lucide-react"
import { useLocation, Link } from "react-router-dom"

export const MainMenu = () => {
  const location = useLocation();
  
  const menuItems = [
    { icon: <Clock className="w-5 h-5" />, label: "Home", path: "/" },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Overview", path: "/overview" },
    { icon: <Zap className="w-5 h-5" />, label: "Workouts", path: "/workouts" },
    { icon: <Dumbbell className="w-5 h-5" />, label: "Exercises", path: "/all-exercises" },
    { icon: <User className="w-5 h-5" />, label: "Profile", path: "/profile" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <div className="w-6 h-0.5 bg-white/90 mb-1" />
          <div className="w-6 h-0.5 bg-white/90 mb-1" />
          <div className="w-6 h-0.5 bg-white/90" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] bg-gray-900 border-gray-800 text-white flex flex-col justify-between">
        <div>
          <nav className="space-y-2 mt-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path 
                    ? "bg-gray-800 text-white" 
                    : "hover:bg-gray-800/50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
