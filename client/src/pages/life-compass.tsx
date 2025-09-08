import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Compass, Plus, X, ArrowRight, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { showSuccessNotification, showErrorNotification } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import type { VisionPlan } from "@shared/schema";
import AppLayout from "@/components/layout/AppLayout";

const visionFormSchema = z.object({
  coreValues: z.array(z.string()).min(3, "At least 3 core values are required"),
  threeYearVision: z.string().min(50, "Vision must be at least 50 characters"),
  whyEngine: z.string().min(30, "Purpose must be at least 30 characters"),
});

type VisionFormData = z.infer<typeof visionFormSchema>;

export default function LifeCompassPage() {
  const [newValue, setNewValue] = useState("");
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const { data: visionPlan, isLoading } = useQuery<VisionPlan>({
    queryKey: ["/api/vision"],
    retry: false,
  });

  const { data: user } = useQuery<{id: string}>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const form = useForm<VisionFormData>({
    resolver: zodResolver(visionFormSchema),
    defaultValues: {
      coreValues: [],
      threeYearVision: "",
      whyEngine: "",
    },
  });

  useEffect(() => {
    if (visionPlan) {
      form.reset({
        coreValues: visionPlan.coreValues || [],
        threeYearVision: visionPlan.threeYearVision || "",
        whyEngine: visionPlan.whyEngine || "",
      });
    }
  }, [visionPlan, form]);

  const mutation = useMutation({
    mutationFn: async (data: VisionFormData) => {
      await apiRequest("POST", "/api/vision", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vision"] });
      showSuccessNotification('life_compass');
      toast({
        title: "Life Compass Saved!",
        description: "Your foundation is set. Let's create your vision board next.",
      });
      setTimeout(() => {
        navigate("/vision-board");
      }, 2000);
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
      await showErrorNotification('life_compass', error, user?.id);
    },
  });

  const onSubmit = (data: VisionFormData) => {
    mutation.mutate(data);
  };

  const addCoreValue = () => {
    if (newValue.trim()) {
      const currentValues = form.getValues("coreValues");
      if (!currentValues.includes(newValue.trim())) {
        form.setValue("coreValues", [...currentValues, newValue.trim()]);
        setNewValue("");
      }
    }
  };

  const removeCoreValue = (index: number) => {
    const currentValues = form.getValues("coreValues");
    form.setValue("coreValues", currentValues.filter((_, i) => i !== index));
  };

  const isComplete = !!(visionPlan?.coreValues?.length && visionPlan.coreValues.length >= 3 && visionPlan?.threeYearVision && visionPlan?.whyEngine);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Life Compass</h1>
            {isComplete && (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            )}
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Define your core foundation: values that guide you, vision that inspires you, and purpose that drives you.
          </p>
        </div>

        {/* Main Form */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-xl">Build Your Foundation</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Core Values */}
                <FormField
                  control={form.control}
                  name="coreValues"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Core Values</FormLabel>
                      <p className="text-sm text-gray-600 mb-3">
                        What principles are most important to you? These will guide every decision you make.
                      </p>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg min-h-[60px]">
                          {field.value.map((value, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1"
                            >
                              {value}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-blue-200"
                                onClick={() => removeCoreValue(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </Badge>
                          ))}
                          {field.value.length === 0 && (
                            <p className="text-gray-400 text-sm">Add your core values...</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Growth, Family, Integrity"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCoreValue())}
                            className="flex-1"
                          />
                          <Button type="button" onClick={addCoreValue} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Need at least 3 values. Current: {field.value.length}
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 3-Year Vision */}
                <FormField
                  control={form.control}
                  name="threeYearVision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">3-Year Vision</FormLabel>
                      <p className="text-sm text-gray-600 mb-3">
                        Paint a vivid picture of your life in 3 years. Be specific about what success looks like.
                      </p>
                      <FormControl>
                        <Textarea 
                          placeholder="In 3 years, I see myself living in a home that reflects my values, working in a career that energizes me, surrounded by meaningful relationships..."
                          rows={5}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        Characters: {field.value.length}/50 minimum
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Why Engine */}
                <FormField
                  control={form.control}
                  name="whyEngine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Why Engine</FormLabel>
                      <p className="text-sm text-gray-600 mb-3">
                        What deeper purpose drives you? This is your "why" that will fuel you through challenges.
                      </p>
                      <FormControl>
                        <Textarea 
                          placeholder="I am driven by the desire to create meaningful impact, to grow into the person I'm meant to become, and to leave a legacy that..."
                          rows={4}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        Characters: {field.value.length}/30 minimum
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button type="submit" disabled={mutation.isPending} size="lg" className="px-8">
                    {mutation.isPending ? (
                      "Saving..."
                    ) : isComplete ? (
                      <>Update Foundation</>
                    ) : (
                      <>
                        Save & Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        {isComplete && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Foundation Complete!</h3>
                  <p className="text-green-700">Ready to create your vision board and set quarterly goals.</p>
                </div>
                <Button 
                  onClick={() => navigate("/vision-board")}
                  className="ml-auto"
                >
                  Next: Vision Board
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