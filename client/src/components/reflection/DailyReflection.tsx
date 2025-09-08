import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { BookOpen, Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { showSuccessNotification, showErrorNotification } from "@/lib/notifications";
import type { DailyReflection } from "@shared/schema";
import { format } from "date-fns";

const reflectionFormSchema = z.object({
  reflection: z.string().optional(),
  tomorrowPriority: z.string().optional(),
  energyLevel: z.number().min(1).max(5).optional(),
});

type ReflectionFormData = z.infer<typeof reflectionFormSchema>;

export default function DailyReflection() {
  const { toast } = useToast();
  
  const { data: user } = useQuery<{id: string}>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });
  
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: reflection, isLoading } = useQuery<DailyReflection>({
    queryKey: ["/api/daily-reflections", today],
    retry: false,
  });

  const form = useForm<ReflectionFormData>({
    resolver: zodResolver(reflectionFormSchema),
    defaultValues: {
      reflection: "",
      tomorrowPriority: "",
      energyLevel: 3,
    },
  });

  useEffect(() => {
    if (reflection) {
      form.reset({
        reflection: reflection.reflection || "",
        tomorrowPriority: reflection.tomorrowPriority || "",
        energyLevel: reflection.energyLevel || 3,
      });
    }
  }, [reflection, form]);

  const mutation = useMutation({
    mutationFn: async (data: ReflectionFormData) => {
      await apiRequest("POST", "/api/daily-reflections", {
        ...data,
        date: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-reflections"] });
      showSuccessNotification('daily_reflection');
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
      await showErrorNotification('daily_reflection', error, user?.id);
    },
  });

  const onSubmit = (data: ReflectionFormData) => {
    mutation.mutate(data);
  };

  const renderStars = (currentLevel: number, onSelect: (level: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onSelect(level)}
            className="focus:outline-none"
          >
            <Star
              className={`w-5 h-5 ${
                level <= currentLevel
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="text-neutral mr-2 w-5 h-5" />
            Daily Reflection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="text-neutral mr-2 w-5 h-5" />
          Daily Reflection
        </CardTitle>
      </CardHeader>
      <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="reflection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How did today go?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Reflect on your day, challenges, wins..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tomorrowPriority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tomorrow's priority</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="What's most important tomorrow?"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="energyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Energy Level</FormLabel>
                      <FormControl>
                        <div>
                          {renderStars(field.value || 3, field.onChange)}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
      </CardContent>
    </Card>
  );
}
