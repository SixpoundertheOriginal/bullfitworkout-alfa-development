
import React, { useState, useEffect } from "react";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Calendar, 
  BarChart3, 
  Clock, 
  Dumbbell, 
  ArrowDownUp, 
  CheckSquare,
  Trash2,
  X,
  Plus,
  Check
} from "lucide-react";
import { WorkoutCard } from "@/components/WorkoutCard";
import { WorkoutLogSection } from "@/components/workouts/WorkoutLogSection";
import { WorkoutCalendarTab } from "@/components/workouts/WorkoutCalendarTab";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trainingTypes } from "@/constants/trainingTypes";
import { useNavigate } from "react-router-dom";

export const WorkoutManagementPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showWorkouts, setShowWorkouts] = useState(true);
  const [activeSortOption, setActiveSortOption] = useState<string>("date");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<string>("list");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);
  
  const handleToggleWorkouts = () => {
    setShowWorkouts(prev => !prev);
  };

  const handleSortChange = (option: string) => {
    setActiveSortOption(option);
  };

  const handleFilterToggle = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedWorkouts([]);
  };

  const handleSelectAllWorkouts = () => {
    // This will be implemented when connected to actual data
    // For now it's just a placeholder
    // setSelectedWorkouts(workouts.map(w => w.id));
  };

  const handleBulkDelete = () => {
    // This will be implemented in a subsequent phase
    console.log('Bulk delete', selectedWorkouts);
  };

  const handleCreateWorkout = () => {
    navigate('/training-session');
  };
  
  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Workout Management</h1>
          <Button 
            onClick={handleCreateWorkout}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Workout
          </Button>
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search workouts..."
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className={`shrink-0 ${selectedFilters.length > 0 ? 'bg-purple-900/50 border-purple-500' : ''}`}
              >
                <Filter className="h-4 w-4" />
                {selectedFilters.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {selectedFilters.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800">
              <div className="px-2 py-1.5 text-sm font-medium text-gray-300">
                Filter By Training Type
              </div>
              {trainingTypes.map(type => (
                <DropdownMenuItem 
                  key={type.id}
                  onClick={() => handleFilterToggle(type.id)}
                  className="flex items-center cursor-pointer"
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: type.color }}
                  ></div>
                  <span>{type.name}</span>
                  {selectedFilters.includes(type.id) && (
                    <Check className="ml-auto h-4 w-4 text-purple-500" />
                  )}
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator className="bg-gray-800" />
              
              <div className="px-2 py-1.5 text-sm font-medium text-gray-300">
                Sort By
              </div>
              
              <DropdownMenuItem 
                onClick={() => handleSortChange('date')}
                className="cursor-pointer"
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Date</span>
                {activeSortOption === 'date' && (
                  <Check className="ml-auto h-4 w-4 text-purple-500" />
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleSortChange('duration')}
                className="cursor-pointer"
              >
                <Clock className="mr-2 h-4 w-4" />
                <span>Duration</span>
                {activeSortOption === 'duration' && (
                  <Check className="ml-auto h-4 w-4 text-purple-500" />
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleSortChange('exercises')}
                className="cursor-pointer"
              >
                <Dumbbell className="mr-2 h-4 w-4" />
                <span>Number of Exercises</span>
                {activeSortOption === 'exercises' && (
                  <Check className="ml-auto h-4 w-4 text-purple-500" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="shrink-0"
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-gray-900 border-gray-800">
              <DropdownMenuItem 
                onClick={() => setActiveView('list')}
                className="cursor-pointer"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                <span>List View</span>
                {activeView === 'list' && (
                  <Check className="ml-auto h-4 w-4 text-purple-500" />
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setActiveView('calendar')}
                className="cursor-pointer"
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span>Calendar View</span>
                {activeView === 'calendar' && (
                  <Check className="ml-auto h-4 w-4 text-purple-500" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {selectedFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedFilters.map(filter => {
              const trainingType = trainingTypes.find(t => t.id === filter);
              if (!trainingType) return null;
              
              return (
                <Badge 
                  key={filter} 
                  variant="outline"
                  className="pl-2 pr-1 py-0 bg-gray-800 border-gray-700 flex items-center gap-1"
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: trainingType.color }}
                  ></div>
                  {trainingType.name}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 ml-1 text-gray-400 hover:text-white hover:bg-gray-700"
                    onClick={() => handleFilterToggle(filter)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 py-0 text-xs text-gray-400 hover:text-white"
              onClick={() => setSelectedFilters([])}
            >
              Clear All
            </Button>
          </div>
        )}
        
        {isSelectionMode && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="h-7 bg-gray-800 border-gray-700"
                onClick={handleSelectAllWorkouts}
              >
                <CheckSquare className="mr-1 h-3.5 w-3.5" />
                Select All
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm"
                className="h-7"
                onClick={handleBulkDelete}
                disabled={selectedWorkouts.length === 0}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete ({selectedWorkouts.length})
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 text-gray-400"
              onClick={handleToggleSelectionMode}
            >
              Cancel
            </Button>
          </div>
        )}
      </header>

      <main className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-medium">Your Workouts</h2>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-sm"
            onClick={handleToggleSelectionMode}
          >
            {isSelectionMode ? (
              <X className="mr-1 h-4 w-4" />
            ) : (
              <CheckSquare className="mr-1 h-4 w-4" />
            )}
            {isSelectionMode ? 'Cancel' : 'Select'}
          </Button>
        </div>
        
        <Tabs defaultValue="list" value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-gray-900">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Archived
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <WorkoutLogSection 
              showWorkouts={showWorkouts} 
              onToggle={handleToggleWorkouts}
            />
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <WorkoutCalendarTab />
          </TabsContent>

          <TabsContent value="archived" className="mt-4">
            <div className="text-center text-gray-500 py-8">
              No archived workouts
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default WorkoutManagementPage;
