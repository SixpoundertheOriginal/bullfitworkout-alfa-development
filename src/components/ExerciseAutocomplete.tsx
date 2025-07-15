import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Exercise, 
  COMMON_MUSCLE_GROUPS, 
  COMMON_EQUIPMENT, 
  MOVEMENT_PATTERNS, 
  DIFFICULTY_LEVELS,
  MuscleGroup,
  EquipmentType,
  MovementPattern,
  Difficulty
} from "@/types/exercise";
import { useExercises } from "@/hooks/useExercises";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ExerciseAutocompleteProps {
  onSelectExercise: (exercise: Exercise) => void;
  className?: string;
}

export function ExerciseAutocomplete({ onSelectExercise, className }: ExerciseAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  
  const [newExercise, setNewExercise] = useState<Omit<Exercise, 'id'>>({
    name: "",
    created_at: new Date().toISOString(),
    user_id: user?.id || "",
    description: "",
    primary_muscle_groups: [],
    secondary_muscle_groups: [],
    equipment_type: [],
    movement_pattern: "push",
    difficulty: "beginner",
    instructions: {},
    is_compound: false,
    tips: [],
    variations: [],
    metadata: {}
  });
  
  useEffect(() => {
    if (user?.id) {
      setNewExercise(prev => ({
        ...prev,
        user_id: user.id
      }));
    }
  }, [user]);
  
  const [tempMuscleGroup, setTempMuscleGroup] = useState<MuscleGroup | "">("");
  const [tempEquipment, setTempEquipment] = useState<EquipmentType | "">("");
  const [tempSecondaryMuscle, setTempSecondaryMuscle] = useState<MuscleGroup | "">("");
  
  const { exercises, isLoading, createExercise, isPending, error, isError } = useExercises();

  const safeExercises = Array.isArray(exercises) ? exercises : [];

  useEffect(() => {
    console.log(`Loaded ${safeExercises.length} exercises:`, safeExercises);
    if (isError && error) {
      console.error("Error in useExercises:", error);
    }
  }, [safeExercises, isError, error]);

  const handleCreateExercise = () => {
    if (!newExercise.name) {
      toast.error("Exercise name required");
      return;
    }

    if (!Array.isArray(newExercise.primary_muscle_groups) || newExercise.primary_muscle_groups.length === 0) {
      toast.error("Please add at least one primary muscle group");
      return;
    }
    
    const exerciseToCreate = {
      ...newExercise,
      user_id: user?.id || "",
    };
    
    console.log("Creating exercise with data:", exerciseToCreate);

    createExercise(exerciseToCreate, {
      onSuccess: (data) => {
        console.log("Exercise created successfully:", data);
        toast.success(`Exercise "${newExercise.name}" created successfully`);
        setDialogOpen(false);
        setNewExercise({
          name: "",
          created_at: new Date().toISOString(),
          user_id: user?.id || "",
          description: "",
          primary_muscle_groups: [],
          secondary_muscle_groups: [],
          equipment_type: [],
          movement_pattern: "push",
          difficulty: "beginner",
          instructions: {},
          is_compound: false,
          tips: [],
          variations: [],
          metadata: {}
        });
      },
      onError: (error) => {
        console.error("Error creating exercise:", error);
        toast.error(`Failed to create exercise: ${error.message}`);
      }
    });
  };

  const addPrimaryMuscleGroup = (muscleGroup: MuscleGroup) => {
    if (muscleGroup && !newExercise.primary_muscle_groups.includes(muscleGroup)) {
      setNewExercise({
        ...newExercise,
        primary_muscle_groups: [...newExercise.primary_muscle_groups, muscleGroup],
      });
      setTempMuscleGroup("");
    }
  };
  
  const addSecondaryMuscleGroup = (muscleGroup: MuscleGroup) => {
    if (muscleGroup && !newExercise.secondary_muscle_groups.includes(muscleGroup)) {
      setNewExercise({
        ...newExercise,
        secondary_muscle_groups: [...newExercise.secondary_muscle_groups, muscleGroup],
      });
      setTempSecondaryMuscle("");
    }
  };

  const addEquipment = (equipment: EquipmentType) => {
    if (equipment && !newExercise.equipment_type.includes(equipment)) {
      setNewExercise({
        ...newExercise,
        equipment_type: [...newExercise.equipment_type, equipment],
      });
      setTempEquipment("");
    }
  };

  const removeMuscleGroup = (group: string) => {
    setNewExercise({
      ...newExercise,
      primary_muscle_groups: newExercise.primary_muscle_groups.filter(g => g !== group),
    });
  };
  
  const removeSecondaryMuscle = (group: string) => {
    setNewExercise({
      ...newExercise,
      secondary_muscle_groups: newExercise.secondary_muscle_groups.filter(g => g !== group),
    });
  };

  const removeEquipment = (equipment: string) => {
    setNewExercise({
      ...newExercise,
      equipment_type: newExercise.equipment_type.filter(e => e !== equipment),
    });
  };

  const filteredExercises = safeExercises
    .filter(exercise => 
      exercise?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-gray-900 border-gray-700 text-white"
          >
            {value
              ? safeExercises.find((exercise) => exercise?.name === value)?.name
              : "Select exercise..."}
            {isLoading ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-gray-800 text-white border-gray-700">
          <Command className="bg-gray-800 border-gray-700">
            <CommandInput 
              placeholder="Search exercises..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="bg-gray-800 text-white border-gray-700"
            />
            
            {isLoading ? (
              <div className="py-6 text-center text-gray-400">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  <span>Loading exercises...</span>
                </div>
              </div>
            ) : (
              <>
                <CommandList className="max-h-[300px]">
                  {filteredExercises.length > 0 ? (
                    <CommandGroup>
                      {filteredExercises.map((exercise) => (
                        <CommandItem
                          key={exercise.id}
                          value={exercise.name}
                          onSelect={() => {
                            setValue(exercise.name);
                            onSelectExercise(exercise);
                            setOpen(false);
                          }}
                          className="text-white hover:bg-gray-700"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === exercise.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {exercise.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    <CommandEmpty className="py-6 text-center text-gray-400">
                      No exercise found.
                    </CommandEmpty>
                  )}
                </CommandList>
                <div className="p-2 border-t border-gray-700">
                  <Button 
                    variant="link" 
                    className="w-full text-blue-400 flex items-center justify-center"
                    onClick={() => {
                      setDialogOpen(true);
                      setNewExercise({
                        ...newExercise,
                        name: searchTerm || "",
                      });
                      setOpen(false);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create "{searchTerm || 'new exercise'}"
                  </Button>
                </div>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Exercise Name</Label>
              <Input
                id="name"
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newExercise.description || ''}
                onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Primary Muscle Groups</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-gray-800 border-gray-700 text-white">
                    Select Muscle Group
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                  {COMMON_MUSCLE_GROUPS.map((muscle) => (
                    <DropdownMenuItem 
                      key={muscle}
                      onClick={() => addPrimaryMuscleGroup(muscle)}
                      className="cursor-pointer"
                    >
                      {muscle}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {newExercise.primary_muscle_groups.map((group) => (
                  <Badge 
                    key={group} 
                    variant="secondary"
                    className="flex items-center gap-1 bg-gray-700"
                  >
                    {group}
                    <button 
                      onClick={() => removeMuscleGroup(group)}
                      className="ml-1 text-gray-400 hover:text-white"
                      type="button"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Secondary Muscle Groups</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-gray-800 border-gray-700 text-white">
                    Select Muscle Group
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                  {COMMON_MUSCLE_GROUPS.map((muscle) => (
                    <DropdownMenuItem 
                      key={muscle}
                      onClick={() => addSecondaryMuscleGroup(muscle)}
                      className="cursor-pointer"
                    >
                      {muscle}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {newExercise.secondary_muscle_groups.map((group) => (
                  <Badge 
                    key={group} 
                    variant="secondary"
                    className="flex items-center gap-1 bg-gray-700"
                  >
                    {group}
                    <button 
                      onClick={() => removeSecondaryMuscle(group)}
                      className="ml-1 text-gray-400 hover:text-white"
                      type="button"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Equipment Types</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-gray-800 border-gray-700 text-white">
                    Select Equipment
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                  {COMMON_EQUIPMENT.map((equipment) => (
                    <DropdownMenuItem 
                      key={equipment}
                      onClick={() => addEquipment(equipment)}
                      className="cursor-pointer"
                    >
                      {equipment}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {newExercise.equipment_type.map((equipment) => (
                  <Badge 
                    key={equipment} 
                    variant="secondary"
                    className="flex items-center gap-1 bg-gray-700"
                  >
                    {equipment}
                    <button 
                      onClick={() => removeEquipment(equipment)}
                      className="ml-1 text-gray-400 hover:text-white"
                      type="button"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="movement">Movement Pattern</Label>
              <Select 
                value={newExercise.movement_pattern}
                onValueChange={(value: MovementPattern) => setNewExercise({ ...newExercise, movement_pattern: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select movement pattern" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {MOVEMENT_PATTERNS.map((pattern) => (
                    <SelectItem key={pattern} value={pattern}>{pattern.charAt(0).toUpperCase() + pattern.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select 
                value={newExercise.difficulty}
                onValueChange={(value: Difficulty) => setNewExercise({ ...newExercise, difficulty: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="isCompound">Exercise Type</Label>
              <Select 
                value={newExercise.is_compound.toString()}
                onValueChange={(value) => setNewExercise({ ...newExercise, is_compound: value === "true" })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select exercise type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="true">Compound</SelectItem>
                  <SelectItem value="false">Isolation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateExercise}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : "Create Exercise"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
