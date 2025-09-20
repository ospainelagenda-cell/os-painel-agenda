-- =============================================
-- DADOS INICIAIS (SEEDS)
-- Sistema de Gerenciamento de Ordens de Serviço
-- Apenas dados para popular o banco
-- =============================================

-- ATENÇÃO: Execute apenas após rodar migrations.sql
-- ou certifique-se de que as tabelas já existem

-- =============================================
-- LIMPAR DADOS EXISTENTES (OPCIONAL)
-- =============================================

-- Descomente as linhas abaixo se quiser limpar dados existentes
-- TRUNCATE TABLE service_orders CASCADE;
-- TRUNCATE TABLE reports CASCADE;
-- TRUNCATE TABLE neighborhoods CASCADE;
-- TRUNCATE TABLE service_types CASCADE;
-- TRUNCATE TABLE teams CASCADE;
-- TRUNCATE TABLE technicians CASCADE;
-- TRUNCATE TABLE cities CASCADE;

-- =============================================
-- DADOS INICIAIS - TECNICOS
-- =============================================

INSERT INTO technicians (id, name, cities, neighborhoods) VALUES
('tech-001', 'Victor F.', ARRAY['Centro', 'Vila Nova', 'Jardim São Paulo'], ARRAY['Centro', 'Vila Nova', 'Jardim São Paulo']),
('tech-002', 'Shelbert', ARRAY['Centro', 'Bairro Alto', 'Santa Rita'], ARRAY['Centro', 'Bairro Alto', 'Santa Rita']),
('tech-003', 'Everton', ARRAY['Centro', 'Vila Nova'], ARRAY['Centro', 'Vila Nova']),
('tech-004', 'Daniel', ARRAY['Bairro Alto', 'Santa Rita'], ARRAY['Bairro Alto', 'Santa Rita']),
('tech-005', 'Samuel', ARRAY['Centro', 'Jardim São Paulo'], ARRAY['Centro', 'Jardim São Paulo']),
('tech-006', 'Wesley', ARRAY['Vila Nova', 'Santa Rita'], ARRAY['Vila Nova', 'Santa Rita'])
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DADOS INICIAIS - EQUIPES
-- =============================================

INSERT INTO teams (id, name, technician_ids, box_number, notes) VALUES
('team-001', 'VICTOR F. E SHELBERT', ARRAY['tech-001', 'tech-002'], 'CAIXA - 01', 'Não pode passar do horário'),
('team-002', 'EVERTON E DANIEL', ARRAY['tech-003', 'tech-004'], 'CAIXA - 02', 'Disponível apenas pela manhã'),
('team-003', 'SAMUEL E WESLEY', ARRAY['tech-005', 'tech-006'], 'CAIXA - 03', '')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DADOS INICIAIS - CIDADES
-- =============================================

INSERT INTO cities (id, name) VALUES
('city-001', 'UBA-MG'),
('city-002', 'TOCANTINS-MG')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DADOS INICIAIS - BAIRROS UBA-MG (111 bairros)
-- =============================================

INSERT INTO neighborhoods (name, city_id) VALUES
('Aeroporto', 'city-001'),
('Agostinho Sales Amato', 'city-001'),
('Agroceres', 'city-001'),
('Alto Santa Cruz', 'city-001'),
('Antonina Coelho', 'city-001'),
('Antônio Bigonha', 'city-001'),
('Antônio Maranhão', 'city-001'),
('Área Rural de Ubá', 'city-001'),
('Bambuí', 'city-001'),
('Bela Vista', 'city-001'),
('Belvedere', 'city-001'),
('Boa Vista', 'city-001'),
('Bom Pastor', 'city-001'),
('Caxangá', 'city-001'),
('Centro', 'city-001'),
('Chiquito Gazolla', 'city-001'),
('Cidade Carinho II', 'city-001'),
('Cidade Jardim', 'city-001'),
('Cittá de Lucca', 'city-001'),
('Colina do Jardim Glória', 'city-001'),
('Concórdia', 'city-001'),
('Copacabana', 'city-001'),
('Cristal', 'city-001'),
('Cristo Redentor', 'city-001'),
('Cruzeiro', 'city-001'),
('da Luz', 'city-001'),
('Derminas', 'city-001'),
('Dico Teixeira', 'city-001'),
('dos Vaz', 'city-001'),
('Eldorado', 'city-001'),
('Encosta do Sol', 'city-001'),
('Encosta do Sol II', 'city-001'),
('Fazendinha', 'city-001'),
('Galdino Alvim', 'city-001'),
('Habitat I', 'city-001'),
('Industrial', 'city-001'),
('Jardim Alves do Vale', 'city-001'),
('Jardim Élida', 'city-001'),
('Jardim Esperança', 'city-001'),
('Jardim Glória', 'city-001'),
('Jardim Inês Groppo', 'city-001'),
('Jardim Manacás', 'city-001'),
('Jardim Primavera', 'city-001'),
('Laranjal', 'city-001'),
('Laurindo de Castro', 'city-001'),
('Lavapés', 'city-001'),
('Loteamento Santos Dumont', 'city-001'),
('Louriçal', 'city-001'),
('Major Fusaro', 'city-001'),
('Mangueira Rural', 'city-001'),
('Mateus Schetino', 'city-001'),
('Meu Sonho', 'city-001'),
('Noeme Batalha', 'city-001'),
('Nossa Senhora de Fátima', 'city-001'),
('Novo Horizonte', 'city-001'),
('Novo Primavera', 'city-001'),
('Olaria', 'city-001'),
('Olinda', 'city-001'),
('Oséas Maranhão', 'city-001'),
('Palmeiras', 'city-001'),
('Paulino Fernandes', 'city-001'),
('Paulino Fernandes III', 'city-001'),
('Paulino Fernandes IV', 'city-001'),
('Pedro Miquelito', 'city-001'),
('Peixoto Filho', 'city-001'),
('Peluso', 'city-001'),
('Ponte Preta', 'city-001'),
('Portal das Mangueiras', 'city-001'),
('Quinta das Paineiras', 'city-001'),
('Residencial Altair Rocha', 'city-001'),
('Residencial Estrela Sul', 'city-001'),
('Residencial Jardim Europa', 'city-001'),
('Residencial Monte Belo', 'city-001'),
('Residencial Pires da Luz', 'city-001'),
('Residencial Quinze de Novembro', 'city-001'),
('Residencial Rosa de Toledo', 'city-001'),
('Residencial São José', 'city-001'),
('Residencial São Leopoldo', 'city-001'),
('Residencial São Lucas', 'city-001'),
('San Raphael I', 'city-001'),
('San Raphael II', 'city-001'),
('San Raphael III', 'city-001'),
('Santa Alice', 'city-001'),
('Santa Bernadete', 'city-001'),
('Santa Cândida', 'city-001'),
('Santa Clara', 'city-001'),
('Santa Cruz', 'city-001'),
('Santa Edwiges', 'city-001'),
('Santa Edwiges II', 'city-001'),
('Santa Luzia', 'city-001'),
('Santa Rosa', 'city-001'),
('Santa Terezinha', 'city-001'),
('Santana', 'city-001'),
('Santo Antônio', 'city-001'),
('São Domingos', 'city-001'),
('São Francisco de Assis', 'city-001'),
('São João', 'city-001'),
('São José', 'city-001'),
('São Judas Tadeu', 'city-001'),
('São Mateus', 'city-001'),
('São Pedro', 'city-001'),
('São Sebastião', 'city-001'),
('Seminário', 'city-001'),
('Sobradinho', 'city-001'),
('Sol Nascente', 'city-001'),
('Talma', 'city-001'),
('Tanquinho Doutor José Cavaliere', 'city-001'),
('Tanquinho João Teixeira', 'city-001'),
('Universitário', 'city-001'),
('Vale do Ipê', 'city-001'),
('Vila Casal', 'city-001'),
('Vila Franel', 'city-001'),
('Vila Gonçalves', 'city-001'),
('Vila Mariah', 'city-001'),
('Vila Moreira', 'city-001'),
('Vila Regina', 'city-001'),
('Vitória', 'city-001'),
('Waldemar de Castro', 'city-001'),
('Xangrilá', 'city-001')
ON CONFLICT DO NOTHING;

-- =============================================
-- DADOS INICIAIS - BAIRROS TOCANTINS-MG (14 bairros)
-- =============================================

INSERT INTO neighborhoods (name, city_id) VALUES
('ALTO DA BOA VISTA', 'city-002'),
('BELA VISTA', 'city-002'),
('BOA VISTA', 'city-002'),
('CENTRO', 'city-002'),
('IMPERIAL', 'city-002'),
('PATRIMONIO', 'city-002'),
('GRAMA', 'city-002'),
('FLORESTA', 'city-002'),
('GINASIO', 'city-002'),
('ESPLANADA', 'city-002'),
('TEIXEIRA DE MELO', 'city-002'),
('SÃO GABRIEL', 'city-002'),
('VARZEA', 'city-002'),
('MORRO GRANDE', 'city-002')
ON CONFLICT DO NOTHING;

-- =============================================
-- DADOS INICIAIS - TIPOS DE SERVIÇO
-- =============================================

INSERT INTO service_types (name) VALUES
('ATIVAÇÃO'),
('LOSS'),
('UPGRADE'),
('T.EQUIPAMENTO'),
('SEM CONEXÃO'),
('LENTIDÃO'),
('CONFG. ROTEADOR'),
('MANUTENÇÃO'),
('INSTALAÇÃO'),
('REPARO')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- DADOS INICIAIS - ORDENS DE SERVIÇO
-- =============================================

INSERT INTO service_orders (code, type, status, team_id, alert, scheduled_date, scheduled_time, customer_name, customer_phone, address, description) VALUES
('139390', 'ATIVAÇÃO', 'Concluído', 'team-001', 'Ligar 15 minutos antes', '2025-09-05', '08:00', 'João Silva', '(11) 99999-1234', 'Rua das Flores, 123 - Centro', 'Ativação de linha residencial'),
('125419', 'LOSS', 'Concluído', 'team-001', 'Não pode subir no telhado', '2025-09-05', '14:30', 'Maria Santos', '(11) 88888-5678', 'Av. Principal, 456 - Vila Nova', ''),
('120569', 'UPGRADE', 'Pendente', 'team-001', '', '2025-09-06', '', '', '', '', ''),
('108897', 'T.EQUIPAMENTO', 'Concluído', 'team-002', '', '2025-09-05', '', '', '', '', ''),
('62139', 'LOSS', 'Pendente', 'team-002', '', '2025-09-06', '', '', '', '', ''),
('138210', 'LOSS', 'Concluído', 'team-003', '', '2025-09-05', '', '', '', '', ''),
('125571', 'LOSS', 'Concluído', 'team-003', '', '2025-09-05', '', '', '', '', ''),
('114181', 'SEM CONEXÃO', 'Pendente', 'team-001', 'Equipamento especial necessário', '2025-09-07', '09:30', 'Carlos Oliveira', '(11) 77777-9999', 'Rua das Palmeiras, 789 - Jardim São Paulo', 'Verificar conexão de fibra óptica')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- DADOS INICIAIS - RELATÓRIOS
-- =============================================

INSERT INTO reports (name, date, shift, content) VALUES
('Relatório Diário - 05/09/2025', '2025-09-05', 'Manhã', 'RELATÓRIO DE SERVIÇOS - 05/09/2025 - MANHÃ

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
Pendentes: 0'),

('Relatório Diário - 04/09/2025', '2025-09-04', 'Tarde', 'RELATÓRIO DE SERVIÇOS - 04/09/2025 - TARDE

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
Reagendados: 1'),

('Relatório Semanal - 03/09/2025', '2025-09-03', 'Manhã', 'RELATÓRIO SEMANAL - 03/09/2025 - MANHÃ

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
Taxa de conclusão: 92.7%')
ON CONFLICT DO NOTHING;

-- =============================================
-- VERIFICAÇÃO DOS DADOS
-- =============================================

-- Verificar quantos registros foram inseridos em cada tabela
SELECT 'Técnicos' as tabela, COUNT(*) as total FROM technicians
UNION ALL
SELECT 'Equipes' as tabela, COUNT(*) as total FROM teams
UNION ALL
SELECT 'Cidades' as tabela, COUNT(*) as total FROM cities
UNION ALL
SELECT 'Bairros' as tabela, COUNT(*) as total FROM neighborhoods
UNION ALL
SELECT 'Tipos de Serviço' as tabela, COUNT(*) as total FROM service_types
UNION ALL
SELECT 'Ordens de Serviço' as tabela, COUNT(*) as total FROM service_orders
UNION ALL
SELECT 'Relatórios' as tabela, COUNT(*) as total FROM reports;

-- =============================================
-- FIM DOS SEEDS
-- =============================================