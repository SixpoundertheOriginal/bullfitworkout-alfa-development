
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrainingTypeTag, trainingTypes, TrainingType } from "@/components/TrainingTypeTag";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface WorkoutDetails {
  id: string;
  name: string;
  training_type: string;
  start_time: string;
  end_time: string;
  duration: number;
  notes: string | null;
}

interface EditWorkoutModalProps {
  workout: WorkoutDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedWorkout: WorkoutDetails) => Promise<void>;
}

export function EditWorkoutModal({ workout, open, onOpenChange, onSave }: EditWorkoutModalProps) {
  const [formData, setFormData] = useState<WorkoutDetails | null>(null);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (workout) {
      setFormData({ ...workout });
      setDate(workout.start_time ? new Date(workout.start_time) : undefined);
    }
  }, [workout]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (formData) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTrainingTypeChange = (value: string) => {
    if (formData) {
      setFormData({ ...formData, training_type: value });
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    
    if (formData && newDate) {
      const originalDate = new Date(formData.start_time);
      newDate.setHours(originalDate.getHours());
      newDate.setMinutes(originalDate.getMinutes());
      newDate.setSeconds(originalDate.getSeconds());
      
      const newStartTime = newDate.toISOString();
      
      const endDate = new Date(newDate);
      endDate.setMinutes(endDate.getMinutes() + formData.duration);
      const newEndTime = endDate.toISOString();
      
      setFormData({
        ...formData,
        start_time: newStartTime,
        end_time: newEndTime
      });
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formData) {
      const newDuration = parseInt(e.target.value, 10) || 0;
      
      const updatedData = { ...formData, duration: newDuration };
      
      const startDate = new Date(updatedData.start_time);
      const endDate = new Date(startDate);
      endDate.setMinutes(startDate.getMinutes() + newDuration);
      
      updatedData.end_time = endDate.toISOString();
      setFormData(updatedData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    try {
      setSaving(true);
      await onSave(formData);
      
      // Invalidate all related queries to ensure data refreshes everywhere
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout-details', formData.id] });
      queryClient.invalidateQueries({ queryKey: ['workout-history'] });
      
      onOpenChange(false);
      toast.success("Workout updated successfully");
    } catch (error) {
      console.error("Error updating workout:", error);
      toast.error("Failed to update workout");
    } finally {
      setSaving(false);
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 text-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Edit Workout</DialogTitle>
            <DialogDescription className="text-gray-400">
              Make changes to your workout details below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-white">Workout Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="training_type" className="text-white">Training Type</Label>
              <Select 
                value={formData.training_type} 
                onValueChange={handleTrainingTypeChange}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select training type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {trainingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center">
                        <TrainingTypeTag type={type} size="sm" />
                        <span className="ml-2">{type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="date" className="text-white">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white",
                      !date && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange}
                    initialFocus
                    className="bg-gray-800 text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="duration" className="text-white">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleDurationChange}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-white">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
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
