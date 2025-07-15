
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LogOut, User, Settings, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export function UserProfile() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  if (!user) return null;
  
  // Extract user's initials for the avatar fallback
  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
    }
    
    return user.email?.substring(0, 2).toUpperCase() || 'U';
  };
  
  const handleSignOut = async () => {
    try {
      await signOut();
      setOpen(false);
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account."
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message || "An error occurred during sign out",
        variant: "destructive"
      });
    }
  };

  const goToProfilePage = () => {
    setOpen(false);
    navigate('/profile');
  };
  
  return (
    <>
      <button 
        onClick={() => setOpen(true)} 
        className="p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-full"
        aria-label="Open profile menu"
      >
        <Avatar className="transition-transform hover:scale-105">
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-purple-800">{getInitials()}</AvatarFallback>
        </Avatar>
      </button>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-gray-900 text-white border-gray-800">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-white">Your Profile</SheetTitle>
            <SheetDescription className="text-gray-400">
              Manage your account settings
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex flex-col items-center py-6">
            <Avatar className="h-20 w-20 mb-4 border-2 border-purple-500 transition-transform hover:scale-105">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-purple-800 text-xl">{getInitials()}</AvatarFallback>
            </Avatar>
            
            <h3 className="text-xl font-semibold">
              {user.user_metadata?.full_name || 'User'}
            </h3>
            <p className="text-gray-400 text-sm mb-2">{user.email}</p>
            
            <Button
              variant="outline"
              size="sm"
              className="mt-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
              onClick={goToProfilePage}
            >
              <Upload className="mr-2 h-4 w-4" />
              Update Photo
            </Button>
          </div>
          
          <div className="space-y-4 mt-6">
            <Button 
              variant="outline" 
              className="w-full justify-start text-white bg-gray-800 border-gray-700 hover:bg-gray-700"
              onClick={goToProfilePage}
              aria-label="View your profile"
            >
              <User className="mr-2 h-4 w-4 text-purple-400" />
              View Profile
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start text-white bg-gray-800 border-gray-700 hover:bg-gray-700"
              onClick={() => {
                setOpen(false);
                navigate('/settings');
              }}
              aria-label="Go to settings"
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
        </SheetContent>
      </Sheet>
    </>
  );
}
