# ADR-008 - Finance Schema and Row Level Security

## Status

Accepted for review.

## Contexto

A Sprint 16 preparou o frontend para quatro fontes financeiras, mas o schema e as policies ainda nao existiam. Sem esses objetos, o modulo permanecia no estado controlado `schema_missing`.

## Decisao

Criar um modelo financeiro somente de leitura para o Portal:

- `financial_summaries`;
- `financial_transactions`;
- `financial_budgets`;
- `financial_cash_flows`.

Todas as tabelas sao vinculadas a Organization e Workspace. O papel `authenticated` recebe apenas `SELECT`; nenhuma escrita e liberada nesta sprint. A policy exige profile ativo na mesma Organization, membership ativa no Workspace e `finance.read` ou `finance.manage` no contexto daquele Workspace.

As capabilities transicionais `audit.view` e `users.manage` deixam de autorizar o Finance Service.

## Consequencias

- O frontend da Sprint 16 pode consumir o schema sem alteracao visual.
- A RLS nega por padrao usuarios sem membership ou capability financeira.
- Escrita, importacao, anexos e dados reais continuam fora do escopo.
- A aplicacao das migrations permanece uma acao manual e controlada.

## Riscos

- Policies devem ser validadas em Supabase local/staging com usuarios ficticios antes da producao.
- Grants de capability precisam refletir a governanca aprovada para cada role.
- Os registros financeiros ainda dependem de um fluxo administrativo auditavel futuro.

