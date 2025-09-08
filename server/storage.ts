import { 
  users, 
  visionPlans,
  quarterlyQuests,
  weeklyPlans,
  dailyTasks,
  pomodoroSessions,
  dailyReflections,
  errorLogs,
  type User, 
  type UpsertUser,
  type VisionPlan,
  type InsertVisionPlan,
  type QuarterlyQuest,
  type InsertQuarterlyQuest,
  type WeeklyPlan,
  type InsertWeeklyPlan,
  type DailyTask,
  type InsertDailyTask,
  type PomodoroSession,
  type InsertPomodoroSession,
  type DailyReflection,
  type InsertDailyReflection,
  type ErrorLog,
  type InsertErrorLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Vision plan methods
  getVisionPlan(userId: string): Promise<VisionPlan | undefined>;
  upsertVisionPlan(visionPlan: InsertVisionPlan): Promise<VisionPlan>;
  
  // Quarterly quest methods
  getQuarterlyQuests(userId: string): Promise<QuarterlyQuest[]>;
  createQuarterlyQuest(quest: InsertQuarterlyQuest): Promise<QuarterlyQuest>;
  updateQuarterlyQuest(questId: string, userId: string, updates: Partial<QuarterlyQuest>): Promise<QuarterlyQuest>;
  
  // Weekly plan methods
  getWeeklyPlans(userId: string, weekStart?: string): Promise<WeeklyPlan[]>;
  createWeeklyPlan(plan: InsertWeeklyPlan): Promise<WeeklyPlan>;
  updateWeeklyPlan(planId: string, userId: string, updates: Partial<WeeklyPlan>): Promise<WeeklyPlan>;
  
  // Daily task methods
  getDailyTasks(userId: string, date?: string): Promise<DailyTask[]>;
  createDailyTask(task: InsertDailyTask): Promise<DailyTask>;
  updateDailyTask(taskId: string, userId: string, updates: Partial<DailyTask>): Promise<DailyTask>;
  deleteDailyTask(taskId: string, userId: string): Promise<void>;
  
  // Pomodoro session methods
  createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession>;
  getPomodoroStats(userId: string, date?: string): Promise<{
    totalFocusTime: number;
    completedPomodoros: number;
    averageSessionLength: number;
  }>;
  
  // Daily reflection methods
  getDailyReflection(userId: string, date: string): Promise<DailyReflection | undefined>;
  upsertDailyReflection(reflection: InsertDailyReflection): Promise<DailyReflection>;
  
  // Error logging methods
  createErrorLog(errorLog: InsertErrorLog): Promise<ErrorLog>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const [result] = await db
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          updatedAt: sql`now()`,
        },
      })
      .returning();
    return result;
  }

  // Vision plan methods
  async getVisionPlan(userId: string): Promise<VisionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(visionPlans)
      .where(eq(visionPlans.userId, userId));
    return plan || undefined;
  }

  async upsertVisionPlan(visionPlan: InsertVisionPlan): Promise<VisionPlan> {
    const existing = await this.getVisionPlan(visionPlan.userId);
    
    if (existing) {
      const [updated] = await db
        .update(visionPlans)
        .set({
          ...visionPlan,
          updatedAt: sql`now()`,
        })
        .where(eq(visionPlans.userId, visionPlan.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(visionPlans)
        .values(visionPlan)
        .returning();
      return created;
    }
  }

  // Quarterly quest methods
  async getQuarterlyQuests(userId: string): Promise<QuarterlyQuest[]> {
    return await db
      .select()
      .from(quarterlyQuests)
      .where(eq(quarterlyQuests.userId, userId));
  }

  async createQuarterlyQuest(quest: InsertQuarterlyQuest): Promise<QuarterlyQuest> {
    const [created] = await db
      .insert(quarterlyQuests)
      .values(quest)
      .returning();
    return created;
  }

  async updateQuarterlyQuest(questId: string, userId: string, updates: Partial<QuarterlyQuest>): Promise<QuarterlyQuest> {
    const [updated] = await db
      .update(quarterlyQuests)
      .set({
        ...updates,
        updatedAt: sql`now()`,
      })
      .where(and(eq(quarterlyQuests.id, questId), eq(quarterlyQuests.userId, userId)))
      .returning();
    return updated;
  }

  // Weekly plan methods
  async getWeeklyPlans(userId: string, weekStart?: string): Promise<WeeklyPlan[]> {
    if (weekStart) {
      return await db
        .select()
        .from(weeklyPlans)
        .where(and(eq(weeklyPlans.userId, userId), eq(weeklyPlans.weekStartDate, weekStart)));
    } else {
      return await db
        .select()
        .from(weeklyPlans)
        .where(eq(weeklyPlans.userId, userId));
    }
  }

  async createWeeklyPlan(plan: InsertWeeklyPlan): Promise<WeeklyPlan> {
    const [created] = await db
      .insert(weeklyPlans)
      .values(plan)
      .returning();
    return created;
  }

  async updateWeeklyPlan(planId: string, userId: string, updates: Partial<WeeklyPlan>): Promise<WeeklyPlan> {
    const [updated] = await db
      .update(weeklyPlans)
      .set({
        ...updates,
        updatedAt: sql`now()`,
      })
      .where(and(eq(weeklyPlans.id, planId), eq(weeklyPlans.userId, userId)))
      .returning();
    return updated;
  }

  // Daily task methods
  async getDailyTasks(userId: string, date?: string): Promise<DailyTask[]> {
    if (date) {
      return await db
        .select()
        .from(dailyTasks)
        .where(and(eq(dailyTasks.userId, userId), eq(dailyTasks.date, date)));
    } else {
      return await db
        .select()
        .from(dailyTasks)
        .where(eq(dailyTasks.userId, userId));
    }
  }

  async createDailyTask(task: InsertDailyTask): Promise<DailyTask> {
    const [created] = await db
      .insert(dailyTasks)
      .values(task)
      .returning();
    return created;
  }

  async updateDailyTask(taskId: string, userId: string, updates: Partial<DailyTask>): Promise<DailyTask> {
    const updateData: any = {
      ...updates,
      updatedAt: sql`now()`,
    };
    
    // Handle completion timestamp
    if (updates.isCompleted !== undefined) {
      updateData.completedAt = updates.isCompleted ? sql`now()` : null;
    }
    
    const [updated] = await db
      .update(dailyTasks)
      .set(updateData)
      .where(and(eq(dailyTasks.id, taskId), eq(dailyTasks.userId, userId)))
      .returning();
    return updated;
  }

  async deleteDailyTask(taskId: string, userId: string): Promise<void> {
    await db
      .delete(dailyTasks)
      .where(and(eq(dailyTasks.id, taskId), eq(dailyTasks.userId, userId)));
  }

  // Pomodoro session methods
  async createPomodoroSession(session: InsertPomodoroSession): Promise<PomodoroSession> {
    const [created] = await db
      .insert(pomodoroSessions)
      .values(session)
      .returning();
    return created;
  }

  async getPomodoroStats(userId: string, date?: string): Promise<{
    totalFocusTime: number;
    completedPomodoros: number;
    averageSessionLength: number;
  }> {
    let sessions;
    
    if (date) {
      sessions = await db
        .select({
          duration: pomodoroSessions.duration,
          type: pomodoroSessions.type,
        })
        .from(pomodoroSessions)
        .where(and(eq(pomodoroSessions.userId, userId), sql`DATE(${pomodoroSessions.completedAt}) = ${date}`));
    } else {
      sessions = await db
        .select({
          duration: pomodoroSessions.duration,
          type: pomodoroSessions.type,
        })
        .from(pomodoroSessions)
        .where(eq(pomodoroSessions.userId, userId));
    }
    const workSessions = sessions.filter(s => s.type === 'work');
    
    const totalFocusTime = workSessions.reduce((sum, session) => sum + session.duration, 0);
    const completedPomodoros = workSessions.length;
    const averageSessionLength = completedPomodoros > 0 ? Math.round(totalFocusTime / completedPomodoros) : 0;
    
    return {
      totalFocusTime,
      completedPomodoros,
      averageSessionLength,
    };
  }

  // Daily reflection methods
  async getDailyReflection(userId: string, date: string): Promise<DailyReflection | undefined> {
    const [reflection] = await db
      .select()
      .from(dailyReflections)
      .where(and(eq(dailyReflections.userId, userId), eq(dailyReflections.date, date)));
    return reflection || undefined;
  }

  async upsertDailyReflection(reflection: InsertDailyReflection): Promise<DailyReflection> {
    const existing = await this.getDailyReflection(reflection.userId, reflection.date);
    
    if (existing) {
      const [updated] = await db
        .update(dailyReflections)
        .set({
          ...reflection,
          updatedAt: sql`now()`,
        })
        .where(and(eq(dailyReflections.userId, reflection.userId), eq(dailyReflections.date, reflection.date)))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(dailyReflections)
        .values(reflection)
        .returning();
      return created;
    }
  }

  // Error logging methods
  async createErrorLog(errorLog: InsertErrorLog): Promise<ErrorLog> {
    const [result] = await db
      .insert(errorLogs)
      .values(errorLog)
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();