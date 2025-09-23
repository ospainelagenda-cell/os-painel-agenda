import { 
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
import { randomUUID } from "crypto";

export interface IStorage {

  // Technicians
  getTechnician(id: string): Promise<Technician | undefined>;
  getAllTechnicians(): Promise<Technician[]>;
  createTechnician(technician: InsertTechnician): Promise<Technician>;
  updateTechnician(id: string, technician: Partial<InsertTechnician> & { isActive?: boolean }): Promise<Technician | undefined>;
  deleteTechnician(id: string): Promise<boolean>;

  // Teams
  getTeam(id: string): Promise<Team | undefined>;
  getAllTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, team: Partial<InsertTeam> & { isActive?: boolean }): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;

  // Service Orders
  getServiceOrder(id: string): Promise<ServiceOrder | undefined>;
  getServiceOrderByCode(code: string): Promise<ServiceOrder | undefined>;
  getAllServiceOrders(): Promise<ServiceOrder[]>;
  getServiceOrdersByTeam(teamId: string): Promise<ServiceOrder[]>;
  createServiceOrder(serviceOrder: InsertServiceOrder): Promise<ServiceOrder>;
  updateServiceOrder(id: string, serviceOrder: Partial<InsertServiceOrder>): Promise<ServiceOrder | undefined>;
  deleteServiceOrder(id: string): Promise<boolean>;

  // Reports
  getReport(id: string): Promise<Report | undefined>;
  getAllReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  deleteReport(id: string): Promise<boolean>;

  // Cities
  getCity(id: string): Promise<City | undefined>;
  getAllCities(): Promise<City[]>;
  createCity(city: InsertCity): Promise<City>;
  updateCity(id: string, city: Partial<InsertCity>): Promise<City | undefined>;
  deleteCity(id: string): Promise<boolean>;

  // Neighborhoods
  getNeighborhood(id: string): Promise<Neighborhood | undefined>;
  getAllNeighborhoods(): Promise<Neighborhood[]>;
  getNeighborhoodsByCity(cityId: string): Promise<Neighborhood[]>;
  createNeighborhood(neighborhood: InsertNeighborhood): Promise<Neighborhood>;
  updateNeighborhood(id: string, neighborhood: Partial<InsertNeighborhood>): Promise<Neighborhood | undefined>;
  deleteNeighborhood(id: string): Promise<boolean>;

  // Service Types
  getServiceType(id: string): Promise<ServiceType | undefined>;
  getAllServiceTypes(): Promise<ServiceType[]>;
  createServiceType(serviceType: InsertServiceType): Promise<ServiceType>;
  updateServiceType(id: string, serviceType: Partial<InsertServiceType>): Promise<ServiceType | undefined>;
  deleteServiceType(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private technicians: Map<string, Technician>;
  private teams: Map<string, Team>;
  private serviceOrders: Map<string, ServiceOrder>;
  private reports: Map<string, Report>;
  private cities: Map<string, City>;
  private neighborhoods: Map<string, Neighborhood>;
  private serviceTypes: Map<string, ServiceType>;

  constructor() {
    this.technicians = new Map();
    this.teams = new Map();
    this.serviceOrders = new Map();
    this.reports = new Map();
    this.cities = new Map();
    this.neighborhoods = new Map();
    this.serviceTypes = new Map();
    
    // Initialize with some sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Create default cities first
    const ubaCity = await this.createCity({ name: "UBA-MG" });
    const tocantinsCity = await this.createCity({ name: "TOCANTINS-MG" });

    // Create neighborhoods for UBA-MG
    const ubaNeighborhoods = [
      "Aeroporto", "Agostinho Sales Amato", "Agroceres", "Alto Santa Cruz", "Antonina Coelho", 
      "Antônio Bigonha", "Antônio Maranhão", "Área Rural de Ubá", "Bambuí", "Bela Vista", 
      "Belvedere", "Boa Vista", "Bom Pastor", "Caxangá", "Centro", "Chiquito Gazolla", 
      "Cidade Carinho II", "Cidade Jardim", "Cittá de Lucca", "Colina do Jardim Glória", 
      "Concórdia", "Copacabana", "Cristal", "Cristo Redentor", "Cruzeiro", "da Luz", 
      "Derminas", "Dico Teixeira", "dos Vaz", "Eldorado", "Encosta do Sol", "Encosta do Sol II", 
      "Fazendinha", "Galdino Alvim", "Habitat I", "Industrial", "Jardim Alves do Vale", 
      "Jardim Élida", "Jardim Esperança", "Jardim Glória", "Jardim Inês Groppo", 
      "Jardim Manacás", "Jardim Primavera", "Laranjal", "Laurindo de Castro", "Lavapés", 
      "Loteamento Santos Dumont", "Louriçal", "Major Fusaro", "Mangueira Rural", 
      "Mateus Schetino", "Meu Sonho", "Noeme Batalha", "Nossa Senhora de Fátima", 
      "Novo Horizonte", "Novo Primavera", "Olaria", "Olinda", "Oséas Maranhão", "Palmeiras", 
      "Paulino Fernandes", "Paulino Fernandes III", "Paulino Fernandes IV", "Pedro Miquelito", 
      "Peixoto Filho", "Peluso", "Ponte Preta", "Portal das Mangueiras", "Quinta das Paineiras", 
      "Residencial Altair Rocha", "Residencial Estrela Sul", "Residencial Jardim Europa", 
      "Residencial Monte Belo", "Residencial Pires da Luz", "Residencial Quinze de Novembro", 
      "Residencial Rosa de Toledo", "Residencial São José", "Residencial São Leopoldo", 
      "Residencial São Lucas", "San Raphael I", "San Raphael II", "San Raphael III", 
      "Santa Alice", "Santa Bernadete", "Santa Cândida", "Santa Clara", "Santa Cruz", 
      "Santa Edwiges", "Santa Edwiges II", "Santa Luzia", "Santa Rosa", "Santa Terezinha", 
      "Santana", "Santo Antônio", "São Domingos", "São Francisco de Assis", "São João", 
      "São José", "São Judas Tadeu", "São Mateus", "São Pedro", "São Sebastião", "Seminário", 
      "Sobradinho", "Sol Nascente", "Talma", "Tanquinho Doutor José Cavaliere", 
      "Tanquinho João Teixeira", "Universitário", "Vale do Ipê", "Vila Casal", "Vila Franel", 
      "Vila Gonçalves", "Vila Mariah", "Vila Moreira", "Vila Regina", "Vitória", 
      "Waldemar de Castro", "Xangrilá"
    ];

    for (const neighborhoodName of ubaNeighborhoods) {
      await this.createNeighborhood({ 
        name: neighborhoodName, 
        cityId: ubaCity.id 
      });
    }

    // Create neighborhoods for TOCANTINS-MG
    const tocantinsNeighborhoods = [
      "ALTO DA BOA VISTA", "BELA VISTA", "BOA VISTA", "CENTRO", "IMPERIAL", 
      "PATRIMONIO", "GRAMA", "FLORESTA", "GINASIO", "ESPLANADA", 
      "TEIXEIRA DE MELO", "SÃO GABRIEL", "VARZEA", "MORRO GRANDE"
    ];

    for (const neighborhoodName of tocantinsNeighborhoods) {
      await this.createNeighborhood({ 
        name: neighborhoodName, 
        cityId: tocantinsCity.id 
      });
    }

    // Get neighborhood IDs for sample data
    const centroUbaId = Array.from(this.neighborhoods.values()).find(n => n.name === "Centro" && n.cityId === ubaCity.id)?.id;
    const santaCruzUbaId = Array.from(this.neighborhoods.values()).find(n => n.name === "Santa Cruz" && n.cityId === ubaCity.id)?.id;
    const bomPastorUbaId = Array.from(this.neighborhoods.values()).find(n => n.name === "Bom Pastor" && n.cityId === ubaCity.id)?.id;
    const jardimPrimaveraId = Array.from(this.neighborhoods.values()).find(n => n.name === "Jardim Primavera" && n.cityId === ubaCity.id)?.id;
    const saoPedroId = Array.from(this.neighborhoods.values()).find(n => n.name === "São Pedro" && n.cityId === ubaCity.id)?.id;
    const belaVistaUbaId = Array.from(this.neighborhoods.values()).find(n => n.name === "Bela Vista" && n.cityId === ubaCity.id)?.id;
    const industrialId = Array.from(this.neighborhoods.values()).find(n => n.name === "Industrial" && n.cityId === ubaCity.id)?.id;
    const pelusoId = Array.from(this.neighborhoods.values()).find(n => n.name === "Peluso" && n.cityId === ubaCity.id)?.id;
    const laranjal = Array.from(this.neighborhoods.values()).find(n => n.name === "Laranjal" && n.cityId === ubaCity.id)?.id;
    const universitarioId = Array.from(this.neighborhoods.values()).find(n => n.name === "Universitário" && n.cityId === ubaCity.id)?.id;
    const palmeirasId = Array.from(this.neighborhoods.values()).find(n => n.name === "Palmeiras" && n.cityId === ubaCity.id)?.id;
    const cristalId = Array.from(this.neighborhoods.values()).find(n => n.name === "Cristal" && n.cityId === ubaCity.id)?.id;
    const santaTeresinhaId = Array.from(this.neighborhoods.values()).find(n => n.name === "Santa Terezinha" && n.cityId === ubaCity.id)?.id;
    const saoJoseId = Array.from(this.neighborhoods.values()).find(n => n.name === "São José" && n.cityId === ubaCity.id)?.id;
    const vitoriaId = Array.from(this.neighborhoods.values()).find(n => n.name === "Vitória" && n.cityId === ubaCity.id)?.id;
    const centroTocantinsId = Array.from(this.neighborhoods.values()).find(n => n.name === "CENTRO" && n.cityId === tocantinsCity.id)?.id;
    const boaVistaTocantinsId = Array.from(this.neighborhoods.values()).find(n => n.name === "BOA VISTA" && n.cityId === tocantinsCity.id)?.id;
    const patrimonioId = Array.from(this.neighborhoods.values()).find(n => n.name === "PATRIMONIO" && n.cityId === tocantinsCity.id)?.id;

    // Create sample technicians
    const technician1 = await this.createTechnician({
      name: "Hugo Silva",
      cities: ["UBA-MG"],
      neighborhoods: ["Centro", "Santa Cruz", "Bom Pastor"]
    });

    const technician2 = await this.createTechnician({
      name: "Shelbert Costa", 
      cities: ["UBA-MG"],
      neighborhoods: ["Centro", "Jardim Primavera", "São Pedro"]
    });

    const technician3 = await this.createTechnician({
      name: "Victor Fernandes",
      cities: ["UBA-MG", "TOCANTINS-MG"],
      neighborhoods: ["Centro", "Bela Vista", "CENTRO"]
    });

    const technician4 = await this.createTechnician({
      name: "Everton Rodrigues",
      cities: ["UBA-MG"],
      neighborhoods: ["Industrial", "Peluso", "Laranjal"]
    });

    const technician5 = await this.createTechnician({
      name: "Daniel Santos",
      cities: ["TOCANTINS-MG"],
      neighborhoods: ["CENTRO", "BOA VISTA", "PATRIMONIO"]
    });

    const technician6 = await this.createTechnician({
      name: "Samuel Oliveira",
      cities: ["UBA-MG"],
      neighborhoods: ["Universitário", "Palmeiras", "Cristal"]
    });

    const technician7 = await this.createTechnician({
      name: "Wesley Almeida",
      cities: ["UBA-MG"],
      neighborhoods: ["Santa Terezinha", "São José", "Vitória"]
    });

    // Create sample teams with technician references
    const team1 = await this.createTeam({
      name: "EQUIPE 1",
      technicianIds: [technician1.id, technician2.id], // Hugo e Shelbert
      boxNumber: "CAIXA - 01",
      notes: "Não pode passar do horário"
    });

    const team2 = await this.createTeam({
      name: "EQUIPE 2", 
      technicianIds: [technician4.id, technician5.id], // Everton e Daniel
      boxNumber: "CAIXA - 02",
      notes: "Disponível apenas pela manhã"
    });

    const team3 = await this.createTeam({
      name: "EQUIPE 3",
      technicianIds: [technician6.id, technician7.id], // Samuel e Wesley
      boxNumber: "CAIXA - 03",
      notes: ""
    });

    // Create sample service orders with city and neighborhood information
    await this.createServiceOrder({
      code: "139390",
      type: "ATIVAÇÃO",
      status: "Concluído",
      teamId: team1.id,
      alert: "Ligar 15 minutos antes",
      scheduledDate: "2025-09-05",
      scheduledTime: "08:00",
      customerName: "João Silva",
      customerPhone: "(11) 99999-1234",
      address: "Rua das Flores, 123 - Centro",
      description: "Ativação de linha residencial",
      cityId: ubaCity.id,
      neighborhoodId: centroUbaId
    });

    await this.createServiceOrder({
      code: "125419",
      type: "LOSS",
      status: "Concluído",
      teamId: team1.id,
      alert: "Não pode subir no telhado",
      scheduledDate: "2025-09-05",
      scheduledTime: "14:30",
      customerName: "Maria Santos",
      customerPhone: "(11) 88888-5678",
      address: "Av. Principal, 456 - Vila Nova",
      cityId: ubaCity.id,
      neighborhoodId: santaCruzUbaId
    });

    await this.createServiceOrder({
      code: "120569",
      type: "UPGRADE",
      status: "Pendente",
      teamId: team1.id,
      scheduledDate: "2025-09-06",
      cityId: ubaCity.id,
      neighborhoodId: bomPastorUbaId
    });

    await this.createServiceOrder({
      code: "108897",
      type: "T.EQUIPAMENTO",
      status: "Concluído",
      teamId: team2.id,
      scheduledDate: "2025-09-05",
      cityId: ubaCity.id,
      neighborhoodId: industrialId
    });

    await this.createServiceOrder({
      code: "62139",
      type: "LOSS",
      status: "Pendente",
      teamId: team2.id,
      scheduledDate: "2025-09-06",
      cityId: tocantinsCity.id,
      neighborhoodId: centroTocantinsId
    });

    await this.createServiceOrder({
      code: "138210",
      type: "LOSS",
      status: "Concluído",
      teamId: team3.id,
      scheduledDate: "2025-09-05",
      cityId: ubaCity.id,
      neighborhoodId: universitarioId
    });

    await this.createServiceOrder({
      code: "125571",
      type: "LOSS",
      status: "Concluído",
      teamId: team3.id,
      scheduledDate: "2025-09-05",
      cityId: ubaCity.id,
      neighborhoodId: santaTeresinhaId
    });

    await this.createServiceOrder({
      code: "114181",
      type: "SEM CONEXÃO",
      status: "Pendente",
      teamId: team1.id,
      alert: "Equipamento especial necessário",
      scheduledDate: "2025-09-07",
      scheduledTime: "09:30",
      customerName: "Carlos Oliveira",
      customerPhone: "(11) 77777-9999",
      address: "Rua das Palmeiras, 789 - Jardim São Paulo",
      description: "Verificar conexão de fibra óptica",
      cityId: ubaCity.id,
      neighborhoodId: jardimPrimaveraId
    });

    // Create sample service types
    await this.createServiceType({ name: "ATIVAÇÃO" });
    await this.createServiceType({ name: "LOSS" });
    await this.createServiceType({ name: "UPGRADE" });
    await this.createServiceType({ name: "T.EQUIPAMENTO" });
    await this.createServiceType({ name: "SEM CONEXÃO" });
    await this.createServiceType({ name: "LENTIDÃO" });
    await this.createServiceType({ name: "CONFG. ROTEADOR" });

    // Create sample reports
    await this.createReport({
      name: "Relatório Diário - 05/09/2025",
      date: "2025-09-05",
      shift: "Manhã",
      content: `RELATÓRIO DE SERVIÇOS - 05/09/2025 - MANHÃ

EQUIPE: VICTOR F. E SHELBERT (CAIXA-01)
• OS #139390 - ATIVAÇÃO - Concluído
• OS #125419 - LOSS - Concluído
• Observação: Não pode passar do horário

EQUIPE: EVERTON E DANIEL (CAIXA-02)  
• OS #108897 - T.EQUIPAMENTO - Concluído
• Observação: Disponível apenas pela manhã

EQUIPE: SAMUEL E WESLEY (CAIXA-03)
• OS #138210 - LOSS - Concluído
• OS #125571 - LOSS - Concluído

RESUMO DO DIA:
Total de serviços: 5
Concluídos: 5
Pendentes: 0`
    });

    await this.createReport({
      name: "Relatório Diário - 04/09/2025",
      date: "2025-09-04", 
      shift: "Tarde",
      content: `RELATÓRIO DE SERVIÇOS - 04/09/2025 - TARDE

EQUIPE: VICTOR F. E SHELBERT (CAIXA-01)
• OS #124589 - UPGRADE - Concluído
• OS #126734 - ATIVAÇÃO - Reagendado
• Observação: Cliente não estava no local

EQUIPE: EVERTON E DANIEL (CAIXA-02)
• OS #123456 - SEM CONEXÃO - Concluído
• OS #145678 - LENTIDÃO - Concluído

RESUMO DO DIA:
Total de serviços: 4
Concluídos: 3
Reagendados: 1`
    });

    await this.createReport({
      name: "Relatório Semanal - 03/09/2025",
      date: "2025-09-03",
      shift: "Manhã", 
      content: `RELATÓRIO SEMANAL - 03/09/2025 - MANHÃ

RESUMO SEMANAL (28/08 - 03/09):
• VICTOR F. E SHELBERT: 15 serviços (13 concluídos, 2 reagendados)
• EVERTON E DANIEL: 12 serviços (11 concluídos, 1 reagendado)
• SAMUEL E WESLEY: 14 serviços (14 concluídos, 0 reagendados)

TIPOS DE SERVIÇO:
• ATIVAÇÃO: 18 serviços
• LOSS: 12 serviços
• UPGRADE: 6 serviços
• T.EQUIPAMENTO: 5 serviços

TOTAL GERAL: 41 serviços
Taxa de conclusão: 92.7%`
    });

  }

  // Technician methods
  async getTechnician(id: string): Promise<Technician | undefined> {
    return this.technicians.get(id);
  }

  async getAllTechnicians(): Promise<Technician[]> {
    return Array.from(this.technicians.values()).filter(technician => technician.isActive);
  }

  async createTechnician(insertTechnician: InsertTechnician): Promise<Technician> {
    const id = randomUUID();
    const technician: Technician = { 
      ...insertTechnician, 
      id, 
      isActive: true,
      cities: insertTechnician.cities || [],
      neighborhoods: insertTechnician.neighborhoods || []
    };
    this.technicians.set(id, technician);
    return technician;
  }

  async updateTechnician(id: string, updateData: Partial<InsertTechnician> & { isActive?: boolean }): Promise<Technician | undefined> {
    const technician = this.technicians.get(id);
    if (!technician) return undefined;
    
    const updated = { ...technician, ...updateData };
    this.technicians.set(id, updated);
    return updated;
  }

  async deleteTechnician(id: string): Promise<boolean> {
    const technician = this.technicians.get(id);
    if (!technician) return false;
    
    const updated = { ...technician, isActive: false };
    this.technicians.set(id, updated);
    return true;
  }

  // Team methods
  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = { 
      ...insertTeam, 
      id, 
      isActive: true,
      notes: insertTeam.notes || null
    };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: string, updateData: Partial<InsertTeam> & { isActive?: boolean }): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    const updated = { ...team, ...updateData };
    this.teams.set(id, updated);
    return updated;
  }

  async deleteTeam(id: string): Promise<boolean> {
    const team = this.teams.get(id);
    if (!team) return false;
    
    const updated = { ...team, isActive: false };
    this.teams.set(id, updated);
    return true;
  }

  // Service Order methods
  async getServiceOrder(id: string): Promise<ServiceOrder | undefined> {
    return this.serviceOrders.get(id);
  }

  async getServiceOrderByCode(code: string): Promise<ServiceOrder | undefined> {
    return Array.from(this.serviceOrders.values()).find(order => order.code === code);
  }

  async getAllServiceOrders(): Promise<ServiceOrder[]> {
    return Array.from(this.serviceOrders.values());
  }

  async getServiceOrdersByTeam(teamId: string): Promise<ServiceOrder[]> {
    return Array.from(this.serviceOrders.values()).filter(order => order.teamId === teamId);
  }

  async createServiceOrder(insertServiceOrder: InsertServiceOrder): Promise<ServiceOrder> {
    const id = randomUUID();
    const serviceOrder: ServiceOrder = { 
      ...insertServiceOrder, 
      id, 
      createdAt: new Date(),
      teamId: insertServiceOrder.teamId || null,
      technicianId: insertServiceOrder.technicianId || null,
      alert: insertServiceOrder.alert || null,
      scheduledDate: insertServiceOrder.scheduledDate || null,
      scheduledTime: insertServiceOrder.scheduledTime || null,
      customerName: insertServiceOrder.customerName || null,
      customerPhone: insertServiceOrder.customerPhone || null,
      address: insertServiceOrder.address || null,
      description: insertServiceOrder.description || null,
      cityId: insertServiceOrder.cityId || null,
      neighborhoodId: insertServiceOrder.neighborhoodId || null,
      reminderEnabled: insertServiceOrder.reminderEnabled ?? true,
      createdViaCalendar: insertServiceOrder.createdViaCalendar || false,
      status: insertServiceOrder.status || "Pendente"
    };
    this.serviceOrders.set(id, serviceOrder);
    return serviceOrder;
  }

  async updateServiceOrder(id: string, updateData: Partial<InsertServiceOrder>): Promise<ServiceOrder | undefined> {
    const serviceOrder = this.serviceOrders.get(id);
    if (!serviceOrder) return undefined;
    
    const updated = { ...serviceOrder, ...updateData };
    this.serviceOrders.set(id, updated);
    return updated;
  }

  async deleteServiceOrder(id: string): Promise<boolean> {
    return this.serviceOrders.delete(id);
  }

  // Report methods
  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = { 
      ...insertReport, 
      id, 
      createdAt: new Date()
    };
    this.reports.set(id, report);
    return report;
  }

  async deleteReport(id: string): Promise<boolean> {
    return this.reports.delete(id);
  }

  // City methods
  async getCity(id: string): Promise<City | undefined> {
    return this.cities.get(id);
  }

  async getAllCities(): Promise<City[]> {
    return Array.from(this.cities.values()).filter(city => city.isActive);
  }

  async createCity(insertCity: InsertCity): Promise<City> {
    const id = randomUUID();
    const city: City = { 
      ...insertCity, 
      id, 
      isActive: true,
      createdAt: new Date()
    };
    this.cities.set(id, city);
    return city;
  }

  async updateCity(id: string, updateData: Partial<InsertCity>): Promise<City | undefined> {
    const city = this.cities.get(id);
    if (!city) return undefined;
    
    const updated = { ...city, ...updateData };
    this.cities.set(id, updated);
    return updated;
  }

  async deleteCity(id: string): Promise<boolean> {
    const city = this.cities.get(id);
    if (!city) return false;
    
    const updated = { ...city, isActive: false };
    this.cities.set(id, updated);
    return true;
  }

  // Neighborhood methods
  async getNeighborhood(id: string): Promise<Neighborhood | undefined> {
    return this.neighborhoods.get(id);
  }

  async getAllNeighborhoods(): Promise<Neighborhood[]> {
    return Array.from(this.neighborhoods.values()).filter(neighborhood => neighborhood.isActive);
  }

  async getNeighborhoodsByCity(cityId: string): Promise<Neighborhood[]> {
    return Array.from(this.neighborhoods.values()).filter(neighborhood => 
      neighborhood.cityId === cityId && neighborhood.isActive
    );
  }

  async createNeighborhood(insertNeighborhood: InsertNeighborhood): Promise<Neighborhood> {
    const id = randomUUID();
    const neighborhood: Neighborhood = { 
      ...insertNeighborhood, 
      id, 
      isActive: true,
      createdAt: new Date()
    };
    this.neighborhoods.set(id, neighborhood);
    return neighborhood;
  }

  async updateNeighborhood(id: string, updateData: Partial<InsertNeighborhood>): Promise<Neighborhood | undefined> {
    const neighborhood = this.neighborhoods.get(id);
    if (!neighborhood) return undefined;
    
    const updated = { ...neighborhood, ...updateData };
    this.neighborhoods.set(id, updated);
    return updated;
  }

  async deleteNeighborhood(id: string): Promise<boolean> {
    const neighborhood = this.neighborhoods.get(id);
    if (!neighborhood) return false;
    
    const updated = { ...neighborhood, isActive: false };
    this.neighborhoods.set(id, updated);
    return true;
  }

  // Service Type methods
  async getServiceType(id: string): Promise<ServiceType | undefined> {
    return this.serviceTypes.get(id);
  }

  async getAllServiceTypes(): Promise<ServiceType[]> {
    return Array.from(this.serviceTypes.values()).filter(serviceType => serviceType.isActive);
  }

  async createServiceType(insertServiceType: InsertServiceType): Promise<ServiceType> {
    const id = randomUUID();
    const serviceType: ServiceType = { 
      ...insertServiceType, 
      id, 
      isActive: true,
      createdAt: new Date()
    };
    this.serviceTypes.set(id, serviceType);
    return serviceType;
  }

  async updateServiceType(id: string, updateData: Partial<InsertServiceType>): Promise<ServiceType | undefined> {
    const serviceType = this.serviceTypes.get(id);
    if (!serviceType) return undefined;
    
    const updated = { ...serviceType, ...updateData };
    this.serviceTypes.set(id, updated);
    return updated;
  }

  async deleteServiceType(id: string): Promise<boolean> {
    const serviceType = this.serviceTypes.get(id);
    if (!serviceType) return false;
    
    const updated = { ...serviceType, isActive: false };
    this.serviceTypes.set(id, updated);
    return true;
  }
}

export const storage = new MemStorage();
