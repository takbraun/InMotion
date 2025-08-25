import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertVisionPlanSchema,
  insertQuarterlyQuestSchema,
  insertWeeklyPlanSchema,
  insertDailyTaskSchema,
  insertPomodoroSessionSchema,
  insertDailyReflectionSchema,
  insertErrorLogSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Vision Plan routes
  app.get("/api/vision", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const visionPlan = await storage.getVisionPlan(userId);
      res.json(visionPlan);
    } catch (error) {
      console.error("Error fetching vision plan:", error);
      res.status(500).json({ message: "Failed to fetch vision plan" });
    }
  });

  app.post("/api/vision", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertVisionPlanSchema.parse({ ...req.body, userId });
      const visionPlan = await storage.upsertVisionPlan(validatedData);
      res.json(visionPlan);
    } catch (error) {
      console.error("Error creating/updating vision plan:", error);
      res.status(400).json({ message: "Invalid vision plan data" });
    }
  });

  // Quarterly Quest routes
  app.get("/api/quarterly-quests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quests = await storage.getQuarterlyQuests(userId);
      res.json(quests);
    } catch (error) {
      console.error("Error fetching quarterly quests:", error);
      res.status(500).json({ message: "Failed to fetch quarterly quests" });
    }
  });

  app.post("/api/quarterly-quests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertQuarterlyQuestSchema.parse({ ...req.body, userId });
      const quest = await storage.createQuarterlyQuest(validatedData);
      res.json(quest);
    } catch (error) {
      console.error("Error creating quarterly quest:", error);
      res.status(400).json({ message: "Invalid quarterly quest data" });
    }
  });

  app.patch("/api/quarterly-quests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const questId = req.params.id;
      const updates = req.body;
      const quest = await storage.updateQuarterlyQuest(questId, userId, updates);
      res.json(quest);
    } catch (error) {
      console.error("Error updating quarterly quest:", error);
      res.status(400).json({ message: "Failed to update quarterly quest" });
    }
  });

  // Weekly Plan routes
  app.get("/api/weekly-plans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { weekStart } = req.query;
      const plans = await storage.getWeeklyPlans(userId, weekStart as string);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching weekly plans:", error);
      res.status(500).json({ message: "Failed to fetch weekly plans" });
    }
  });

  app.post("/api/weekly-plans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertWeeklyPlanSchema.parse({ ...req.body, userId });
      const plan = await storage.createWeeklyPlan(validatedData);
      res.json(plan);
    } catch (error) {
      console.error("Error creating weekly plan:", error);
      res.status(400).json({ message: "Invalid weekly plan data" });
    }
  });

  app.patch("/api/weekly-plans/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const planId = req.params.id;
      const updates = req.body;
      const plan = await storage.updateWeeklyPlan(planId, userId, updates);
      res.json(plan);
    } catch (error) {
      console.error("Error updating weekly plan:", error);
      res.status(400).json({ message: "Failed to update weekly plan" });
    }
  });

  // Daily Task routes
  app.get("/api/daily-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.query;
      const tasks = await storage.getDailyTasks(userId, date as string);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching daily tasks:", error);
      res.status(500).json({ message: "Failed to fetch daily tasks" });
    }
  });

  app.post("/api/daily-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertDailyTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createDailyTask(validatedData);
      res.json(task);
    } catch (error) {
      console.error("Error creating daily task:", error);
      res.status(400).json({ message: "Invalid daily task data" });
    }
  });

  app.patch("/api/daily-tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = req.params.id;
      const updates = req.body;
      const task = await storage.updateDailyTask(taskId, userId, updates);
      res.json(task);
    } catch (error) {
      console.error("Error updating daily task:", error);
      res.status(400).json({ message: "Failed to update daily task" });
    }
  });

  app.delete("/api/daily-tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = req.params.id;
      await storage.deleteDailyTask(taskId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting daily task:", error);
      res.status(400).json({ message: "Failed to delete daily task" });
    }
  });

  // Pomodoro Session routes
  app.post("/api/pomodoro-sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertPomodoroSessionSchema.parse({ ...req.body, userId });
      const session = await storage.createPomodoroSession(validatedData);
      res.json(session);
    } catch (error) {
      console.error("Error creating pomodoro session:", error);
      res.status(400).json({ message: "Invalid pomodoro session data" });
    }
  });

  app.get("/api/pomodoro-sessions/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.query;
      const stats = await storage.getPomodoroStats(userId, date as string);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching pomodoro stats:", error);
      res.status(500).json({ message: "Failed to fetch pomodoro stats" });
    }
  });

  // Daily Reflection routes
  app.get("/api/daily-reflections/:date", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const reflection = await storage.getDailyReflection(userId, date);
      res.json(reflection);
    } catch (error) {
      console.error("Error fetching daily reflection:", error);
      res.status(500).json({ message: "Failed to fetch daily reflection" });
    }
  });

  app.post("/api/daily-reflections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertDailyReflectionSchema.parse({ ...req.body, userId });
      const reflection = await storage.upsertDailyReflection(validatedData);
      res.json(reflection);
    } catch (error) {
      console.error("Error creating/updating daily reflection:", error);
      res.status(400).json({ message: "Invalid daily reflection data" });
    }
  });

  // Error logging route
  app.post("/api/error-logs", async (req: any, res) => {
    try {
      const validatedData = insertErrorLogSchema.parse(req.body);
      const errorLog = await storage.createErrorLog(validatedData);
      res.json(errorLog);
    } catch (error) {
      console.error("Error logging error:", error);
      res.status(400).json({ message: "Invalid error log data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
