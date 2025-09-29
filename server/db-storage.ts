import { db } from "./db";
import { 
  technicians, teams, serviceOrders, reports, cities, neighborhoods, serviceTypes,
  type Team,
  type InsertTeam,
  type ServiceOrder,
  type InsertServiceOrder,
  type Report,
  type InsertReport,
  type City,
  type InsertCity,
  type Neighborhood,
  type InsertNeighborhood,
  type ServiceType,
  type InsertServiceType,
  type Technician,
  type InsertTechnician
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {

  // Technician methods
  async getTechnician(id: string): Promise<Technician | undefined> {
    const result = await db.select().from(technicians).where(eq(technicians.id, id));
    return result[0];
  }

  async getAllTechnicians(): Promise<Technician[]> {
    return await db.select().from(technicians).where(eq(technicians.isActive, true));
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const result = await db.insert(technicians).values(insertTechnician).returning();
    return result[0];
  }

  async updateTechnician(id: string, updateData: Partial<InsertTechnician> & { isActive?: boolean }): Promise<Technician | undefined> {
    const result = await db.update(technicians).set(updateData).where(eq(technicians.id, id)).returning();
    return result[0];
  }

  async deleteTechnician(id: string): Promise<boolean> {
    const result = await db.update(technicians).set({ isActive: false }).where(eq(technicians.id, id)).returning();
    return result.length > 0;
  }

  // Team methods
  async getTeam(id: string): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id));
    return result[0];
  }

  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(insertTeam).returning();
    return result[0];
  }

  async updateTeam(id: string, updateData: Partial<InsertTeam> & { isActive?: boolean }): Promise<Team | undefined> {
    const result = await db.update(teams).set(updateData).where(eq(teams.id, id)).returning();
    return result[0];
  }

  async deleteTeam(id: string): Promise<boolean> {
    const result = await db.update(teams).set({ isActive: false }).where(eq(teams.id, id)).returning();
    return result.length > 0;
  }

  // Service Order methods
  async getServiceOrder(id: string): Promise<ServiceOrder | undefined> {
    const result = await db.select().from(serviceOrders).where(eq(serviceOrders.id, id));
    return result[0];
  }

  async getServiceOrderByCode(code: string): Promise<ServiceOrder | undefined> {
    const result = await db.select().from(serviceOrders).where(eq(serviceOrders.code, code));
    return result[0];
  }

  async getAllServiceOrders(): Promise<ServiceOrder[]> {
    return await db.select().from(serviceOrders);
  }

  async getServiceOrdersByTeam(teamId: string): Promise<ServiceOrder[]> {
    return await db.select().from(serviceOrders).where(eq(serviceOrders.teamId, teamId));
  }

  async createServiceOrder(insertServiceOrder: InsertServiceOrder): Promise<ServiceOrder> {
    const result = await db.insert(serviceOrders).values(insertServiceOrder).returning();
    return result[0];
  }

  async updateServiceOrder(id: string, updateData: Partial<InsertServiceOrder>): Promise<ServiceOrder | undefined> {
    const result = await db.update(serviceOrders).set(updateData).where(eq(serviceOrders.id, id)).returning();
    return result[0];
  }

  async deleteServiceOrder(id: string): Promise<boolean> {
    const result = await db.delete(serviceOrders).where(eq(serviceOrders.id, id)).returning();
    return result.length > 0;
  }

  // Report methods
  async getReport(id: string): Promise<Report | undefined> {
    const result = await db.select().from(reports).where(eq(reports.id, id));
    return result[0];
  }

  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const result = await db.insert(reports).values(insertReport).returning();
    return result[0];
  }

  async updateReport(id: string, updateData: Partial<InsertReport>): Promise<Report | undefined> {
    const result = await db.update(reports).set(updateData).where(eq(reports.id, id)).returning();
    return result[0];
  }

  async deleteReport(id: string): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id)).returning();
    return result.length > 0;
  }

  // City methods
  async getCity(id: string): Promise<City | undefined> {
    const result = await db.select().from(cities).where(eq(cities.id, id));
    return result[0];
  }

  async getAllCities(): Promise<City[]> {
    return await db.select().from(cities).where(eq(cities.isActive, true));
  }

  async createCity(insertCity: InsertCity): Promise<City> {
    const result = await db.insert(cities).values(insertCity).returning();
    return result[0];
  }

  async updateCity(id: string, updateData: Partial<InsertCity>): Promise<City | undefined> {
    const result = await db.update(cities).set(updateData).where(eq(cities.id, id)).returning();
    return result[0];
  }

  async deleteCity(id: string): Promise<boolean> {
    const result = await db.update(cities).set({ isActive: false }).where(eq(cities.id, id)).returning();
    return result.length > 0;
  }

  // Neighborhood methods
  async getNeighborhood(id: string): Promise<Neighborhood | undefined> {
    const result = await db.select().from(neighborhoods).where(eq(neighborhoods.id, id));
    return result[0];
  }

  async getAllNeighborhoods(): Promise<Neighborhood[]> {
    return await db.select().from(neighborhoods).where(eq(neighborhoods.isActive, true));
  }

  async getNeighborhoodsByCity(cityId: string): Promise<Neighborhood[]> {
    return await db.select().from(neighborhoods).where(
      and(eq(neighborhoods.cityId, cityId), eq(neighborhoods.isActive, true))
    );
  }

  async createNeighborhood(insertNeighborhood: InsertNeighborhood): Promise<Neighborhood> {
    const result = await db.insert(neighborhoods).values(insertNeighborhood).returning();
    return result[0];
  }

  async updateNeighborhood(id: string, updateData: Partial<InsertNeighborhood>): Promise<Neighborhood | undefined> {
    const result = await db.update(neighborhoods).set(updateData).where(eq(neighborhoods.id, id)).returning();
    return result[0];
  }

  async deleteNeighborhood(id: string): Promise<boolean> {
    const result = await db.update(neighborhoods).set({ isActive: false }).where(eq(neighborhoods.id, id)).returning();
    return result.length > 0;
  }

  // Service Type methods
  async getServiceType(id: string): Promise<ServiceType | undefined> {
    const result = await db.select().from(serviceTypes).where(eq(serviceTypes.id, id));
    return result[0];
  }

  async getAllServiceTypes(): Promise<ServiceType[]> {
    return await db.select().from(serviceTypes).where(eq(serviceTypes.isActive, true));
  }

  async createServiceType(insertServiceType: InsertServiceType): Promise<ServiceType> {
    const result = await db.insert(serviceTypes).values(insertServiceType).returning();
    return result[0];
  }

  async updateServiceType(id: string, updateData: Partial<InsertServiceType>): Promise<ServiceType | undefined> {
    const result = await db.update(serviceTypes).set(updateData).where(eq(serviceTypes.id, id)).returning();
    return result[0];
  }

  async deleteServiceType(id: string): Promise<boolean> {
    const result = await db.update(serviceTypes).set({ isActive: false }).where(eq(serviceTypes.id, id)).returning();
    return result.length > 0;
  }
}