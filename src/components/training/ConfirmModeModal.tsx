import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSmartPlan: () => void;
  onChooseExercises: () => void;
}

export const ConfirmModeModal: React.FC<ConfirmModeModalProps> = ({
  open,
  onOpenChange,
  onSmartPlan,
  onChooseExercises,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto bg-gray-900 border border-gray-800">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-white">
            How would you like to start?
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            We can auto-build a proven plan, or you can pick exercises.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-3">
          <Button onClick={onSmartPlan} className="w-full">
            Generate Smart Plan
          </Button>
          <Button
            variant="outline"
            onClick={onChooseExercises}
            className="w-full"
          >
            Choose Exercises
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
