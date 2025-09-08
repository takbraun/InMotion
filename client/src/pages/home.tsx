import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/AppLayout";
import VisionPlanningModule from "@/components/vision/VisionPlanningModule";
import QuarterlyQuestTracker from "@/components/quarterly/QuarterlyQuestTracker";
import WeeklyPlanningSystem from "@/components/weekly/WeeklyPlanningSystem";
import DailyTaskManager from "@/components/daily/DailyTaskManager";
import PomodoroTimer from "@/components/timer/PomodoroTimer";
import DailyReflection from "@/components/reflection/DailyReflection";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { Compass, Target, Calendar, CheckSquare, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isOnboardingComplete, currentStep, completionPercentage } = useOnboarding();
  const [location, navigate] = useLocation();

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
          <p className="text-gray-600">Loading your InMotion dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // If onboarding is not complete, show completion prompt
  if (!isOnboardingComplete) {
    return (
      <AppLayout showOnboarding={false}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 gradient-bg rounded-xl flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome to InMotion!</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Let's set up your productivity system. We'll guide you through building your foundation step by step.
            </p>
          </div>

          {/* Progress Overview */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Setup Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="gradient-bg h-3 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 text-center">
                {completionPercentage}% Complete
              </div>
              
              {currentStep && (
                <div className="text-center">
                  <Badge variant="outline" className="mb-4">
                    Next Step: {currentStep.title}
                  </Badge>
                  <p className="text-sm text-gray-600 mb-4">
                    {currentStep.description}
                  </p>
                  <Button 
                    onClick={() => navigate(currentStep.route)}
                    size="lg"
                    className="px-8"
                  >
                    Continue Setup
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Preview */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Compass className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Life Compass</h3>
              <p className="text-sm text-gray-600">Define your values, vision, and purpose</p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Quarterly Quests</h3>
              <p className="text-sm text-gray-600">Set 90-day goals with clear plans</p>
            </Card>
            
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Daily Execution</h3>
              <p className="text-sm text-gray-600">Transform goals into daily actions</p>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Full dashboard for completed onboarding
  return (
    <AppLayout showOnboarding={false}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back to your InMotion Dashboard
          </h1>
          <p className="text-gray-600">
            Your complete life management system is ready. Let's make today count.
          </p>
        </div>

        {/* First Row: Vision & Weekly Planning */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="equal-height-card">
            <VisionPlanningModule />
          </div>
          <div className="equal-height-card">
            <WeeklyPlanningSystem />
          </div>
        </div>
        
        {/* Second Row: Quarterly Quest & Daily Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="equal-height-card">
            <QuarterlyQuestTracker />
          </div>
          <div className="equal-height-card">
            <DailyTaskManager />
          </div>
        </div>
        
        {/* Third Row: Timer & Reflection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <div className="equal-height-card">
            <PomodoroTimer />
          </div>
          <div className="equal-height-card">
            <DailyReflection />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
