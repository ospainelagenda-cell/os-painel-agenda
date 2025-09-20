import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const technicians = pgTable("technicians", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cities: text("cities").array().notNull().default(sql`ARRAY[]::text[]`),
  neighborhoods: text("neighborhoods").array().notNull().default(sql`ARRAY[]::text[]`),
  isActive: boolean("is_active").notNull().default(true),
});

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  technicianIds: text("technician_ids").array().notNull(),
  boxNumber: text("box_number").notNull(),
  notes: text("notes"), // Team notes/restrictions like "não pode passar do horário"
  isActive: boolean("is_active").notNull().default(true),
});

export const serviceOrders = pgTable("service_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // ATIVAÇÃO, LOSS, UPGRADE, etc
  status: text("status").notNull().default("Pendente"), // Concluído, Reagendado, Pendente
  teamId: varchar("team_id").references(() => teams.id),
  technicianId: varchar("technician_id").references(() => technicians.id), // Specific technician within team
  alert: text("alert"), // Special instructions like "Ligar 15 minutos antes"
  scheduledDate: text("scheduled_date"), // Date when the service is scheduled
  scheduledTime: text("scheduled_time"), // Time when the service is scheduled
  customerName: text("customer_name"), // Customer name
  customerPhone: text("customer_phone"), // Customer phone
  address: text("address"), // Service address
  description: text("description"), // Additional service description
  reminderEnabled: boolean("reminder_enabled").default(true), // Enable reminder
  createdViaCalendar: boolean("created_via_calendar").default(false), // Created through calendar scheduling
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  date: text("date").notNull(),
  shift: text("shift").notNull(), // Manhã, Tarde
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cities = pgTable("cities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const neighborhoods = pgTable("neighborhoods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cityId: varchar("city_id").references(() => cities.id).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceTypes = pgTable("service_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTechnicianSchema = createInsertSchema(technicians).omit({
  id: true,
  isActive: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  isActive: true,
});

export const updateTeamSchema = createInsertSchema(teams).omit({
  id: true,
}).partial();

export const insertServiceOrderSchema = createInsertSchema(serviceOrders).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const insertNeighborhoodSchema = createInsertSchema(neighborhoods).omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const insertServiceTypeSchema = createInsertSchema(serviceTypes).omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type InsertServiceOrder = z.infer<typeof insertServiceOrderSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type InsertNeighborhood = z.infer<typeof insertNeighborhoodSchema>;
export type InsertServiceType = z.infer<typeof insertServiceTypeSchema>;

export type Technician = typeof technicians.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type ServiceOrder = typeof serviceOrders.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type City = typeof cities.$inferSelect;
export type Neighborhood = typeof neighborhoods.$inferSelect;
export type ServiceType = typeof serviceTypes.$inferSelect;
