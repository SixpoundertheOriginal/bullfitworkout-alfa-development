
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { TrainingTypeTag, trainingTypes } from "@/components/TrainingTypeTag";
import { bulkDeleteWorkouts, bulkUpdateWorkouts, bulkResetWorkoutSets } from "@/services/workoutService";

interface BulkWorkoutActionsProps {
  selectedWorkoutIds: string[];
  onActionComplete: () => void;
  disabled?: boolean;
}

export function BulkWorkoutActions({
  selectedWorkoutIds,
  onActionComplete,
  disabled = false
}: BulkWorkoutActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: "",
    training_type: "",
    notes: ""
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTrainingTypeChange = (value: string) => {
    setEditFormData(prev => ({ ...prev, training_type: value }));
  };
  
  const handleBulkDelete = async () => {
    if (selectedWorkoutIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      const result = await bulkDeleteWorkouts(selectedWorkoutIds);
      setIsDeleteDialogOpen(false);
      toast.success(
        `${result.count} workouts deleted successfully`, 
        { description: "All selected workouts have been removed" }
      );
      onActionComplete();
    } catch (error) {
      console.error("Error deleting workouts:", error);
      toast.error("Failed to delete workouts", {
        description: "An error occurred while deleting the selected workouts"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBulkEdit = async () => {
    if (selectedWorkoutIds.length === 0) return;
    
    // Filter out empty values to only update fields that have been changed
    const updateData: any = {};
    Object.entries(editFormData).forEach(([key, value]) => {
      if (value) updateData[key] = value;
    });
    
    if (Object.keys(updateData).length === 0) {
      toast.info("No changes to apply");
      setIsEditDialogOpen(false);
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await bulkUpdateWorkouts(selectedWorkoutIds, updateData);
      setIsEditDialogOpen(false);
      toast.success(
        `${result.count} workouts updated successfully`, 
        { description: "The selected workouts have been updated" }
      );
      onActionComplete();
    } catch (error) {
      console.error("Error updating workouts:", error);
      toast.error("Failed to update workouts", {
        description: "An error occurred while updating the selected workouts"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleBulkReset = async () => {
    if (selectedWorkoutIds.length === 0) return;
    
    setIsProcessing(true);
    try {
      const result = await bulkResetWorkoutSets(selectedWorkoutIds);
      setIsResetDialogOpen(false);
      toast.success(
        `Reset ${result.workoutCount} workouts`, 
        { description: `${result.count} exercise sets have been reset to zero` }
      );
      onActionComplete();
    } catch (error) {
      console.error("Error resetting workouts:", error);
      toast.error("Failed to reset workouts", {
        description: "An error occurred while resetting the selected workouts"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const selectionCount = selectedWorkoutIds.length;
  
  return (
    <div className="flex gap-2">
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-950/30"
            disabled={selectionCount === 0 || disabled || isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectionCount})
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Delete {selectionCount} Workouts</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete {selectionCount} workouts? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-red-400">
              This will permanently delete {selectionCount} workouts and all their exercise sets.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-gray-800 text-white border-gray-700"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {selectionCount} Workouts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="border-purple-500/20 text-purple-400 hover:text-purple-300 hover:bg-purple-950/30"
            disabled={selectionCount === 0 || disabled || isProcessing}
          >
            <Check className="h-4 w-4 mr-2" />
            Edit ({selectionCount})
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Edit {selectionCount} Workouts</DialogTitle>
            <DialogDescription className="text-gray-400">
              Make changes to apply to all {selectionCount} selected workouts. Leave fields empty to keep their current values.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-white">Workout Name</Label>
              <Input
                id="name"
                name="name"
                value={editFormData.name}
                onChange={handleInputChange}
                placeholder="Leave empty to keep current names"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="training_type" className="text-white">Training Type</Label>
              <Select 
                value={editFormData.training_type} 
                onValueChange={handleTrainingTypeChange}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Keep current training types" />
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
              <Label htmlFor="notes" className="text-white">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={editFormData.notes}
                onChange={handleInputChange}
                placeholder="Leave empty to keep current notes"
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-gray-800 text-white border-gray-700"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkEdit}
              className="bg-purple-600 text-white hover:bg-purple-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Update {selectionCount} Workouts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="border-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
            disabled={selectionCount === 0 || disabled || isProcessing}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset ({selectionCount})
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Reset {selectionCount} Workouts</DialogTitle>
            <DialogDescription className="text-gray-400">
              Reset all exercise sets in {selectionCount} workouts to zero weight and reps.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-amber-400">
              This will reset all exercise sets in the selected workouts to 0 weight, 0 reps, and mark them as incomplete.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
              className="bg-gray-800 text-white border-gray-700"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleBulkReset}
              className="border-blue-500 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reset {selectionCount} Workouts
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
