# REROUTE Portal | Sprint 16 - Real Finance Module

Data: 2026-07-15

## Objetivo

Iniciar a primeira integracao de modulo de negocio com dados reais no Portal do Investidor, usando o modulo Financeiro como piloto.

O escopo desta sprint foi restrito a leitura de dados financeiros reais via Supabase anon client, respeitando Auth, Organization, Workspace, Role, Capability e RLS.

## Escopo Implementado

- FinanceRepository definitivo.
- FinanceService definitivo.
- DTOs financeiros.
- Provider financeiro usando Service -> Repository.
- Carregamento assincrono para widgets financeiros.
- Estados `loading`, `empty`, `error`, `success`, `forbidden`, `schema_missing`, `invalid_workspace` e `invalid_organization`.
- Dashboard e pagina `/portal/financeiro/` preparados para consumir dados reais quando as tabelas existirem e a sessao tiver permissao.

## Fora do Escopo

- Nenhum dado financeiro real foi criado.
- Nenhuma migration foi aplicada automaticamente.
- Nenhum Storage foi conectado.
- Nenhum documento real foi conectado.
- Nenhum modulo de Projetos, Roadmap, Documentos, Investidores ou Admin foi convertido para dados reais.
- Nenhum uso de service role foi introduzido.

## Tabelas Financeiras Esperadas

As migrations locais atuais nao contem tabelas financeiras. Para o modulo funcionar em ambiente real, o banco devera fornecer pelo menos:

### `financial_summaries`

Resumo executivo por organizacao e workspace.

Campos esperados pelo frontend:

- `id uuid`
- `organization_id uuid`
- `workspace_id uuid`
- `current_cash numeric`
- `monthly_burn_rate numeric`
- `estimated_runway_months numeric`
- `total_invested numeric`
- `total_executed numeric`
- `available_balance numeric`
- `reserve_amount numeric`
- `budget_usage_percentage numeric`
- `created_at timestamptz`
- `updated_at timestamptz`

### `financial_transactions`

Transacoes financeiras resumidas.

Campos esperados pelo frontend:

- `id uuid`
- `organization_id uuid`
- `workspace_id uuid`
- `transaction_date date`
- `type text`
- `category text`
- `description text`
- `amount numeric`
- `status text`
- `created_at timestamptz`

### `financial_budgets`

Comparativo previsto x realizado por area.

Campos esperados pelo frontend:

- `id uuid`
- `organization_id uuid`
- `workspace_id uuid`
- `label text`
- `category text`
- `planned_amount numeric`
- `actual_amount numeric`
- `reserve_amount numeric`
- `status text`
- `created_at timestamptz`

### `financial_cash_flows`

Serie temporal do fluxo de caixa.

Campos esperados pelo frontend:

- `id uuid`
- `organization_id uuid`
- `workspace_id uuid`
- `period_start date`
- `period_label text`
- `entries numeric`
- `exits numeric`
- `balance numeric`
- `created_at timestamptz`

## Consultas Realizadas

Todas as consultas sao feitas por `src/portal/repositories/finance-repository.js`.

- `financial_summaries`: filtra por `organization_id` e `workspace_id`, ordena por `updated_at desc`, retorna o resumo mais recente.
- `financial_transactions`: filtra por `organization_id` e `workspace_id`, ordena por `transaction_date desc`, limita a 100 registros.
- `financial_budgets`: filtra por `organization_id` e `workspace_id`, ordena por `created_at desc`, limita a 50 registros.
- `financial_cash_flows`: filtra por `organization_id` e `workspace_id`, ordena por `period_start asc`, limita a 24 registros.

## DTOs

Arquivo:

- `src/portal/dtos/finance-dtos.js`

DTOs criados:

- `FinancialSummaryDTO`
- `TransactionDTO`
- `BudgetDTO`
- `CashFlowDTO`
- `RunwayDTO`
- `FinanceWidgetsDTO`

Os DTOs normalizam nomes de campos, convertem numeros, formatam moeda em `pt-BR` e entregam a estrutura esperada pelos cards existentes.

## Service

Arquivo:

- `src/portal/services/finance-service.js`

Responsabilidades:

- validar organizacao ativa;
- validar workspace ativo;
- validar capability financeira;
- chamar o Repository;
- normalizar erros de Supabase;
- converter records em DTOs;
- retornar estado estruturado para a UI.

Capabilities aceitas nesta sprint:

- `finance.read`
- `finance.manage`
- `audit.view`
- `users.manage`

`audit.view` e `users.manage` sao aceitos como compatibilidade transicional com seeds existentes. A permissao definitiva recomendada e `finance.read`.

## Provider

Arquivo:

- `src/portal/providers/demo-finance.js`

O provider continua expondo dados demonstrativos para graficos, timeline e alertas. A nova funcao `getFinanceData(context)` tenta buscar dados reais e substitui apenas estruturas financeiras executivas quando o Service retorna sucesso.

## UI

Arquivo:

- `src/portal/core/portal.js`

Alteracoes:

- dashboard financeiro passa a carregar assincronamente;
- pagina `/portal/financeiro/` passa a exibir estado de carregamento;
- widgets financeiros exibem sucesso, vazio, erro, sem permissao ou tabelas ausentes;
- graficos, timeline e alertas continuam demonstrativos.

## Seguranca

A UI nunca usa service role.

A filtragem visual por Organization e Workspace existe apenas como escopo de consulta. A seguranca efetiva deve continuar sendo garantida por RLS no Supabase.

Policies futuras devem:

- permitir SELECT somente para usuarios autenticados;
- exigir membership ativa no workspace;
- exigir capability `finance.read` ou `finance.manage`;
- filtrar por `organization_id` e `workspace_id`;
- negar acesso publico anonimo sem sessao.

## Validacao

Comandos executados nesta sprint:

- `npm run lint`
- `npm run build`

Rotas de validacao:

- `/portal/dashboard/`
- `/portal/financeiro/`

## Limitacoes Atuais

- As tabelas financeiras ainda nao existem nas migrations locais.
- Dados reais dependem de schema e RLS no Supabase remoto.
- O modulo ainda nao possui escrita, anexos, auditoria persistente propria ou workflow administrativo.
- Graficos permanecem demonstrativos por decisao de escopo.

## Pendencias Recomendadas

1. Criar ADR/migration de schema financeiro.
2. Criar policies RLS especificas para financeiro.
3. Criar seeds ficticias para ambiente staging.
4. Remover capabilities transicionais quando `finance.read` estiver consolidada.
5. Evoluir graficos para usar `financial_cash_flows` reais.
