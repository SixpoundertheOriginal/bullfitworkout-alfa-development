import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  Tag,
  Share2,
  Copy,
  Download,
  CheckSquare,
  X,
  History
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface QuickActionBarProps {
  selectedWorkoutIds: string[];
  onClearSelection: () => void;
  onSelectAll?: () => void;
  onActionComplete?: () => void;
}

export const QuickActionBar = ({
  selectedWorkoutIds,
  onClearSelection,
  onSelectAll,
  onActionComplete
}: QuickActionBarProps) => {
  const selectedCount = selectedWorkoutIds.length;
  
  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    
    try {
      // Future implementation: Will connect to actual delete functionality
      console.log("Deleting workouts:", selectedWorkoutIds);
      
      toast.success(`${selectedCount} workout${selectedCount !== 1 ? 's' : ''} deleted`);
      
      if (onActionComplete) onActionComplete();
    } catch (error) {
      console.error("Error deleting workouts:", error);
      toast.error("Failed to delete workouts");
    }
  };
  
  const handleBulkExport = () => {
    if (selectedCount === 0) return;
    
    // Future implementation: Will connect to actual export functionality
    console.log("Exporting workouts:", selectedWorkoutIds);
    toast.success(`Exporting ${selectedCount} workout${selectedCount !== 1 ? 's' : ''}`);
  };
  
  const handleBulkShare = () => {
    if (selectedCount === 0) return;
    
    // Future implementation: Will connect to actual share functionality
    console.log("Sharing workouts:", selectedWorkoutIds);
    toast("Sharing feature coming soon!");
  };
  
  const handleBulkDuplicate = () => {
    if (selectedCount === 0) return;
    
    // Future implementation: Will connect to actual duplication functionality
    console.log("Duplicating workouts:", selectedWorkoutIds);
    toast("Duplication feature coming soon!");
  };
  
  return (
    <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="font-medium text-sm mr-2">
            {selectedCount} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onClearSelection}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
        
        {onSelectAll && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onSelectAll}
          >
            <CheckSquare className="mr-1 h-3.5 w-3.5" />
            Select All
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant="outline"
          className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700"
          disabled={selectedCount === 0}
          onClick={handleBulkDelete}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
        
        <Button
          variant="outline"
          className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700"
          disabled={selectedCount === 0}
          onClick={handleBulkExport}
        >
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
        
        <Button
          variant="outline"
          className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700"
          disabled={selectedCount === 0}
          onClick={handleBulkShare}
        >
          <Share2 className="mr-1 h-4 w-4" />
          Share
        </Button>
        
        <Button
          variant="outline"
          className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700" 
          disabled={selectedCount === 0}
          onClick={handleBulkDuplicate}
        >
          <Copy className="mr-1 h-4 w-4" />
          Duplicate
        </Button>
      </div>
    </div>
  );
};
