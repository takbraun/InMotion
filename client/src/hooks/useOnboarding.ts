import { useQuery } from "@tanstack/react-query";
import type { VisionPlan, QuarterlyQuest } from "@shared/schema";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  route: string;
}

export function useOnboarding() {
  const { data: visionPlan } = useQuery<VisionPlan>({
    queryKey: ["/api/vision"],
    retry: false,
  });

  const { data: quarterlyQuests } = useQuery<QuarterlyQuest[]>({
    queryKey: ["/api/quarterly-quests"],
    retry: false,
  });

  // Check completion status for each step
  const hasLifeCompass = !!(
    visionPlan?.coreValues?.length &&
    visionPlan?.threeYearVision &&
    visionPlan?.whyEngine
  );

  const hasVisionBoard = hasLifeCompass; // For now, vision board builds on life compass
  const hasQuarterlyQuests = !!(quarterlyQuests?.length && quarterlyQuests.some(q => q.isActive));

  const steps: OnboardingStep[] = [
    {
      id: "life-compass",
      title: "Life Compass",
      description: "Define your core values, 3-year vision, and purpose",
      isCompleted: hasLifeCompass,
      isActive: !hasLifeCompass,
      route: "/life-compass"
    },
    {
      id: "vision-board",
      title: "Vision Board",
      description: "Create visual representations of your goals and dreams",
      isCompleted: hasVisionBoard && hasLifeCompass,
      isActive: hasLifeCompass && !hasVisionBoard,
      route: "/vision-board"
    },
    {
      id: "quarterly-quests",
      title: "Quarterly Quests",
      description: "Set 90-day goals with clear plans and systems",
      isCompleted: hasQuarterlyQuests,
      isActive: hasLifeCompass && !hasQuarterlyQuests,
      route: "/quarterly-quests"
    },
    {
      id: "weekly-planning",
      title: "Weekly Planning",
      description: "Plan your weeks to support your quarterly goals",
      isCompleted: false, // Always ongoing
      isActive: hasQuarterlyQuests,
      route: "/weekly-planning"
    },
    {
      id: "daily-execution",
      title: "Daily Execution",
      description: "Manage daily tasks and track progress",
      isCompleted: false, // Always ongoing
      isActive: hasQuarterlyQuests,
      route: "/daily-tasks"
    }
  ];

  const completedSteps = steps.filter(step => step.isCompleted).length;
  const totalSteps = steps.length;
  const currentStep = steps.find(step => step.isActive) || steps[0];
  const isOnboardingComplete = hasLifeCompass && hasVisionBoard && hasQuarterlyQuests;

  return {
    steps,
    currentStep,
    completedSteps,
    totalSteps,
    isOnboardingComplete,
    completionPercentage: Math.round((completedSteps / totalSteps) * 100)
  };
}