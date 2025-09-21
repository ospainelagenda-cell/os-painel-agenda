import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTechnicianSchema, insertTeamSchema, updateTeamSchema, insertServiceOrderSchema, insertReportSchema, insertCitySchema, insertNeighborhoodSchema, insertServiceTypeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {

  // Technician routes
  app.get("/api/technicians", async (req, res) => {
    try {
      const technicians = await storage.getAllTechnicians();
      res.json(technicians);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  app.post("/api/technicians", async (req, res) => {
    try {
      const validatedData = insertTechnicianSchema.parse(req.body);
      const technician = await storage.createTechnician(validatedData);
      res.status(201).json(technician);
    } catch (error) {
      res.status(400).json({ message: "Invalid technician data" });
    }
  });

  app.put("/api/technicians/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertTechnicianSchema.partial().parse(req.body);
      const technician = await storage.updateTechnician(id, validatedData);
      
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }
      
      res.json(technician);
    } catch (error) {
      res.status(400).json({ message: "Invalid technician data" });
    }
  });

  app.delete("/api/technicians/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTechnician(id);
      
      if (!success) {
        return res.status(404).json({ message: "Technician not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete technician" });
    }
  });

  // Team routes
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teams" });
    }
  });

  app.post("/api/teams", async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      res.status(400).json({ message: "Invalid team data" });
    }
  });

  app.put("/api/teams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateTeamSchema.parse(req.body);
      const team = await storage.updateTeam(id, validatedData);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      res.status(400).json({ message: "Invalid team data" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTeam(id);
      
      if (!success) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team" });
    }
  });

  // Service Order routes
  app.get("/api/service-orders", async (req, res) => {
    try {
      const serviceOrders = await storage.getAllServiceOrders();
      res.json(serviceOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service orders" });
    }
  });

  app.get("/api/service-orders/search/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const serviceOrder = await storage.getServiceOrderByCode(code);
      
      if (!serviceOrder) {
        return res.status(404).json({ message: "Service order not found" });
      }
      
      res.json(serviceOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to search service order" });
    }
  });

  app.get("/api/service-orders/team/:teamId", async (req, res) => {
    try {
      const { teamId } = req.params;
      const serviceOrders = await storage.getServiceOrdersByTeam(teamId);
      res.json(serviceOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team service orders" });
    }
  });

  app.post("/api/service-orders", async (req, res) => {
    try {
      const validatedData = insertServiceOrderSchema.parse(req.body);
      const serviceOrder = await storage.createServiceOrder(validatedData);
      res.status(201).json(serviceOrder);
    } catch (error) {
      res.status(400).json({ message: "Invalid service order data" });
    }
  });

  app.put("/api/service-orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertServiceOrderSchema.partial().parse(req.body);
      const serviceOrder = await storage.updateServiceOrder(id, validatedData);
      
      if (!serviceOrder) {
        return res.status(404).json({ message: "Service order not found" });
      }
      
      res.json(serviceOrder);
    } catch (error) {
      res.status(400).json({ message: "Invalid service order data" });
    }
  });

  app.delete("/api/service-orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteServiceOrder(id);
      
      if (!success) {
        return res.status(404).json({ message: "Service order not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service order" });
    }
  });

  // Report routes
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      res.status(400).json({ message: "Invalid report data" });
    }
  });

  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteReport(id);
      
      if (!success) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // City routes
  app.get("/api/cities", async (req, res) => {
    try {
      const cities = await storage.getAllCities();
      res.json(cities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cities" });
    }
  });

  app.post("/api/cities", async (req, res) => {
    try {
      const validatedData = insertCitySchema.parse(req.body);
      const city = await storage.createCity(validatedData);
      res.status(201).json(city);
    } catch (error) {
      res.status(400).json({ message: "Invalid city data" });
    }
  });

  app.put("/api/cities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertCitySchema.partial().parse(req.body);
      const city = await storage.updateCity(id, validatedData);
      
      if (!city) {
        return res.status(404).json({ message: "City not found" });
      }
      
      res.json(city);
    } catch (error) {
      res.status(400).json({ message: "Invalid city data" });
    }
  });

  app.delete("/api/cities/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCity(id);
      
      if (!success) {
        return res.status(404).json({ message: "City not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete city" });
    }
  });

  // Neighborhood routes
  app.get("/api/neighborhoods", async (req, res) => {
    try {
      const neighborhoods = await storage.getAllNeighborhoods();
      res.json(neighborhoods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch neighborhoods" });
    }
  });

  app.get("/api/neighborhoods/city/:cityId", async (req, res) => {
    try {
      const { cityId } = req.params;
      const neighborhoods = await storage.getNeighborhoodsByCity(cityId);
      res.json(neighborhoods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch city neighborhoods" });
    }
  });

  app.post("/api/neighborhoods", async (req, res) => {
    try {
      const validatedData = insertNeighborhoodSchema.parse(req.body);
      const neighborhood = await storage.createNeighborhood(validatedData);
      res.status(201).json(neighborhood);
    } catch (error) {
      res.status(400).json({ message: "Invalid neighborhood data" });
    }
  });

  app.put("/api/neighborhoods/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertNeighborhoodSchema.partial().parse(req.body);
      const neighborhood = await storage.updateNeighborhood(id, validatedData);
      
      if (!neighborhood) {
        return res.status(404).json({ message: "Neighborhood not found" });
      }
      
      res.json(neighborhood);
    } catch (error) {
      res.status(400).json({ message: "Invalid neighborhood data" });
    }
  });

  app.delete("/api/neighborhoods/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteNeighborhood(id);
      
      if (!success) {
        return res.status(404).json({ message: "Neighborhood not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete neighborhood" });
    }
  });

  // Service Type routes
  app.get("/api/service-types", async (req, res) => {
    try {
      const serviceTypes = await storage.getAllServiceTypes();
      res.json(serviceTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service types" });
    }
  });

  app.post("/api/service-types", async (req, res) => {
    try {
      const validatedData = insertServiceTypeSchema.parse(req.body);
      const serviceType = await storage.createServiceType(validatedData);
      res.status(201).json(serviceType);
    } catch (error) {
      res.status(400).json({ message: "Invalid service type data" });
    }
  });

  app.put("/api/service-types/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertServiceTypeSchema.partial().parse(req.body);
      const serviceType = await storage.updateServiceType(id, validatedData);
      
      if (!serviceType) {
        return res.status(404).json({ message: "Service type not found" });
      }
      
      res.json(serviceType);
    } catch (error) {
      res.status(400).json({ message: "Invalid service type data" });
    }
  });

  app.delete("/api/service-types/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteServiceType(id);
      
      if (!success) {
        return res.status(404).json({ message: "Service type not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete service type" });
    }
  });

  // Bulk operations
  app.post("/api/service-orders/reallocate", async (req, res) => {
    try {
      const { serviceOrderIds, newTeamId, clearTechnician = true } = req.body;
      
      if (!Array.isArray(serviceOrderIds) || !newTeamId) {
        return res.status(400).json({ message: "Invalid reallocation data" });
      }

      const results = [];
      for (const orderId of serviceOrderIds) {
        const updateData: any = { teamId: newTeamId };
        
        // Limpar o technicianId quando realocando (padrão: true)
        if (clearTechnician) {
          updateData.technicianId = null;
        }
        
        const updated = await storage.updateServiceOrder(orderId, updateData);
        if (updated) {
          results.push(updated);
        }
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to reallocate service orders" });
    }
  });


  // Export/Import routes
  app.get("/api/export", async (req, res) => {
    try {
      const data = {
        teams: await storage.getAllTeams(),
        serviceOrders: await storage.getAllServiceOrders(),
        reports: await storage.getAllReports()
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=dashboard-export.json');
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
