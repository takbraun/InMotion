import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Compass, Bell, BarChart3, Settings } from "lucide-react";

export default function AppHeader() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <Compass className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">LifeOS</h1>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <button className="text-gray-600 hover:text-primary transition-colors flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            <button className="text-gray-600 hover:text-primary transition-colors flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:text-primary transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="User profile" 
                  className="w-8 h-8 rounded-full object-cover" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
