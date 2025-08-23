import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Target, Plus, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { QuarterlyQuest } from "@shared/schema";

const questFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  goal: z.string().min(10, "Goal must be at least 10 characters"),
  plan: z.string().min(10, "Plan must be at least 10 characters"),
  systems: z.string().min(10, "Systems must be at least 10 characters"),
  quarter: z.string().min(1, "Quarter is required"),
  year: z.number().min(2020).max(2050),
});

type QuestFormData = z.infer<typeof questFormSchema>;

export default function QuarterlyQuestTracker() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  
  const currentYear = new Date().getFullYear();
  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;

  const { data: quests, isLoading } = useQuery<QuarterlyQuest[]>({
    queryKey: ["/api/quarterly-quests"],
    retry: false,
  });

  const activeQuest = quests?.find((quest) => quest.isActive);

  const form = useForm<QuestFormData>({
    resolver: zodResolver(questFormSchema),
    defaultValues: {
      title: "",
      goal: "",
      plan: "",
      systems: "",
      quarter: currentQuarter,
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
      toast({
        title: "Success",
        description: "Quarterly quest created successfully",
      });
    },
    onError: (error) => {
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
      toast({
        title: "Error",
        description: "Failed to create quarterly quest",
        variant: "destructive",
      });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      await apiRequest("PATCH", `/api/quarterly-quests/${id}`, { progress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quarterly-quests"] });
    },
    onError: (error) => {
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
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuestFormData) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="text-primary mr-2 w-5 h-5" />
            Quarterly Quest
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Target className="text-primary mr-2 w-5 h-5" />
            Quarterly Quest
          </CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {activeQuest ? `${activeQuest.quarter} ${activeQuest.year}` : currentQuarter + " " + currentYear}
            </span>
            {!activeQuest && (
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm"
                    style={{ backgroundColor: '#1E3442', color: 'white', borderColor: '#1E3442' }}
                    className="hover:opacity-90"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Quarterly Quest</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quest Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Reach $5K Monthly Revenue" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="quarter"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quarter</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
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
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="goal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Goal</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What specific outcome do you want to achieve?"
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="plan"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plan</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What steps will you take to achieve this goal?"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="systems"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Systems</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What recurring habits and systems will support this goal?"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending}
                          style={{ backgroundColor: '#1E3442', color: 'white', borderColor: '#1E3442' }}
                          className="hover:opacity-90"
                        >
                          {createMutation.isPending ? "Creating..." : "Create Quest"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeQuest ? (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-foreground">{activeQuest.title}</h3>
                <span className="text-xs text-secondary font-medium">
                  {activeQuest.progress}% Complete
                </span>
              </div>
              <Progress value={activeQuest.progress} className="mb-3" />
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Goal:</span>
                  <p className="text-muted-foreground mt-1">{activeQuest.goal}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Plan:</span>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{activeQuest.plan}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Systems:</span>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{activeQuest.systems}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Update Progress:</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    className="w-20"
                    defaultValue={activeQuest.progress || 0}
                    onBlur={(e) => {
                      const progress = parseInt(e.target.value);
                      if (progress !== activeQuest.progress && progress >= 0 && progress <= 100) {
                        updateProgressMutation.mutate({ id: activeQuest.id, progress });
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Active Quest</h3>
            <p className="text-muted-foreground mb-4">Create your first quarterly quest to start tracking your 90-day goals.</p>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button
                  style={{ backgroundColor: '#1E3442', color: 'white', borderColor: '#1E3442' }}
                  className="hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quest
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
