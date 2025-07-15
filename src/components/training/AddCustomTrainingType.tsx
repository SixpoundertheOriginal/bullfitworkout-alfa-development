
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export function AddCustomTrainingType() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏃‍♂️");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('custom_training_types')
        .insert({
          name,
          icon,
          color_start: '#9b87f5',
          color_end: '#6E59A5',
          user_id: user?.id // Add the user_id from auth context
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom training type added successfully"
      });
      
      queryClient.invalidateQueries({ queryKey: ['customTrainingTypes'] });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add custom training type",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-white/80 hover:text-white hover:bg-white/10"
      >
        <PlusCircle className="h-4 w-4" />
        Add Custom Type
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Training Type</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., HIIT, CrossFit"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Icon</label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="Enter an emoji or icon"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Add Training Type
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
