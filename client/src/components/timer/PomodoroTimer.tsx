import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Play, Pause, Square, RotateCcw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

type TimerType = "work" | "break";

interface PomodoroTimerProps {
  taskId?: string;
  taskTitle?: string;
}

export default function PomodoroTimer({ taskId, taskTitle }: PomodoroTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [timerType, setTimerType] = useState<TimerType>("work");
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(taskId || null);
  const [currentTaskTitle, setCurrentTaskTitle] = useState<string>(taskTitle || "");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const workDuration = 25 * 60; // 25 minutes
  const breakDuration = 5 * 60; // 5 minutes

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: stats } = useQuery<{
    totalFocusTime: number;
    completedPomodoros: number;
    averageSessionLength: number;
  }>({
    queryKey: ["/api/pomodoro-sessions/stats", { date: today }],
    retry: false,
  });

  const completePomodoroMutation = useMutation({
    mutationFn: async (data: {
      taskId?: string;
      duration: number;
      type: TimerType;
    }) => {
      await apiRequest("POST", "/api/pomodoro-sessions", {
        ...data,
        completedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pomodoro-sessions/stats"] });
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

  useEffect(() => {
    if (taskId && taskTitle) {
      setCurrentTaskId(taskId);
      setCurrentTaskTitle(taskTitle);
    }
  }, [taskId, taskTitle]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Play notification sound (browser notification)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(
        timerType === "work" ? "Work session complete!" : "Break time over!",
        {
          body: timerType === "work" 
            ? "Time for a 5-minute break" 
            : "Ready for another work session?",
          icon: "/favicon.ico",
        }
      );
    }

    // Save session to database
    const duration = timerType === "work" ? workDuration : breakDuration;
    completePomodoroMutation.mutate({
      taskId: currentTaskId || undefined,
      duration,
      type: timerType,
    });

    toast({
      title: timerType === "work" ? "Work Session Complete!" : "Break Time Over!",
      description: timerType === "work" 
        ? "Great job! Time for a break." 
        : "Ready for another focused session?",
    });

    // Switch timer type and reset
    const nextType = timerType === "work" ? "break" : "work";
    setTimerType(nextType);
    setTimeLeft(nextType === "work" ? workDuration : breakDuration);
  };

  const toggleTimer = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setIsRunning(!isRunning);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setTimeLeft(timerType === "work" ? workDuration : breakDuration);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimerType("work");
    setTimeLeft(workDuration);
    setCurrentTaskId(null);
    setCurrentTaskTitle("");
  };

  const switchTimerType = (type: TimerType) => {
    setIsRunning(false);
    setTimerType(type);
    setTimeLeft(type === "work" ? workDuration : breakDuration);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = () => {
    const total = timerType === "work" ? workDuration : breakDuration;
    return ((total - timeLeft) / total) * 100;
  };

  return (
    <Card className="card-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Clock className="text-accent mr-2 w-5 h-5" />
            Pomodoro Timer
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => switchTimerType("work")}
              disabled={isRunning}
              style={{ backgroundColor: '#1E3442', color: 'white', borderColor: '#1E3442' }}
              className="hover:opacity-90"
            >
              25 min
            </Button>
            <Button
              size="sm"
              onClick={() => switchTimerType("break")}
              disabled={isRunning}
              style={{ backgroundColor: '#1E3442', color: 'white', borderColor: '#1E3442' }}
              className="hover:opacity-90"
            >
              5 min
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={timerType === "work" ? "#8B5CF6" : "#10B981"}
                strokeWidth="3"
                strokeDasharray={`${getProgress()}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground">
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {timerType === "work" 
                ? currentTaskTitle 
                  ? `Working on: ${currentTaskTitle}`
                  : "Focus Session"
                : "Break Time"
              }
            </p>
            <div className="flex items-center justify-center space-x-3">
              <Button
                onClick={toggleTimer}
                className={timerType === "work" ? "bg-accent hover:bg-accent/90" : "bg-secondary hover:bg-secondary/90"}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
              <Button 
                onClick={stopTimer}
                style={{ backgroundColor: '#1E3442', color: 'white', borderColor: '#1E3442' }}
                className="hover:opacity-90"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
              <Button 
                onClick={resetTimer}
                style={{ backgroundColor: '#1E3442', color: 'white', borderColor: '#1E3442' }}
                className="hover:opacity-90"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today's Focus Time</span>
            <span className="font-medium text-foreground">
              {stats?.totalFocusTime ? `${Math.floor(stats.totalFocusTime / 60)}h ${stats.totalFocusTime % 60}m` : "0h 0m"}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Pomodoros Completed</span>
            <span className="font-medium text-secondary">
              {stats?.completedPomodoros || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
