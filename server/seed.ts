import { storage } from "./storage";

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  try {
    // Create default cities first
    const ubaCity = await storage.createCity({ name: "UBA-MG" });
    const tocantinsCity = await storage.createCity({ name: "TOCANTINS-MG" });

    // Create neighborhoods for UBA-MG
    const ubaNeighborhoods = [
      "Aeroporto", "Centro", "Santa Cruz", "Bom Pastor", "Jardim Primavera", 
      "São Pedro", "Bela Vista", "Industrial", "Peluso", "Laranjal",
      "Universitário", "Palmeiras", "Cristal", "Santa Terezinha", "São José", "Vitória"
    ];

    for (const neighborhoodName of ubaNeighborhoods) {
      await storage.createNeighborhood({ 
        name: neighborhoodName, 
        cityId: ubaCity.id 
      });
    }

    // Create neighborhoods for TOCANTINS-MG
    const tocantinsNeighborhoods = [
      "CENTRO", "BOA VISTA", "PATRIMONIO", "GRAMA", "FLORESTA"
    ];

    for (const neighborhoodName of tocantinsNeighborhoods) {
      await storage.createNeighborhood({ 
        name: neighborhoodName, 
        cityId: tocantinsCity.id 
      });
    }

    // Create sample technicians
    const technician1 = await storage.createTechnician({
      name: "Hugo Silva",
      cities: ["UBA-MG"],
      neighborhoods: ["Centro", "Santa Cruz", "Bom Pastor"]
    });

    const technician2 = await storage.createTechnician({
      name: "Shelbert Costa", 
      cities: ["UBA-MG"],
      neighborhoods: ["Centro", "Jardim Primavera", "São Pedro"]
    });

    const technician3 = await storage.createTechnician({
      name: "Victor Fernandes",
      cities: ["UBA-MG", "TOCANTINS-MG"],
      neighborhoods: ["Centro", "Bela Vista", "CENTRO"]
    });

    const technician4 = await storage.createTechnician({
      name: "Everton Rodrigues",
      cities: ["UBA-MG"],
      neighborhoods: ["Industrial", "Peluso", "Laranjal"]
    });

    const technician5 = await storage.createTechnician({
      name: "Daniel Santos",
      cities: ["TOCANTINS-MG"],
      neighborhoods: ["CENTRO", "BOA VISTA", "PATRIMONIO"]
    });

    const technician6 = await storage.createTechnician({
      name: "Wesley Almeida",
      cities: ["UBA-MG"],
      neighborhoods: ["Santa Terezinha", "São José", "Vitória"]
    });

    // Create sample teams
    const team1 = await storage.createTeam({
      name: "EQUIPE 1",
      technicianIds: [technician1.id, technician2.id],
      boxNumber: "CAIXA-01",
      notes: "Não pode passar do horário"
    });

    const team2 = await storage.createTeam({
      name: "EQUIPE 2", 
      technicianIds: [technician3.id, technician4.id],
      boxNumber: "CAIXA-02",
      notes: "Disponível apenas pela manhã"
    });

    const team3 = await storage.createTeam({
      name: "EQUIPE 3",
      technicianIds: [technician5.id, technician6.id],
      boxNumber: "CAIXA-03",
      notes: ""
    });

    // Get neighborhood IDs for sample service orders
    const neighborhoods = await storage.getAllNeighborhoods();
    const centroUba = neighborhoods.find(n => n.name === "Centro" && n.cityId === ubaCity.id);
    const santaCruzUba = neighborhoods.find(n => n.name === "Santa Cruz" && n.cityId === ubaCity.id);

    // Create sample service orders
    await storage.createServiceOrder({
      code: "139390",
      type: "ATIVAÇÃO",
      status: "Concluído",
      teamId: team1.id,
      alert: "Ligar 15 minutos antes",
      scheduledDate: "2025-09-27",
      scheduledTime: "08:00",
      customerName: "João Silva",
      customerPhone: "(34) 99999-1234",
      address: "Rua das Flores, 123 - Centro",
      description: "Ativação de linha residencial",
      cityId: ubaCity.id,
      neighborhoodId: centroUba?.id || null
    });

    await storage.createServiceOrder({
      code: "333333",
      type: "T.EQUIPAMENTO",
      status: "Pendente",
      teamId: team2.id,
      scheduledDate: "2025-09-27",
      cityId: ubaCity.id,
      neighborhoodId: santaCruzUba?.id || null
    });

    // Create service types
    const serviceTypeNames = ["ATIVAÇÃO", "LOSS", "UPGRADE", "T.EQUIPAMENTO", "SEM CONEXÃO", "LENTIDÃO", "CONFG. ROTEADOR"];
    for (const typeName of serviceTypeNames) {
      await storage.createServiceType({ name: typeName });
    }

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run if called directly
seedDatabase().catch(console.error);

export { seedDatabase };