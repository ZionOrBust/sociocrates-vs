import { pgTable, varchar, text, timestamp, boolean, integer, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'participant', 'observer']);
export const proposalStatusEnum = pgEnum('proposal_status', ['draft', 'active', 'pending_consent', 'resolved', 'archived']);
export const objectionSeverityEnum = pgEnum('objection_severity', ['minor_concern', 'major_concern', 'deal_breaker']);
export const consentChoiceEnum = pgEnum('consent_choice', ['consent', 'consent_with_reservations', 'withhold_consent']);
export const processStepEnum = pgEnum('process_step', [
  'proposal_presentation',
  'clarifying_questions', 
  'quick_reactions',
  'objections_round',
  'resolve_objections',
  'consent_round',
  'record_outcome'
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default('participant').notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Circles (committees/subcommittees)
export const circles = pgTable("circles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Circle memberships (many-to-many relationship)
export const circleMemberships = pgTable("circle_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  circleId: uuid("circle_id").references(() => circles.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: userRoleEnum("role").default('participant').notNull(), // Can override user's global role within this circle
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Step timing configurations 
export const stepTimings = pgTable("step_timings", {
  id: uuid("id").primaryKey().defaultRandom(),
  circleId: uuid("circle_id").references(() => circles.id).notNull(),
  proposalPresentation: integer("proposal_presentation").default(300).notNull(), // seconds
  clarifyingQuestions: integer("clarifying_questions").default(600).notNull(),
  quickReactions: integer("quick_reactions").default(300).notNull(),
  objectionsRound: integer("objections_round").default(600).notNull(),
  resolveObjections: integer("resolve_objections").default(900).notNull(),
  consentRound: integer("consent_round").default(300).notNull(),
  recordOutcome: integer("record_outcome").default(180).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Proposals
export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  circleId: uuid("circle_id").references(() => circles.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  status: proposalStatusEnum("status").default('draft').notNull(),
  currentStep: processStepEnum("current_step").default('proposal_presentation'),
  stepStartTime: timestamp("step_start_time"),
  stepEndTime: timestamp("step_end_time"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Clarifying questions
export const clarifyingQuestions = pgTable("clarifying_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").references(() => proposals.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  question: text("question").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quick reactions
export const quickReactions = pgTable("quick_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").references(() => proposals.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  reaction: varchar("reaction", { length: 300 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Objections
export const objections = pgTable("objections", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").references(() => proposals.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  objection: text("objection").notNull(),
  severity: objectionSeverityEnum("severity").notNull(),
  isResolved: boolean("is_resolved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Objection resolutions
export const objectionResolutions = pgTable("objection_resolutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  objectionId: uuid("objection_id").references(() => objections.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  solution: text("solution").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Consent responses
export const consentResponses = pgTable("consent_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").references(() => proposals.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  choice: consentChoiceEnum("choice").notNull(),
  reason: text("reason"), // Required if withholding consent or consenting with reservations
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Process logs (for audit trail)
export const processLogs = pgTable("process_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").references(() => proposals.id).notNull(),
  step: processStepEnum("step").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  userId: uuid("user_id").references(() => users.id),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  proposals: many(proposals),
  circleMemberships: many(circleMemberships),
  clarifyingQuestions: many(clarifyingQuestions),
  quickReactions: many(quickReactions),
  objections: many(objections),
  objectionResolutions: many(objectionResolutions),
  consentResponses: many(consentResponses),
}));

export const circlesRelations = relations(circles, ({ one, many }) => ({
  createdBy: one(users, { fields: [circles.createdBy], references: [users.id] }),
  memberships: many(circleMemberships),
  proposals: many(proposals),
  stepTimings: many(stepTimings),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  createdBy: one(users, { fields: [proposals.createdBy], references: [users.id] }),
  circle: one(circles, { fields: [proposals.circleId], references: [circles.id] }),
  clarifyingQuestions: many(clarifyingQuestions),
  quickReactions: many(quickReactions),
  objections: many(objections),
  consentResponses: many(consentResponses),
  processLogs: many(processLogs),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const insertCircleSchema = createInsertSchema(circles);
export const selectCircleSchema = createSelectSchema(circles);
export type Circle = typeof circles.$inferSelect;
export type InsertCircle = typeof circles.$inferInsert;

export const insertProposalSchema = createInsertSchema(proposals);
export const selectProposalSchema = createSelectSchema(proposals);
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

export const insertClarifyingQuestionSchema = createInsertSchema(clarifyingQuestions);
export type ClarifyingQuestion = typeof clarifyingQuestions.$inferSelect;
export type InsertClarifyingQuestion = typeof clarifyingQuestions.$inferInsert;

export const insertQuickReactionSchema = createInsertSchema(quickReactions);
export type QuickReaction = typeof quickReactions.$inferSelect;
export type InsertQuickReaction = typeof quickReactions.$inferInsert;

export const insertObjectionSchema = createInsertSchema(objections);
export type Objection = typeof objections.$inferSelect;
export type InsertObjection = typeof objections.$inferInsert;

export const insertConsentResponseSchema = createInsertSchema(consentResponses);
export type ConsentResponse = typeof consentResponses.$inferSelect;
export type InsertConsentResponse = typeof consentResponses.$inferInsert;
