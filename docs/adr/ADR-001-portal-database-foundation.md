# ADR-001 - Portal Database Foundation

## Status

Accepted for review.

## Contexto

O REROUTE Portal precisa de uma base de dados privada sem alterar a Landing Page nem a tabela publica de leads. A arquitetura futura exige organizacao, perfis, workspaces, investidores e auditoria.

## Decisao

Criar migrations separadas em `supabase/migrations/`, preservando `supabase/leads.sql`. A fundacao usa `organizations`, `profiles`, `workspaces`, `workspace_members`, `investors` e `audit_logs`, com UUIDs, timestamps, constraints e RLS.

## Alternativas Consideradas

- Reutilizar um unico SQL monolitico: rejeitado por dificultar revisao.
- Misturar Portal e leads no mesmo arquivo: rejeitado para evitar regressao no cadastro publico.
- Criar tabelas financeiras/documentais agora: rejeitado por estar fora do escopo.

## Consequencias

As entidades centrais ficam prontas para crescimento sem conectar dados de negocio ainda. A aplicacao futura dependera de seeds e atribuicoes administrativas controladas.

## Riscos

- Aplicar migrations sem testar RLS localmente pode criar permissao excessiva.
- Trigger automatico de profile precisa ser validado junto ao fluxo futuro de convite.
