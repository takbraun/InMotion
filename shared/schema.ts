import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vision planning data
export const visionPlans = pgTable("vision_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  coreValues: text("core_values").array(),
  threeYearVision: text("three_year_vision"),
  whyEngine: text("why_engine"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quarterly quests (90-day goals)
export const quarterlyQuests = pgTable("quarterly_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  goal: text("goal").notNull(),
  plan: text("plan").notNull(),
  systems: text("systems").notNull(),
  quarter: varchar("quarter").notNull(), // e.g., "Q1 2024"
  year: integer("year").notNull(),
  progress: integer("progress").default(0), // 0-100
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weekly plans
export const weeklyPlans = pgTable("weekly_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quarterlyQuestId: varchar("quarterly_quest_id").references(() => quarterlyQuests.id, { onDelete: "set null" }),
  weekStartDate: date("week_start_date").notNull(),
  priorities: jsonb("priorities"), // Array of priority objects
  reflection: jsonb("reflection"), // Reflection object with went_well, to_improve
  progress: integer("progress").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily tasks
export const dailyTasks = pgTable("daily_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weeklyPlanId: varchar("weekly_plan_id").references(() => weeklyPlans.id, { onDelete: "set null" }),
  title: varchar("title").notNull(),
  description: text("description"),
  impact: varchar("impact").notNull(), // "high", "medium", "low"
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  date: date("date").notNull(),
  pomodoroCount: integer("pomodoro_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pomodoro sessions
export const pomodoroSessions = pgTable("pomodoro_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").references(() => dailyTasks.id, { onDelete: "set null" }),
  duration: integer("duration").notNull(), // in seconds
  type: varchar("type").notNull(), // "work", "break"
  completedAt: timestamp("completed_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily reflections
export const dailyReflections = pgTable("daily_reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  reflection: text("reflection"),
  tomorrowPriority: text("tomorrow_priority"),
  energyLevel: integer("energy_level"), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  visionPlans: many(visionPlans),
  quarterlyQuests: many(quarterlyQuests),
  weeklyPlans: many(weeklyPlans),
  dailyTasks: many(dailyTasks),
  pomodoroSessions: many(pomodoroSessions),
  dailyReflections: many(dailyReflections),
}));

export const visionPlansRelations = relations(visionPlans, ({ one }) => ({
  user: one(users, {
    fields: [visionPlans.userId],
    references: [users.id],
  }),
}));

export const quarterlyQuestsRelations = relations(quarterlyQuests, ({ one, many }) => ({
  user: one(users, {
    fields: [quarterlyQuests.userId],
    references: [users.id],
  }),
  weeklyPlans: many(weeklyPlans),
}));

export const weeklyPlansRelations = relations(weeklyPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [weeklyPlans.userId],
    references: [users.id],
  }),
  quarterlyQuest: one(quarterlyQuests, {
    fields: [weeklyPlans.quarterlyQuestId],
    references: [quarterlyQuests.id],
  }),
  dailyTasks: many(dailyTasks),
}));

export const dailyTasksRelations = relations(dailyTasks, ({ one, many }) => ({
  user: one(users, {
    fields: [dailyTasks.userId],
    references: [users.id],
  }),
  weeklyPlan: one(weeklyPlans, {
    fields: [dailyTasks.weeklyPlanId],
    references: [weeklyPlans.id],
  }),
  pomodoroSessions: many(pomodoroSessions),
}));

export const pomodoroSessionsRelations = relations(pomodoroSessions, ({ one }) => ({
  user: one(users, {
    fields: [pomodoroSessions.userId],
    references: [users.id],
  }),
  task: one(dailyTasks, {
    fields: [pomodoroSessions.taskId],
    references: [dailyTasks.id],
  }),
}));

export const dailyReflectionsRelations = relations(dailyReflections, ({ one }) => ({
  user: one(users, {
    fields: [dailyReflections.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertVisionPlanSchema = createInsertSchema(visionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuarterlyQuestSchema = createInsertSchema(quarterlyQuests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWeeklyPlanSchema = createInsertSchema(weeklyPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyTaskSchema = createInsertSchema(dailyTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertPomodoroSessionSchema = createInsertSchema(pomodoroSessions).omit({
  id: true,
  createdAt: true,
});

export const insertDailyReflectionSchema = createInsertSchema(dailyReflections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// User insert schema
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type VisionPlan = typeof visionPlans.$inferSelect;
export type InsertVisionPlan = z.infer<typeof insertVisionPlanSchema>;
export type QuarterlyQuest = typeof quarterlyQuests.$inferSelect;
export type InsertQuarterlyQuest = z.infer<typeof insertQuarterlyQuestSchema>;
export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type InsertWeeklyPlan = z.infer<typeof insertWeeklyPlanSchema>;
export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertDailyTask = z.infer<typeof insertDailyTaskSchema>;
export type PomodoroSession = typeof pomodoroSessions.$inferSelect;
export type InsertPomodoroSession = z.infer<typeof insertPomodoroSessionSchema>;
export type DailyReflection = typeof dailyReflections.$inferSelect;
export type InsertDailyReflection = z.infer<typeof insertDailyReflectionSchema>;
