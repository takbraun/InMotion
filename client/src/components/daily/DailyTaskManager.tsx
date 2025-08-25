import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { CheckCircle, Plus, Play } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { showSuccessNotification, showErrorNotification, showDeleteSuccessNotification, showDeleteErrorNotification } from "@/lib/notifications";
import type { DailyTask } from "@shared/schema";
import { format } from "date-fns";

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  impact: z.enum(["high", "medium", "low"]),
  date: z.string(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface DailyTaskManagerProps {
  onStartPomodoro?: (taskId: string, taskTitle: string) => void;
}

export default function DailyTaskManager({ onStartPomodoro }: DailyTaskManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { toast } = useToast();

  const { data: user } = useQuery<{id: string}>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: tasks, isLoading } = useQuery<DailyTask[]>({
    queryKey: ["/api/daily-tasks", { date: selectedDate }],
    retry: false,
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      impact: "medium",
      date: selectedDate,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      await apiRequest("POST", "/api/daily-tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      setIsCreating(false);
      form.reset({
        title: "",
        description: "",
        impact: "medium",
        date: selectedDate,
      });
      showSuccessNotification('todays_focus');
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
      await showErrorNotification('todays_focus', error, user?.id);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      await apiRequest("PATCH", `/api/daily-tasks/${id}`, { 
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/daily-tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-tasks"] });
      showDeleteSuccessNotification("task");
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
      await showDeleteErrorNotification("task", error, user?.id);
    },
  });

  const onSubmit = (data: TaskFormData) => {
    createMutation.mutate(data);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-500";
    }
  };

  const getImpactBorder = (impact: string, isCompleted: boolean) => {
    if (isCompleted) return "border-secondary";
    switch (impact) {
      case "high":
        return "border-red-300";
      case "medium":
        return "border-yellow-300";
      case "low":
        return "border-green-300";
      default:
        return "border-gray-300";
    }
  };

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="text-secondary mr-2 w-5 h-5" />
            Today's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
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
            <CheckCircle className="text-secondary mr-2 w-5 h-5" />
            Today's Focus
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
              style={{ 
                backgroundColor: '#1E3442', 
                color: 'white', 
                borderColor: '#1E3442',
                cursor: 'pointer'
              }}
            />
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button 
                  size="sm"
                  style={{ backgroundColor: '#1E3442', color: 'white', borderColor: '#1E3442' }}
                  className="hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Title</FormLabel>
                          <FormControl>
                            <Input placeholder="What needs to be done?" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add more details about this task..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="impact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Impact Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select impact level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high">High Impact</SelectItem>
                              <SelectItem value="medium">Medium Impact</SelectItem>
                              <SelectItem value="low">Low Impact</SelectItem>
                            </SelectContent>
                          </Select>
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
                        {createMutation.isPending ? "Creating..." : "Create Task"}
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
        <div className="space-y-3">
          {tasks?.length ? (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted transition-colors ${getImpactBorder(task.impact, task.isCompleted || false)}`}
              >
                <Checkbox
                  checked={task.isCompleted || false}
                  onCheckedChange={(checked) => {
                    toggleMutation.mutate({ id: task.id, isCompleted: !!checked });
                  }}
                />
                <div className="flex-1">
                  <p className={`text-foreground font-medium ${task.isCompleted ? 'line-through' : ''}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs ${getImpactColor(task.impact)}`}>
                      {task.impact.charAt(0).toUpperCase() + task.impact.slice(1)} Impact
                    </span>
                    <span className="text-xs text-secondary">
                      {task.pomodoroCount} Pomodoro{task.pomodoroCount !== 1 ? 's' : ''} completed
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStartPomodoro?.(task.id, task.title)}
                    disabled={task.isCompleted || false}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(task.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No tasks for today</h3>
              <p className="text-muted-foreground mb-4">Add your first task to start focusing on what matters.</p>
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button
                    style={{ backgroundColor: '#1E3442', color: 'white', borderColor: '#1E3442' }}
                    className="hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Task
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
