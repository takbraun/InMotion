import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import LifeCompassPage from "@/pages/life-compass";
import VisionBoardPage from "@/pages/vision-board";
import QuarterlyQuestsPage from "@/pages/quarterly-quests";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isOnboardingComplete } = useOnboarding();

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/life-compass" component={LifeCompassPage} />
      <Route path="/vision-board" component={VisionBoardPage} />
      <Route path="/quarterly-quests" component={QuarterlyQuestsPage} />
      <Route path="/weekly-planning" component={Home} />
      <Route path="/daily-tasks" component={Home} />
      <Route path="/" component={isOnboardingComplete ? Home : LifeCompassPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
