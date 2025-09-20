#!/usr/bin/env node

/**
 * TESTE DE BANCO DE DADOS
 * Sistema de Ordens de Serviço
 * 
 * Uso: node test-database.js
 * 
 * Este script testa:
 * - Conexão com banco
 * - Existência das tabelas
 * - Integridade dos dados
 * - Operações CRUD básicas
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "./shared/schema.js";
import { eq } from "drizzle-orm";

// Configurar WebSocket para Neon
neonConfig.webSocketConstructor = ws;

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.bold}${colors.blue}=== ${title} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testDatabaseConnection() {
  logSection('TESTE DE CONEXÃO');
  
  // Verificar se DATABASE_URL existe
  if (!process.env.DATABASE_URL) {
    logError('DATABASE_URL não encontrada nas variáveis de ambiente');
    logInfo('Configure a variável DATABASE_URL no arquivo .env');
    logInfo('Exemplo: DATABASE_URL=postgresql://user:pass@host:5432/database');
    return false;
  }
  
  logInfo(`DATABASE_URL configurada: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
  
  try {
    // Testar conexão
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    // Executar query simples
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    
    logSuccess('Conexão com banco estabelecida com sucesso!');
    logInfo(`Hora do banco: ${result.rows[0].current_time}`);
    logInfo(`Versão PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]}`);
    
    await pool.end();
    return true;
    
  } catch (error) {
    logError(`Falha na conexão: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      logInfo('Verifique se o host do banco está correto');
    } else if (error.code === 'ECONNREFUSED') {
      logInfo('Verifique se o banco está rodando e a porta está correta');
    } else if (error.message.includes('password authentication failed')) {
      logInfo('Verifique usuário e senha do banco');
    }
    
    return false;
  }
}

async function testTablesExistence() {
  logSection('TESTE DE EXISTÊNCIA DAS TABELAS');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Listar todas as tabelas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const existingTables = result.rows.map(row => row.table_name);
    const expectedTables = [
      'technicians',
      'teams', 
      'service_orders',
      'reports',
      'cities',
      'neighborhoods',
      'service_types'
    ];
    
    logInfo(`Tabelas encontradas: ${existingTables.length}`);
    
    let allTablesExist = true;
    
    for (const table of expectedTables) {
      if (existingTables.includes(table)) {
        logSuccess(`Tabela '${table}' existe`);
      } else {
        logError(`Tabela '${table}' NÃO existe`);
        allTablesExist = false;
      }
    }
    
    // Verificar tabelas extras
    const extraTables = existingTables.filter(t => !expectedTables.includes(t));
    if (extraTables.length > 0) {
      logWarning(`Tabelas extras encontradas: ${extraTables.join(', ')}`);
    }
    
    await pool.end();
    return allTablesExist;
    
  } catch (error) {
    logError(`Erro ao verificar tabelas: ${error.message}`);
    return false;
  }
}

async function testDataIntegrity() {
  logSection('TESTE DE INTEGRIDADE DOS DADOS');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    // Contar registros em cada tabela
    const counts = {};
    
    // Técnicos
    const technicianCount = await pool.query('SELECT COUNT(*) FROM technicians');
    counts.technicians = parseInt(technicianCount.rows[0].count);
    
    // Equipes
    const teamCount = await pool.query('SELECT COUNT(*) FROM teams');
    counts.teams = parseInt(teamCount.rows[0].count);
    
    // Ordens de Serviço
    const serviceOrderCount = await pool.query('SELECT COUNT(*) FROM service_orders');
    counts.service_orders = parseInt(serviceOrderCount.rows[0].count);
    
    // Relatórios
    const reportCount = await pool.query('SELECT COUNT(*) FROM reports');
    counts.reports = parseInt(reportCount.rows[0].count);
    
    // Cidades
    const cityCount = await pool.query('SELECT COUNT(*) FROM cities');
    counts.cities = parseInt(cityCount.rows[0].count);
    
    // Bairros
    const neighborhoodCount = await pool.query('SELECT COUNT(*) FROM neighborhoods');
    counts.neighborhoods = parseInt(neighborhoodCount.rows[0].count);
    
    // Tipos de Serviço
    const serviceTypeCount = await pool.query('SELECT COUNT(*) FROM service_types');
    counts.service_types = parseInt(serviceTypeCount.rows[0].count);
    
    // Verificar se temos dados
    let hasData = false;
    
    logInfo('Contagem de registros por tabela:');
    for (const [table, count] of Object.entries(counts)) {
      if (count > 0) {
        logSuccess(`  ${table}: ${count} registros`);
        hasData = true;
      } else {
        logWarning(`  ${table}: ${count} registros (vazia)`);
      }
    }
    
    // Verificar dados esperados
    const expectedCounts = {
      technicians: 6,
      teams: 3,
      service_orders: 8,
      cities: 2,
      neighborhoods: 125,
      service_types: 7,
      reports: 3
    };
    
    logInfo('\nComparação com dados esperados:');
    let dataMatches = true;
    
    for (const [table, expectedCount] of Object.entries(expectedCounts)) {
      const actualCount = counts[table];
      if (actualCount === expectedCount) {
        logSuccess(`  ${table}: ${actualCount}/${expectedCount} ✓`);
      } else {
        logWarning(`  ${table}: ${actualCount}/${expectedCount} (diferente)`);
        dataMatches = false;
      }
    }
    
    await pool.end();
    return { hasData, dataMatches, counts };
    
  } catch (error) {
    logError(`Erro ao verificar integridade: ${error.message}`);
    return { hasData: false, dataMatches: false, counts: {} };
  }
}

async function testCrudOperations() {
  logSection('TESTE DE OPERAÇÕES CRUD');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema });
    
    // Teste CREATE (INSERT)
    logInfo('Testando INSERT...');
    const testTechnician = {
      name: 'TESTE_TECNICO_DELETE_ME',
      cities: ['TESTE'],
      neighborhoods: ['TESTE']
    };
    
    const [insertedTech] = await db.insert(schema.technicians)
      .values(testTechnician)
      .returning();
    
    logSuccess(`INSERT funcionando - ID: ${insertedTech.id}`);
    
    // Teste READ (SELECT)
    logInfo('Testando SELECT...');
    const [foundTech] = await db.select()
      .from(schema.technicians)
      .where(eq(schema.technicians.id, insertedTech.id));
    
    if (foundTech && foundTech.name === testTechnician.name) {
      logSuccess('SELECT funcionando - Técnico encontrado');
    } else {
      throw new Error('SELECT falhou - Técnico não encontrado');
    }
    
    // Teste UPDATE
    logInfo('Testando UPDATE...');
    const [updatedTech] = await db.update(schema.technicians)
      .set({ name: 'TESTE_TECNICO_UPDATED' })
      .where(eq(schema.technicians.id, insertedTech.id))
      .returning();
    
    if (updatedTech.name === 'TESTE_TECNICO_UPDATED') {
      logSuccess('UPDATE funcionando - Nome alterado');
    } else {
      throw new Error('UPDATE falhou');
    }
    
    // Teste DELETE
    logInfo('Testando DELETE...');
    const deletedRows = await db.delete(schema.technicians)
      .where(eq(schema.technicians.id, insertedTech.id));
    
    logSuccess('DELETE funcionando - Registro removido');
    
    // Verificar se foi realmente deletado
    const [checkDeleted] = await db.select()
      .from(schema.technicians)
      .where(eq(schema.technicians.id, insertedTech.id));
    
    if (!checkDeleted) {
      logSuccess('Confirmado - Registro foi deletado do banco');
    } else {
      logWarning('Registro ainda existe após DELETE');
    }
    
    await pool.end();
    return true;
    
  } catch (error) {
    logError(`Erro nas operações CRUD: ${error.message}`);
    return false;
  }
}

async function testRelationships() {
  logSection('TESTE DE RELACIONAMENTOS');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Teste relacionamento teams -> technicians
    logInfo('Testando relacionamento Teams -> Technicians...');
    const teamWithTechs = await pool.query(`
      SELECT 
        t.name as team_name,
        t.technician_ids,
        array_length(t.technician_ids, 1) as tech_count
      FROM teams t 
      WHERE array_length(t.technician_ids, 1) > 0
      LIMIT 1
    `);
    
    if (teamWithTechs.rows.length > 0) {
      const team = teamWithTechs.rows[0];
      logSuccess(`Equipe encontrada: ${team.team_name} com ${team.tech_count} técnicos`);
    } else {
      logWarning('Nenhuma equipe com técnicos encontrada');
    }
    
    // Teste relacionamento cities -> neighborhoods
    logInfo('Testando relacionamento Cities -> Neighborhoods...');
    const cityWithNeighborhoods = await pool.query(`
      SELECT 
        c.name as city_name,
        COUNT(n.id) as neighborhood_count
      FROM cities c
      LEFT JOIN neighborhoods n ON c.id = n.city_id
      GROUP BY c.id, c.name
      ORDER BY neighborhood_count DESC
      LIMIT 1
    `);
    
    if (cityWithNeighborhoods.rows.length > 0) {
      const city = cityWithNeighborhoods.rows[0];
      logSuccess(`Cidade encontrada: ${city.city_name} com ${city.neighborhood_count} bairros`);
    } else {
      logWarning('Nenhuma cidade com bairros encontrada');
    }
    
    // Teste relacionamento teams -> service_orders
    logInfo('Testando relacionamento Teams -> Service Orders...');
    const teamWithOrders = await pool.query(`
      SELECT 
        t.name as team_name,
        COUNT(so.id) as order_count
      FROM teams t
      LEFT JOIN service_orders so ON t.id = so.team_id
      GROUP BY t.id, t.name
      ORDER BY order_count DESC
      LIMIT 1
    `);
    
    if (teamWithOrders.rows.length > 0) {
      const team = teamWithOrders.rows[0];
      logSuccess(`Equipe encontrada: ${team.team_name} com ${team.order_count} ordens`);
    } else {
      logWarning('Nenhuma equipe com ordens encontrada');
    }
    
    await pool.end();
    return true;
    
  } catch (error) {
    logError(`Erro ao testar relacionamentos: ${error.message}`);
    return false;
  }
}

async function generateReport() {
  logSection('RELATÓRIO FINAL');
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Resumo geral
    const summary = await pool.query(`
      SELECT 
        'Técnicos' as tabela, COUNT(*) as total FROM technicians
      UNION ALL
      SELECT 'Equipes', COUNT(*) FROM teams
      UNION ALL  
      SELECT 'Ordens de Serviço', COUNT(*) FROM service_orders
      UNION ALL
      SELECT 'Relatórios', COUNT(*) FROM reports
      UNION ALL
      SELECT 'Cidades', COUNT(*) FROM cities
      UNION ALL
      SELECT 'Bairros', COUNT(*) FROM neighborhoods
      UNION ALL
      SELECT 'Tipos de Serviço', COUNT(*) FROM service_types
    `);
    
    logInfo('📊 RESUMO DO BANCO DE DADOS:');
    for (const row of summary.rows) {
      log(`   ${row.tabela}: ${row.total}`, 'blue');
    }
    
    // Status das ordens
    const orderStatus = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM service_orders 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    if (orderStatus.rows.length > 0) {
      logInfo('\n📋 STATUS DAS ORDENS DE SERVIÇO:');
      for (const row of orderStatus.rows) {
        log(`   ${row.status}: ${row.count}`, 'blue');
      }
    }
    
    // Equipes mais ativas
    const activeTeams = await pool.query(`
      SELECT 
        t.name,
        COUNT(so.id) as orders_count
      FROM teams t
      LEFT JOIN service_orders so ON t.id = so.team_id
      GROUP BY t.id, t.name
      ORDER BY orders_count DESC
    `);
    
    if (activeTeams.rows.length > 0) {
      logInfo('\n👷 EQUIPES E SUAS ORDENS:');
      for (const row of activeTeams.rows) {
        log(`   ${row.name}: ${row.orders_count} ordens`, 'blue');
      }
    }
    
    await pool.end();
    return true;
    
  } catch (error) {
    logError(`Erro ao gerar relatório: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log(`${colors.bold}${colors.blue}🧪 INICIANDO TESTES DO BANCO DE DADOS${colors.reset}\n`);
  
  const results = {
    connection: false,
    tables: false,
    data: false,
    crud: false,
    relationships: false,
    report: false
  };
  
  // 1. Teste de conexão
  results.connection = await testDatabaseConnection();
  if (!results.connection) {
    logError('❌ FALHA CRÍTICA: Não foi possível conectar ao banco');
    logInfo('Verifique sua configuração de DATABASE_URL e tente novamente');
    return;
  }
  
  // 2. Teste de tabelas
  results.tables = await testTablesExistence();
  if (!results.tables) {
    logWarning('⚠️  Algumas tabelas estão faltando');
    logInfo('Execute: psql "$DATABASE_URL" < dump.sql');
  }
  
  // 3. Teste de dados
  const dataResult = await testDataIntegrity();
  results.data = dataResult.hasData;
  
  // 4. Teste CRUD (apenas se conexão OK)
  if (results.connection) {
    results.crud = await testCrudOperations();
  }
  
  // 5. Teste relacionamentos (apenas se tabelas OK)
  if (results.tables) {
    results.relationships = await testRelationships();
  }
  
  // 6. Relatório final
  results.report = await generateReport();
  
  // Resultado final
  logSection('RESULTADO FINAL');
  
  const passedTests = Object.values(results).filter(r => r === true).length;
  const totalTests = Object.keys(results).length;
  
  if (passedTests === totalTests) {
    logSuccess(`🎉 TODOS OS TESTES PASSARAM (${passedTests}/${totalTests})`);
    logSuccess('✅ Banco de dados está funcionando perfeitamente!');
    logInfo('Seu sistema está pronto para usar o banco PostgreSQL');
  } else {
    logWarning(`⚠️  ${passedTests}/${totalTests} testes passaram`);
    
    if (!results.connection) {
      logError('🔥 CRÍTICO: Problema de conexão com banco');
    }
    if (!results.tables) {
      logError('🔥 CRÍTICO: Tabelas estão faltando');
      logInfo('Solução: psql "$DATABASE_URL" < dump.sql');
    }
    if (!results.data) {
      logWarning('📦 Banco vazio - execute seeds.sql para popular');
    }
    if (!results.crud) {
      logError('🔥 CRÍTICO: Operações CRUD não funcionam');
    }
    if (!results.relationships) {
      logWarning('🔗 Relacionamentos podem ter problemas');
    }
  }
  
  log(`\n${colors.bold}Teste finalizado em ${new Date().toLocaleString()}${colors.reset}`);
}

// Executar testes
runAllTests().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});