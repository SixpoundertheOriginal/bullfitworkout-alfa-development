
import React, { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MinusCircle, PlusCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useWeightUnit } from "@/context/WeightUnitContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExerciseSet {
  id: string;
  exercise_name: string;
  workout_id: string;
  weight: number;
  reps: number;
  set_number: number;
  completed: boolean;
}

interface EditExerciseSetModalProps {
  sets: ExerciseSet[];
  exerciseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedSets: ExerciseSet[]) => Promise<void>;
}

export function EditExerciseSetModal({ 
  sets, 
  exerciseName,
  open, 
  onOpenChange, 
  onSave 
}: EditExerciseSetModalProps) {
  const [formSets, setFormSets] = useState<ExerciseSet[]>([]);
  const [saving, setSaving] = useState(false);
  const { weightUnit } = useWeightUnit();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (sets) {
      setFormSets([...sets].sort((a, b) => a.set_number - b.set_number));
    }
  }, [sets]);

  const handleWeightChange = (index: number, value: string) => {
    const updatedSets = [...formSets];
    const numValue = parseFloat(value);
    updatedSets[index].weight = !isNaN(numValue) ? Math.max(0, numValue) : 0;
    setFormSets(updatedSets);
  };

  const handleRepsChange = (index: number, value: string) => {
    const updatedSets = [...formSets];
    const numValue = parseInt(value, 10);
    updatedSets[index].reps = !isNaN(numValue) ? Math.max(0, numValue) : 0;
    setFormSets(updatedSets);
  };

  const handleWeightIncrement = (index: number, increment: number) => {
    const updatedSets = [...formSets];
    const newWeight = Math.max(0, updatedSets[index].weight + increment);
    updatedSets[index].weight = newWeight;
    setFormSets(updatedSets);
  };

  const handleRepsIncrement = (index: number, increment: number) => {
    const updatedSets = [...formSets];
    const newReps = Math.max(0, updatedSets[index].reps + increment);
    updatedSets[index].reps = newReps;
    setFormSets(updatedSets);
  };

  const handleRemoveSet = (index: number) => {
    // Filter out the set to remove
    const updatedSets = formSets.filter((_, i) => i !== index);
    
    // Recalculate set numbers
    updatedSets.forEach((set, i) => {
      set.set_number = i + 1;
    });
    
    setFormSets(updatedSets);
  };

  const handleAddSet = () => {
    // Clone the last set or create a new one if none exist
    const lastSet = formSets.length > 0 ? formSets[formSets.length - 1] : null;
    const newSetNumber = formSets.length + 1;
    
    const newSet: ExerciseSet = {
      id: `temp-${Date.now()}`, // Will be replaced when saved to database
      exercise_name: exerciseName,
      workout_id: lastSet?.workout_id || "",
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      set_number: newSetNumber,
      completed: true
    };
    
    setFormSets([...formSets, newSet]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await onSave(formSets);
      onOpenChange(false);
      toast.success("Exercise sets updated successfully");
    } catch (error) {
      console.error("Error updating exercise sets:", error);
      toast.error("Failed to update exercise sets");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 text-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Edit {exerciseName}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Edit sets, weight, and reps for this exercise.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid grid-cols-12 gap-2 mb-2 text-sm text-gray-400">
              <div className="col-span-2 text-center">Set</div>
              <div className="col-span-4 text-center">Weight ({weightUnit})</div>
              <div className="col-span-4 text-center">Reps</div>
              <div className="col-span-2 text-center">Action</div>
            </div>
            
            {formSets.map((set, index) => (
              <div key={set.id} className="grid grid-cols-12 gap-2 mb-3 items-center">
                <div className="col-span-2 text-center font-medium">{set.set_number}</div>
                
                <div className="col-span-4 flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => handleWeightIncrement(index, -1)} 
                    className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
                  >
                    <MinusCircle size={16} />
                  </button>
                  <Input 
                    type="number"
                    min="0"
                    step="any"
                    value={set.weight}
                    onChange={(e) => handleWeightChange(index, e.target.value)}
                    className="workout-number-input text-center flex-1 h-10 bg-gray-800 border-gray-700 text-white"
                    onBlur={(e) => {
                      if (parseFloat(e.target.value) < 0 || e.target.value === '') {
                        handleWeightChange(index, "0");
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => handleWeightIncrement(index, 1)} 
                    className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
                  >
                    <PlusCircle size={16} />
                  </button>
                </div>
                
                <div className="col-span-4 flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => handleRepsIncrement(index, -1)} 
                    className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
                  >
                    <MinusCircle size={16} />
                  </button>
                  <Input 
                    type="number"
                    min="0"
                    step="1"
                    value={set.reps}
                    onChange={(e) => handleRepsChange(index, e.target.value)}
                    className="workout-number-input text-center flex-1 h-10 bg-gray-800 border-gray-700 text-white"
                    onBlur={(e) => {
                      if (parseInt(e.target.value) < 0 || e.target.value === '') {
                        handleRepsChange(index, "0");
                      }
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => handleRepsIncrement(index, 1)} 
                    className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-white bg-gray-800 rounded-full"
                  >
                    <PlusCircle size={16} />
                  </button>
                </div>
                
                <div className="col-span-2 flex justify-center">
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    onClick={() => handleRemoveSet(index)}
                    className="h-10 w-10"
                    disabled={formSets.length <= 1}
                  >
                    <MinusCircle size={16} />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              onClick={handleAddSet}
              variant="outline"
              className="w-full mt-2 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Set
            </Button>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-purple-600 text-white hover:bg-purple-700"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
