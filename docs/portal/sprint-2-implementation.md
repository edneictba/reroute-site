# REROUTE Portal - Sprint 2 Implementation

## Escopo

Esta sprint cria a fundacao segura de banco do REROUTE Portal: organizacao, profiles, workspaces, roles, capabilities, investidores, auditoria, funcoes auxiliares, RLS e seeds idempotentes.

Nao foram alterados a Landing Page, o formulario publico de leads, Resend, endpoints existentes ou a tabela `public.leads`.

## Auditoria Inicial

Estrutura encontrada antes da implementacao:

- `supabase/leads.sql`: SQL do cadastro publico de leads, com `public.leads`, RLS habilitado, `INSERT` publico para `anon` e leitura publica bloqueada.
- Nao existia `supabase/migrations/`.
- Nao havia tabelas do Portal, roles, capabilities, investors ou audit logs.

Decisao: preservar `supabase/leads.sql` integralmente e criar uma nova pasta `supabase/migrations/` para o Portal.

## Migrations Criadas

Ordem de execucao:

1. `20260715090000_portal_core_foundation.sql`
2. `20260715091000_portal_roles_capabilities.sql`
3. `20260715092000_portal_investors.sql`
4. `20260715093000_portal_audit.sql`
5. `20260715094000_portal_authorization_functions.sql`
6. `20260715095000_portal_rls.sql`
7. `20260715100000_portal_seed.sql`

## Dependencias

- Supabase Auth (`auth.users`) para `profiles.id`.
- Extensao `pgcrypto` para `gen_random_uuid()`.
- Schema `public`.
- A migration de seeds depende de todas as tabelas ja existirem.
- As policies RLS dependem das funcoes auxiliares de autorizacao.

## Tabelas

### organizations

Organizacao principal e base para crescimento futuro.

Campos principais: `id`, `name`, `slug`, `status`, `created_at`, `updated_at`.

Seed inicial: REROUTE (`slug = reroute`).

### profiles

Perfil interno vinculado a `auth.users.id`.

Campos principais: `organization_id`, `display_name`, `full_name`, `email`, `phone`, `avatar_url`, `status`, `preferred_language`, `timezone`.

O trigger `handle_new_auth_user_profile()` cria um profile basico quando um usuario nasce em Supabase Auth, mas nao concede roles automaticamente.

### workspaces

Areas do Portal: investor, admin, team, advisor, finance e legal.

### workspace_members

Associacao entre profile e workspace. Impede duplicidade por `(workspace_id, profile_id)`.

### roles

Catalogo de papeis por organizacao.

Roles iniciais: `super_admin`, `admin`, `investor`, `employee`, `manager`, `advisor`, `accountant`, `legal`, `auditor`, `support`.

### capabilities

Permissoes granulares efetivas.

Capabilities iniciais:

- `portal.access`
- `profile.view_own`
- `profile.edit_own`
- `workspace.access`
- `investor.view_own`
- `investor.view_general`
- `investor.manage`
- `users.view`
- `users.manage`
- `roles.view`
- `roles.manage`
- `workspaces.view`
- `workspaces.manage`
- `audit.view`
- `audit.export`

### role_capabilities

Relaciona roles e capabilities. O padrao e negar, e apenas grants explicitamente semeados viram `granted = true`.

### user_roles

Atribui roles a profiles, globalmente ou por workspace.

Protecoes:

- role expirada nao concede acesso;
- role suspensa/revogada nao concede acesso;
- indice unico adicional impede duplicidade de roles globais com `workspace_id is null`;
- policies impedem autoatribuicao por usuario comum.

### investors

Estrutura basica para investidores, sem dados financeiros ou documentos sensiveis.

Protecoes:

- `investor_number` entre 1 e 20;
- numero unico por organizacao;
- `profile_id` unico.

### audit_logs

Base de auditoria administrativa.

Protecoes:

- metadata precisa ser objeto JSON;
- metadata limitada a 8192 bytes;
- sem policies de update/delete para usuarios comuns;
- nenhuma senha, token, URL assinada, CPF/RG ou segredo deve ser registrado.

## Funcoes Auxiliares

- `set_updated_at()`: atualiza timestamps.
- `handle_new_auth_user_profile()`: cria profile basico apos criacao em `auth.users`.
- `record_audit_log(...)`: insere log de auditoria por fluxo controlado.
- `current_profile_id()`: retorna `auth.uid()`.
- `is_profile_active()`: valida profile ativo.
- `current_profile_organization_id()`: retorna organizacao do profile ativo.
- `is_organization_member(organization_id)`: valida membro ativo da organizacao.
- `is_workspace_member(workspace_slug)`: valida membro ativo de workspace ativo.
- `has_role(role_slug, workspace_slug)`: valida role ativa e nao expirada.
- `has_capability(capability_key, workspace_slug)`: valida capability efetiva por role ativa. Um grant explicito `false` prevalece sobre grants positivos para o mesmo usuario/capability, mantendo negacao explicita como regra conservadora.
- `enforce_profile_update_scope()`: impede que o dono do profile altere campos administrativos como `organization_id`, `email` e `status` sem `users.manage`.

Todas as funcoes sensiveis usam `search_path` explicito. Funcoes usadas por RLS usam `SECURITY DEFINER` para evitar recursao de policies.

## Policies RLS

RLS foi habilitado em todas as tabelas do Portal.

Resumo:

- `profiles`: usuario ve o proprio profile; administradores com capability veem/gerenciam.
- `workspaces`: usuario ve workspaces onde e membro ativo; administradores autorizados veem/gerenciam.
- `workspace_members`: usuario ve suas associacoes; administradores autorizados gerenciam.
- `roles`: usuario ve suas roles efetivas; administradores autorizados veem/gerenciam.
- `capabilities`: usuario ve capabilities efetivas; administradores autorizados veem.
- `role_capabilities`: usuario ve grants ligados as suas roles; administradores autorizados gerenciam.
- `user_roles`: usuario ve suas atribuicoes; gerenciamento exige `roles.manage` e bloqueia autoatribuicao.
- `investors`: investidor ve somente o proprio registro; administradores autorizados consultam/gerenciam.
- `audit_logs`: consulta exige `audit.view` ou `audit.export`; nao ha update/delete por usuarios comuns.

## Seeds

Seeds idempotentes:

- organizacao REROUTE;
- seis workspaces iniciais;
- dez roles iniciais;
- quinze capabilities iniciais;
- associacoes coerentes entre roles e capabilities.

O seed nao cria usuario, perfil real, administrador real, investidor real, senha, dados financeiros ou dados pessoais.

## Testes Planejados

Antes de aplicar remotamente, revisar em ambiente local:

- rodar migrations em ordem;
- rodar seeds duas vezes e confirmar ausencia de duplicidade;
- criar usuarios ficticios locais no Supabase local;
- atribuir roles manualmente em ambiente local;
- validar que investidor A nao ve `investors` do investidor B;
- validar que usuario comum nao autoatribui role;
- validar que role expirada nao concede capability;
- validar que profile suspenso nao acessa;
- validar que workspace suspenso bloqueia membership;
- validar `investor_number` duplicado;
- validar `investor_number` fora de 1 a 20;
- validar que `audit_logs` nao pode ser alterado por usuario comum.

## Riscos Conhecidos

- Esta sprint define a base de autorizacao, mas a aplicacao remota ainda requer revisao antes de aplicar.
- Grants de `INSERT/UPDATE` em tabelas administrativas dependem de RLS; revisar cuidadosamente antes de producao.
- `record_audit_log` esta preparado, mas sua chamada deve ser feita futuramente por APIs serverless controladas.
- A criacao automatica de profile nasce como `invited`; um fluxo administrativo futuro deve ativar e atribuir roles.

## Procedimento Futuro de Aplicacao

1. Criar backup do banco remoto.
2. Revisar cada migration em pull request ou revisao manual.
3. Aplicar em ambiente local Supabase.
4. Executar testes RLS.
5. Aplicar em staging.
6. Validar Auth, RLS e seeds.
7. Aplicar em producao em janela controlada.

## Reversao

Como estas migrations criam fundacao nova, a reversao deve ser feita somente antes de uso real ou em ambiente isolado.

Ordem conceitual de reversao:

1. Remover policies RLS.
2. Remover seeds, se necessario.
3. Remover funcoes auxiliares.
4. Remover tabelas na ordem inversa: `audit_logs`, `investors`, `user_roles`, `role_capabilities`, `capabilities`, `roles`, `workspace_members`, `workspaces`, `profiles`, `organizations`.

Nunca executar reversao destrutiva em producao sem backup e aprovacao.
