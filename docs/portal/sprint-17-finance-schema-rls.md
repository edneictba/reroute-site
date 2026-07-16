# REROUTE Portal | Sprint 17 - Schema Financeiro e RLS

Data: 2026-07-15

## Objetivo

Entregar a base persistente e segura esperada pelo modulo Financeiro da Sprint 16, sem inserir dados reais, alterar componentes ou habilitar escrita.

## Escopo Implementado

- quatro tabelas financeiras com constraints e indices por Organization/Workspace;
- triggers de atualizacao no resumo financeiro;
- RLS habilitada nas quatro tabelas;
- acesso anonimo revogado;
- `SELECT` exclusivo para usuarios autenticados e autorizados;
- helper `can_read_finance_workspace`;
- capabilities `finance.read` e `finance.manage` com seed idempotente;
- remocao das capabilities transicionais no Finance Service;
- validacao estatica ampliada e teste SQL isolado de constraints.

## Arquivos de Migration

- `20260715110000_portal_finance_schema.sql`
- `20260715111000_portal_finance_rls.sql`
- `20260715112000_portal_finance_seed.sql`

## Seguranca

Uma leitura financeira requer simultaneamente:

1. profile ativo;
2. Organization do registro igual a Organization do profile;
3. Workspace ativo;
4. membership ativa no Workspace;
5. `finance.read` ou `finance.manage` aplicavel ao Workspace.

Nao existem policies ou grants de `INSERT`, `UPDATE` ou `DELETE` para usuarios do Portal nesta sprint. Nenhuma service role foi usada.

## Dados e Deploy

- nenhum dado financeiro foi criado;
- nenhuma migration foi aplicada automaticamente;
- nenhum ambiente remoto foi alterado;
- landing page, identidade visual, leads, Resend e componentes nao foram alterados.

## Validacao Prevista

- `node supabase/tests/portal/validate_migrations_static.js`;
- `npm run lint`;
- `npm run build`;
- `node --check` nos arquivos JavaScript do Portal;
- teste SQL em Supabase local/staging ainda depende de ambiente configurado.

## Proxima Sprint Recomendada

Sprint 18: fixtures financeiras exclusivamente ficticias em staging e testes RLS por perfis (investidor autorizado, membro sem capability, usuario de outro Workspace e anonimo). Depois disso, conectar os graficos ao fluxo de caixa real.

