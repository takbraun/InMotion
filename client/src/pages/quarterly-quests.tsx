import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Target, Plus, ArrowRight, CheckCircle, Calendar, TrendingUp, Lightbulb } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { showSuccessNotification, showErrorNotification } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import type { VisionPlan, QuarterlyQuest } from "@shared/schema";
import AppLayout from "@/components/layout/AppLayout";

const questFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  goal: z.string().min(20, "Goal must be at least 20 characters"),
  plan: z.string().min(30, "Plan must be at least 30 characters"),
  systems: z.string().min(20, "Systems must be at least 20 characters"),
  quarter: z.string().min(1, "Quarter is required"),
  year: z.number().min(2024, "Invalid year"),
});

type QuestFormData = z.infer<typeof questFormSchema>;

export default function QuarterlyQuestsPage() {
  const [location, navigate] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const { data: visionPlan } = useQuery<VisionPlan>({
    queryKey: ["/api/vision"],
    retry: false,
  });

  const { data: quests, isLoading } = useQuery<QuarterlyQuest[]>({
    queryKey: ["/api/quarterly-quests"],
    retry: false,
  });

  const { data: user } = useQuery<{id: string}>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const hasLifeCompass = !!(
    visionPlan?.coreValues?.length &&
    visionPlan?.threeYearVision &&
    visionPlan?.whyEngine
  );

  // Get current quarter
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  const form = useForm<QuestFormData>({
    resolver: zodResolver(questFormSchema),
    defaultValues: {
      title: "",
      goal: "",
      plan: "",
      systems: "",
      quarter: `Q${currentQuarter}`,
      year: currentYear,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: QuestFormData) => {
      await apiRequest("POST", "/api/quarterly-quests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quarterly-quests"] });
      setIsCreating(false);
      form.reset();
      showSuccessNotification('quarterly_quest');
      toast({
        title: "Quest Created!",
        description: "Your 90-day quest is ready. Time to break it down into weekly plans.",
      });
    },
    onError: async (error) => {
      if (isUnauthorizedError(error)) {
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
      await showErrorNotification('quarterly_quest', error, user?.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<QuarterlyQuest> }) => {
      await apiRequest("PATCH", `/api/quarterly-quests/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quarterly-quests"] });
    },
  });

  const onSubmit = (data: QuestFormData) => {
    createMutation.mutate(data);
  };

  const updateProgress = (questId: string, progress: number) => {
    updateMutation.mutate({ id: questId, updates: { progress } });
  };

  const activeQuests = quests?.filter(q => q.isActive) || [];
  const hasActiveQuests = activeQuests.length > 0;

  if (!hasLifeCompass) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 gradient-bg rounded-xl flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Quarterly Quests</h1>
          <p className="text-lg text-gray-600">
            Complete your Life Compass and Vision Board first to unlock quarterly planning.
          </p>
          <Button onClick={() => navigate("/life-compass")}>
            Complete Foundation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Quarterly Quests</h1>
            {hasActiveQuests && (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            )}
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your vision into 90-day goals using the GPS method: Goal, Plan, Systems.
          </p>
        </div>

        {/* Vision Reference */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Your 3-Year Vision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 italic">
              "{visionPlan?.threeYearVision}"
            </p>
          </CardContent>
        </Card>

        {/* Active Quests */}
        <div className="grid gap-6 md:grid-cols-2">
          {activeQuests.map((quest) => (
            <Card key={quest.id} className="card-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {quest.quarter} {quest.year}
                    </Badge>
                    <Badge variant="outline" className="text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {quest.progress}% Complete
                  </div>
                </div>
                <CardTitle className="text-xl">{quest.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <Progress value={quest.progress} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{quest.progress}%</span>
                  </div>
                </div>

                {/* GPS Structure */}
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">Goal</span>
                    </div>
                    <p className="text-sm text-green-800">{quest.goal}</p>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Plan</span>
                    </div>
                    <p className="text-sm text-blue-800">{quest.plan}</p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-900">Systems</span>
                    </div>
                    <p className="text-sm text-purple-800">{quest.systems}</p>
                  </div>
                </div>

                {/* Progress Update */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium mb-2">Update Progress</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={quest.progress}
                      onChange={(e) => updateProgress(quest.id, parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{quest.progress}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Quest Card */}
          <Card className="card-shadow border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
            <CardContent className="flex items-center justify-center h-full min-h-[400px]">
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="h-auto p-8 flex-col space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-gray-700">Create New Quest</h3>
                      <p className="text-sm text-gray-500">Set your next 90-day goal</p>
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5" />
                      <span>Create Quarterly Quest</span>
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quest Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Launch My Side Business" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="quarter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quarter</FormLabel>
                              <FormControl>
                                <select {...field} className="w-full p-2 border rounded-md">
                                  {quarters.map(q => (
                                    <option key={q} value={q}>{q}</option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Year</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={2024} 
                                  max={2030}
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || currentYear)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="goal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Target className="w-4 h-4 text-green-600" />
                              <span>Goal - What do you want to achieve?</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Be specific about what success looks like in 90 days..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="plan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span>Plan - How will you get there?</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Break down the major milestones and steps needed..."
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="systems"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4 text-purple-600" />
                              <span>Systems - What daily habits will support this?</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What routines, habits, or systems will make this inevitable?"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-4 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                          {createMutation.isPending ? "Creating..." : "Create Quest"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Next Step */}
        {hasActiveQuests && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Quests Activated!</h3>
                  <p className="text-green-700">Ready to break these down into weekly plans and daily actions.</p>
                </div>
                <Button 
                  onClick={() => navigate("/weekly-planning")}
                  className="ml-auto"
                >
                  Start Weekly Planning
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}