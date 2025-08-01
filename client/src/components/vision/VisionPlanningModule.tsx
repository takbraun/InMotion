import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Compass, Edit, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { VisionPlan } from "@shared/schema";

const visionFormSchema = z.object({
  coreValues: z.array(z.string()).min(1, "At least one core value is required"),
  threeYearVision: z.string().min(10, "Vision must be at least 10 characters"),
  whyEngine: z.string().min(10, "Purpose must be at least 10 characters"),
});

type VisionFormData = z.infer<typeof visionFormSchema>;

export default function VisionPlanningModule() {
  const [isEditing, setIsEditing] = useState(false);
  const [newValue, setNewValue] = useState("");
  const { toast } = useToast();

  const { data: visionPlan, isLoading } = useQuery<VisionPlan>({
    queryKey: ["/api/vision"],
    retry: false,
  });

  const form = useForm<VisionFormData>({
    resolver: zodResolver(visionFormSchema),
    defaultValues: {
      coreValues: visionPlan?.coreValues || [],
      threeYearVision: visionPlan?.threeYearVision || "",
      whyEngine: visionPlan?.whyEngine || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: VisionFormData) => {
      await apiRequest("POST", "/api/vision", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vision"] });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Vision plan updated successfully",
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
        description: "Failed to update vision plan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VisionFormData) => {
    mutation.mutate(data);
  };

  const addCoreValue = () => {
    if (newValue.trim()) {
      const currentValues = form.getValues("coreValues");
      form.setValue("coreValues", [...currentValues, newValue.trim()]);
      setNewValue("");
    }
  };

  const removeCoreValue = (index: number) => {
    const currentValues = form.getValues("coreValues");
    form.setValue("coreValues", currentValues.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Compass className="text-accent mr-2 w-5 h-5" />
            Life Compass
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
            <Compass className="text-accent mr-2 w-5 h-5" />
            Life Compass
          </CardTitle>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Life Compass</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="coreValues"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Core Values</FormLabel>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((value, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                {value}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0"
                                  onClick={() => removeCoreValue(index)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a core value"
                              value={newValue}
                              onChange={(e) => setNewValue(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCoreValue())}
                            />
                            <Button type="button" onClick={addCoreValue} size="sm">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="threeYearVision"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>3-Year Vision</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your 3-year vision..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="whyEngine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why Engine</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="What drives your purpose and motivation?"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
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
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Core Values</h3>
          <div className="flex flex-wrap gap-2">
            {visionPlan?.coreValues?.length ? (
              visionPlan.coreValues.map((value: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-accent/10 text-accent">
                  {value}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-gray-500">No core values defined yet</p>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-700 mb-2">3-Year Vision</h3>
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            {visionPlan?.threeYearVision || "No vision defined yet"}
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-700 mb-2">Why Engine</h3>
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            {visionPlan?.whyEngine || "No purpose defined yet"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
