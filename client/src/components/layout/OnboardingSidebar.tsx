import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Compass, 
  Target, 
  Calendar, 
  CheckSquare,
  Sparkles,
  X
} from "lucide-react";

const stepIcons = {
  "life-compass": Compass,
  "vision-board": Sparkles,
  "quarterly-quests": Target,
  "weekly-planning": Calendar,
  "daily-execution": CheckSquare,
};

interface OnboardingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingSidebar({ isOpen, onClose }: OnboardingSidebarProps) {
  const [location, navigate] = useLocation();
  const { steps, currentStep, completedSteps, totalSteps, completionPercentage, isOnboardingComplete } = useOnboarding();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleStepClick = (step: typeof steps[0]) => {
    if (step.isCompleted || step.isActive) {
      navigate(step.route);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Overlay for mobile */}
      <div className="absolute inset-0 bg-black/50 lg:hidden" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl lg:relative lg:w-72 lg:shadow-none border-r">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <Compass className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-semibold text-gray-900">InMotion Journey</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Overview */}
          <div className="p-4 border-b bg-gray-50">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Overall Progress</span>
                <span className="font-medium text-gray-900">{completedSteps} of {totalSteps}</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              {isOnboardingComplete ? (
                <Badge variant="default" className="w-full justify-center bg-green-100 text-green-800">
                  Setup Complete! 🎉
                </Badge>
              ) : (
                <div className="text-xs text-gray-600 text-center">
                  {currentStep?.title} is your next step
                </div>
              )}
            </div>
          </div>

          {/* Guided Steps */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Your Journey</h3>
              
              {steps.map((step, index) => {
                const Icon = stepIcons[step.id as keyof typeof stepIcons];
                const isClickable = step.isCompleted || step.isActive;
                
                return (
                  <div
                    key={step.id}
                    className={`
                      group relative p-3 rounded-lg border transition-all cursor-pointer
                      ${step.isActive ? 'border-blue-200 bg-blue-50' : ''}
                      ${step.isCompleted ? 'border-green-200 bg-green-50' : ''}
                      ${!step.isCompleted && !step.isActive ? 'border-gray-200 bg-gray-50 opacity-60' : ''}
                      ${isClickable ? 'hover:shadow-md' : 'cursor-not-allowed'}
                    `}
                    onClick={() => handleStepClick(step)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`
                        flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5
                        ${step.isCompleted ? 'bg-green-600' : step.isActive ? 'bg-blue-600' : 'bg-gray-400'}
                      `}>
                        {step.isCompleted ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <Circle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-4 h-4 ${step.isActive ? 'text-blue-600' : step.isCompleted ? 'text-green-600' : 'text-gray-400'}`} />
                          <h4 className={`
                            text-sm font-medium
                            ${step.isActive ? 'text-blue-900' : step.isCompleted ? 'text-green-900' : 'text-gray-500'}
                          `}>
                            {step.title}
                          </h4>
                        </div>
                        <p className={`
                          text-xs mt-1
                          ${step.isActive ? 'text-blue-700' : step.isCompleted ? 'text-green-700' : 'text-gray-400'}
                        `}>
                          {step.description}
                        </p>
                        
                        {step.isActive && (
                          <Badge variant="outline" className="mt-2 text-xs border-blue-200 text-blue-700">
                            Current Step
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Connection line */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-6 bg-gray-200" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          {!isOnboardingComplete && currentStep && (
            <div className="p-4 border-t bg-gray-50">
              <Button 
                onClick={() => handleStepClick(currentStep)}
                className="w-full" 
                size="sm"
              >
                Continue to {currentStep.title}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}