import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/layout/AppHeader";
import MobileNavigation from "@/components/layout/MobileNavigation";
import VisionPlanningModule from "@/components/vision/VisionPlanningModule";
import QuarterlyQuestTracker from "@/components/quarterly/QuarterlyQuestTracker";
import WeeklyPlanningSystem from "@/components/weekly/WeeklyPlanningSystem";
import DailyTaskManager from "@/components/daily/DailyTaskManager";
import PomodoroTimer from "@/components/timer/PomodoroTimer";
import DailyReflection from "@/components/reflection/DailyReflection";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading your productivity dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Vision & Quarterly Planning */}
          <div className="lg:col-span-1 space-y-6">
            <VisionPlanningModule />
            <QuarterlyQuestTracker />
          </div>

          {/* Center Column: Weekly & Daily Planning */}
          <div className="lg:col-span-2 space-y-6">
            <WeeklyPlanningSystem />
            <DailyTaskManager />
            <PomodoroTimer />
            <DailyReflection />
          </div>
        </div>
      </div>

      <MobileNavigation />
    </div>
  );
}
