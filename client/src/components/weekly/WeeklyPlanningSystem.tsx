import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Calendar, ChevronRight, Edit, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { WeeklyPlan } from "@shared/schema";
import { format, startOfWeek, addDays } from "date-fns";

const prioritySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  isCompleted: z.boolean().default(false),
});

const weeklyPlanSchema = z.object({
  priorities: z.array(prioritySchema).max(3, "Maximum 3 priorities allowed"),
  reflection: z.object({
    wentWell: z.string().optional(),
    toImprove: z.string().optional(),
  }).optional(),
});

type WeeklyPlanData = z.infer<typeof weeklyPlanSchema>;

export default function WeeklyPlanningSystem() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const { toast } = useToast();

  const weekStartString = format(currentWeekStart, "yyyy-MM-dd");
  const weekEndString = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

  const { data: weeklyPlans, isLoading } = useQuery<WeeklyPlan[]>({
    queryKey: ["/api/weekly-plans", { weekStart: weekStartString }],
    retry: false,
  });

  const currentPlan = weeklyPlans?.[0];

  const form = useForm<WeeklyPlanData>({
    resolver: zodResolver(weeklyPlanSchema),
    defaultValues: {
      priorities: [
        { title: "", description: "", isCompleted: false },
        { title: "", description: "", isCompleted: false },
        { title: "", description: "", isCompleted: false },
      ],
      reflection: { wentWell: "", toImprove: "" },
    },
  });

  useEffect(() => {
    if (currentPlan) {
      const priorities = Array.isArray(currentPlan.priorities) 
        ? currentPlan.priorities.slice(0, 3).concat(
            Array(3 - currentPlan.priorities.length).fill({ title: "", description: "", isCompleted: false })
          )
        : [
            { title: "", description: "", isCompleted: false },
            { title: "", description: "", isCompleted: false },
            { title: "", description: "", isCompleted: false },
          ];
      
      const reflection = currentPlan.reflection && typeof currentPlan.reflection === 'object'
        ? currentPlan.reflection
        : { wentWell: "", toImprove: "" };
      
      form.reset({
        priorities,
        reflection,
      });
    }
  }, [currentPlan, form]);

  const mutation = useMutation({
    mutationFn: async (data: WeeklyPlanData) => {
      if (currentPlan) {
        await apiRequest("PATCH", `/api/weekly-plans/${currentPlan.id}`, data);
      } else {
        await apiRequest("POST", "/api/weekly-plans", {
          ...data,
          weekStartDate: weekStartString,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-plans"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Weekly plan updated successfully",
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
        description: "Failed to update weekly plan",
        variant: "destructive",
      });
    },
  });

  const togglePriorityMutation = useMutation({
    mutationFn: async ({ index, isCompleted }: { index: number; isCompleted: boolean }) => {
      if (!currentPlan) return;
      
      const priorities = Array.isArray(currentPlan.priorities) ? [...currentPlan.priorities] : [];
      if (priorities[index]) {
        priorities[index] = { ...priorities[index], isCompleted };
      }
      
      await apiRequest("PATCH", `/api/weekly-plans/${currentPlan.id}`, {
        priorities,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-plans"] });
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
    },
  });

  const onSubmit = (data: WeeklyPlanData) => {
    mutation.mutate(data);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = addDays(currentWeekStart, direction === "next" ? 7 : -7);
    setCurrentWeekStart(newDate);
  };

  const calculateProgress = () => {
    if (!currentPlan?.priorities || !Array.isArray(currentPlan.priorities)) return 0;
    const completed = currentPlan.priorities.filter((p: any) => p?.isCompleted).length;
    const total = currentPlan.priorities.filter((p: any) => p?.title?.trim()).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="text-primary mr-2 w-5 h-5" />
            Weekly Planning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
            <Calendar className="text-primary mr-2 w-5 h-5" />
            Weekly Planning
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigateWeek("prev")}>
              ←
            </Button>
            <span className="text-xs text-gray-500">
              Week of {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d")}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigateWeek("next")}>
              →
            </Button>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Weekly Plan</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-700 mb-3">Top 3 Priorities</h3>
                      {[0, 1, 2].map((index) => (
                        <div key={index} className="space-y-2 mb-4">
                          <FormField
                            control={form.control}
                            name={`priorities.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    placeholder={`Priority ${index + 1} title`}
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`priorities.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    placeholder="Description (optional)"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-700">Weekly Reflection</h3>
                      <FormField
                        control={form.control}
                        name="reflection.wentWell"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What went well?</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Reflect on your successes this week..."
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="reflection.toImprove"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>What to improve?</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What could be better next week?"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Top 3 Priorities</h3>
            <div className="space-y-3">
              {(Array.isArray(currentPlan?.priorities) ? currentPlan.priorities : []).map((priority: any, index: number) => (
                priority.title && (
                  <div key={index} className="flex items-start space-x-3">
                    <Checkbox
                      checked={priority.isCompleted}
                      onCheckedChange={(checked) => {
                        togglePriorityMutation.mutate({ 
                          index, 
                          isCompleted: checked as boolean 
                        });
                      }}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className={`text-gray-900 font-medium ${priority.isCompleted ? 'line-through' : ''}`}>
                        {priority.title}
                      </p>
                      {priority.description && (
                        <p className="text-gray-500 text-sm">{priority.description}</p>
                      )}
                    </div>
                  </div>
                )
              )) || (
                <p className="text-sm text-gray-500">No priorities set for this week</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-3">Weekly Reflection</h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-1">What went well?</h4>
                <p className="text-sm text-gray-600">
                  {(currentPlan?.reflection as any)?.wentWell || "No reflection yet"}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-1">What to improve?</h4>
                <p className="text-sm text-gray-600">
                  {(currentPlan?.reflection as any)?.toImprove || "No reflection yet"}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Weekly Progress</span>
            <span className="text-sm font-medium text-green-600">
              {calculateProgress()}% complete
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div 
              className="h-full bg-green-500 transition-all duration-300 ease-in-out"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
