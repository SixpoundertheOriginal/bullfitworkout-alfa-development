
import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/profile/SectionHeader";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export function SettingsSection() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message || "An error occurred while signing out",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 p-6">
      <SectionHeader title="Account Settings" />
      
      <div className="space-y-4 mt-4">
        <Button 
          variant="outline" 
          className="w-full justify-start text-white bg-gray-800 border-gray-700 hover:bg-gray-700"
          onClick={() => navigate("/profile?tab=profile")}
          aria-label="Edit profile information"
        >
          <User className="mr-2 h-4 w-4 text-purple-400" />
          Edit Profile
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start text-white bg-gray-800 border-gray-700 hover:bg-gray-700"
          onClick={() => navigate("/settings")}
          aria-label="Access application settings"
        >
          <Settings className="mr-2 h-4 w-4 text-purple-400" />
          Settings
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-400 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:text-red-300"
          onClick={handleSignOut}
          aria-label="Sign out of your account"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </Card>
  );
}
