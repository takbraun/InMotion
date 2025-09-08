import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type BlockType = 'life_compass' | 'weekly_planning' | 'quarterly_quest' | 'todays_focus' | 'daily_reflection';

const blockTitles: Record<BlockType, string> = {
  life_compass: 'Life Compass',
  weekly_planning: 'Weekly Planning',
  quarterly_quest: 'Quarterly Quest',
  todays_focus: "Today's Focus",
  daily_reflection: 'Daily Reflection'
};

interface ErrorDetails {
  blockType: BlockType;
  error: Error | unknown;
  userId?: string;
  additionalContext?: Record<string, any>;
}

export async function logError({ blockType, error, userId, additionalContext }: ErrorDetails) {
  try {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    await apiRequest("POST", "/api/error-logs", {
      blockType,
      errorMessage,
      errorStack,
      errorDetails: {
        ...additionalContext,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
      userId,
    });
  } catch (logError) {
    // Silently fail error logging to prevent infinite loops
    console.error('Failed to log error:', logError);
  }
}

export function showSuccessNotification(blockType: BlockType) {
  const blockTitle = blockTitles[blockType];
  toast({
    variant: "success",
    title: "Success",
    description: `Your ${blockTitle} is saved.`,
  });
}

export async function showErrorNotification(blockType: BlockType, error: Error | unknown, userId?: string, additionalContext?: Record<string, any>) {
  const blockTitle = blockTitles[blockType];
  
  // Log error to database
  await logError({ blockType, error, userId, additionalContext });
  
  // Show user-friendly error message
  toast({
    variant: "destructive",
    title: "Error",
    description: `${blockTitle} could not be saved. Please try again later.`,
  });
}

export function showDeleteSuccessNotification(itemType: string) {
  toast({
    variant: "success",
    title: "Success",
    description: `${itemType} deleted successfully.`,
  });
}

export async function showDeleteErrorNotification(itemType: string, error: Error | unknown, userId?: string) {
  // Log error to database
  await logError({ 
    blockType: 'todays_focus', // Default for delete operations
    error, 
    userId, 
    additionalContext: { operation: 'delete', itemType }
  });
  
  toast({
    variant: "destructive", 
    title: "Error",
    description: `Failed to delete ${itemType.toLowerCase()}. Please try again later.`,
  });
}