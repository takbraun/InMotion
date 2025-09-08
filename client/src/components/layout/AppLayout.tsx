import { useState } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import AppHeader from "./AppHeader";
import OnboardingSidebar from "./OnboardingSidebar";
import MobileNavigation from "./MobileNavigation";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  showOnboarding?: boolean;
}

export default function AppLayout({ children, showOnboarding = true }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isOnboardingComplete } = useOnboarding();

  const shouldShowSidebar = showOnboarding && !isOnboardingComplete;

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <AppHeader />
      
      <div className="flex">
        {/* Sidebar */}
        {shouldShowSidebar && (
          <>
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
              <OnboardingSidebar isOpen={true} onClose={() => {}} />
            </div>
            
            {/* Mobile Sidebar */}
            <OnboardingSidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)} 
            />
          </>
        )}

        {/* Main Content */}
        <div className={`flex-1 ${shouldShowSidebar ? 'lg:ml-0' : ''}`}>
          {/* Mobile Menu Button */}
          {shouldShowSidebar && (
            <div className="lg:hidden p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="mb-4"
              >
                <Menu className="w-4 h-4 mr-2" />
                View Journey
              </Button>
            </div>
          )}

          {/* Page Content */}
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Navigation - only show when onboarding is complete */}
      {isOnboardingComplete && <MobileNavigation />}
    </div>
  );
}