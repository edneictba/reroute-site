# ADR-007 - Real Finance Module Integration

## Status

Accepted for review.

## Contexto

O Portal ja possui Auth, contexto de usuario, workspaces, roles e capabilities conectados ao Supabase. Ate a Sprint 15, os modulos de negocio permaneciam demonstrativos.

A Sprint 16 inicia a primeira leitura real de negocio, escolhendo o modulo Financeiro por ser critico para investidores e por exigir escopo claro de Organization, Workspace, Role, Capability e RLS.

As migrations locais atuais nao incluem tabelas financeiras. Por isso, esta sprint nao cria schema automaticamente e nao aplica migrations no ambiente remoto.

## Decisao

Criar uma camada definitiva para Financeiro:

- `FinanceRepository`: unica camada autorizada a consultar tabelas financeiras no Supabase.
- `FinanceService`: valida contexto autorizado, chama Repository, trata erros e devolve DTOs.
- `Finance DTOs`: normalizam records para a UI.
- `demo-finance provider`: passa a compor dados demonstrativos com dados reais quando disponiveis.

O dashboard e a pagina `/portal/financeiro/` consomem o provider. Graficos, timeline e alertas continuam demonstrativos nesta sprint; os widgets executivos passam a tentar usar dados reais.

## Tabelas Esperadas

- `financial_summaries`
- `financial_transactions`
- `financial_budgets`
- `financial_cash_flows`

Cada tabela deve possuir `organization_id` e `workspace_id`. A seguranca final deve ser aplicada por RLS, nao por filtros de frontend.

## Alternativas Consideradas

- Criar migrations automaticamente nesta sprint: rejeitado por risco operacional e por falta de revisao do schema financeiro final.
- Conectar tudo diretamente em `portal.js`: rejeitado por acoplamento e crescimento dificil.
- Substituir todo o modulo Financeiro por dados reais: rejeitado porque graficos e timeline ainda dependem de modelagem validada.
- Usar service role no frontend ou em funcao sem necessidade: rejeitado por risco de seguranca.

## Consequencias

- O modulo Financeiro fica pronto para consumir dados reais assim que o schema existir.
- Ambientes sem tabelas financeiras exibem estado controlado de `schema_missing`.
- Permissoes ausentes exibem estado controlado de `forbidden`.
- O provider demonstrativo continua garantindo que a experiencia visual nao quebre.

## Riscos

- RLS incorreta no Supabase pode bloquear leituras esperadas ou expor dados indevidos.
- Capabilities financeiras precisam estar seedadas corretamente.
- `portal.js` ainda concentra muita renderizacao e deve ser modularizado antes de mais integracoes reais.
- Os graficos ainda nao representam dados reais nesta etapa.

## Criterios de Evolucao

Antes de conectar escrita financeira ou dados sensiveis completos:

- aprovar schema financeiro;
- aprovar policies RLS;
- criar fixtures ficticias;
- validar em staging;
- registrar auditoria persistente;
- remover capabilities transicionais do Service.
