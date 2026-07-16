# REROUTE Portal - Sprint 3 Validation

## Escopo

Validacao tecnica da fundacao criada na Sprint 2: migrations, RLS, roles, capabilities, seeds, auditoria e procedimentos futuros.

Nao foram alterados: Landing Page, formulario de leads, Resend, endpoints existentes, visual do Portal, dashboard conectado ou login de interface.

## Ambiente Disponivel

Ferramentas verificadas:

- Supabase CLI: nao disponivel.
- Docker: nao disponivel.
- PostgreSQL local: nao disponivel.
- `psql`: nao disponivel.
- Ambiente Supabase local configurado: nao encontrado.

Decisao: nao instalar ferramentas. A validacao executada nesta sprint foi estatica e reproduzivel. Os testes SQL reais foram preparados para execucao futura em ambiente local/isolado.

## Arquivos Revisados

- `docs/portal/database-architecture.md`
- `docs/portal/authorization.md`
- `docs/portal/security.md`
- `docs/portal/audit.md`
- `docs/portal/sprint-2-implementation.md`
- `docs/adr/ADR-001-portal-database-foundation.md`
- `docs/adr/ADR-002-roles-and-capabilities.md`
- `docs/adr/ADR-003-row-level-security.md`
- `supabase/migrations/*.sql`
- `supabase/leads.sql`

## Ordem das Migrations

1. `20260715090000_portal_core_foundation.sql`
2. `20260715091000_portal_roles_capabilities.sql`
3. `20260715092000_portal_investors.sql`
4. `20260715093000_portal_audit.sql`
5. `20260715094000_portal_authorization_functions.sql`
6. `20260715095000_portal_rls.sql`
7. `20260715100000_portal_seed.sql`

## Dependencias Validadas Estaticamente

- `organizations` e `profiles` sao criadas antes de `workspaces`, `roles`, `investors` e `audit_logs`.
- `profiles.id` referencia `auth.users(id)`.
- `set_updated_at()` e criada antes dos triggers de update.
- Funcoes auxiliares sao criadas antes das policies RLS que as utilizam.
- Seeds rodam por ultimo, apos tabelas, funcoes e policies.
- Nenhuma migration do Portal referencia `public.leads`.

## Correcoes Realizadas

### Explicit deny em capabilities

Arquivo: `supabase/migrations/20260715094000_portal_authorization_functions.sql`

Motivo: a validacao da Sprint 3 exigia que `granted=false` prevalecesse conforme a arquitetura documentada. A funcao `has_capability()` agora considera capabilities efetivas e retorna `false` se houver qualquer grant explicito `false` para o usuario/capability no escopo efetivo.

### Comentario com referencia a leads

Arquivo: `supabase/migrations/20260715090000_portal_core_foundation.sql`

Motivo: remover mencao textual a leads das migrations do Portal para que a auditoria estatica confirme ausencia total de referencia a `public.leads` nas migrations privadas.

## Testes Executados

| Teste | Resultado | Observacao |
| --- | --- | --- |
| Lint do projeto | PASS | `npm run lint` executado com sucesso. |
| Build do projeto | PASS | `npm run build` executado com sucesso. |
| Validacao estatica das migrations | PASS | `node supabase/tests/portal/validate_migrations_static.js`. |
| Ordem das migrations | PASS | Sequencia por timestamp validada pelo script. |
| Objetos esperados | PASS | Tabelas, funcoes e policies esperadas encontradas. |
| Policies abertas | PASS | Nenhuma `USING (true)` ou `WITH CHECK (true)` nas migrations. |
| Referencia a `public.leads` nas migrations | PASS | Nenhuma referencia nas migrations do Portal. |
| Chave service role | PASS | Nenhuma chave ou uso de service role nas migrations. |
| Execucao real das migrations | PENDING | Sem Supabase CLI/Docker/PostgreSQL/psql local. |
| Seed idempotency real | PENDING | Script SQL criado, nao executado. |
| RLS real entre usuarios | PENDING | Scripts SQL criados, nao executados. |
| Carga inicial local | PENDING | Sem banco local disponivel. |

## Testes Criados Para Execucao Futura

Pasta: `supabase/tests/portal/`

- `validate_migrations_static.js`
- `test_seed_idempotency.sql`
- `test_constraints.sql`
- `test_profiles_rls.sql`
- `test_investors_rls.sql`
- `test_workspace_access.sql`
- `test_roles_capabilities.sql`
- `test_audit_permissions.sql`

Os testes SQL usam dados ficticios com dominio `example.test` e devem ser executados apenas em Supabase local/isolado.

## Matriz de Roles e Capabilities

| Role | Capabilities |
| --- | --- |
| super_admin | `portal.access`, `profile.view_own`, `profile.edit_own`, `workspace.access`, `investor.view_own`, `investor.view_general`, `investor.manage`, `users.view`, `users.manage`, `roles.view`, `roles.manage`, `workspaces.view`, `workspaces.manage`, `audit.view`, `audit.export` |
| admin | `portal.access`, `profile.view_own`, `profile.edit_own`, `workspace.access`, `investor.view_general`, `investor.manage`, `users.view`, `users.manage`, `roles.view`, `workspaces.view`, `workspaces.manage`, `audit.view` |
| investor | `portal.access`, `profile.view_own`, `profile.edit_own`, `workspace.access`, `investor.view_own` |
| employee | `portal.access`, `profile.view_own`, `profile.edit_own`, `workspace.access` |
| manager | `portal.access`, `profile.view_own`, `profile.edit_own`, `workspace.access`, `workspaces.view` |
| advisor | `portal.access`, `profile.view_own`, `profile.edit_own`, `workspace.access` |
| accountant | `portal.access`, `profile.view_own`, `profile.edit_own`, `workspace.access` |
| legal | `portal.access`, `profile.view_own`, `profile.edit_own`, `workspace.access` |
| auditor | `portal.access`, `profile.view_own`, `workspace.access`, `audit.view`, `audit.export` |
| support | `portal.access`, `profile.view_own`, `workspace.access`, `users.view` |

Confirmacoes estaticas:

- `investor` nao possui `investor.manage`.
- `investor` nao possui `users.manage`.
- `investor` nao possui `roles.manage`.
- `investor` nao possui `audit.view`.
- `investor.view_general` nao foi concedida a `investor`.
- Negacao por padrao existe: capabilities nao semeadas nao sao concedidas.
- Negacao explicita existe: `granted=false` prevalece em `has_capability()`.

## Resultado dos Testes de RLS

| Area | Resultado | Observacao |
| --- | --- | --- |
| Profiles | PENDING | `test_profiles_rls.sql` criado, depende de banco local e fixtures. |
| Investors | PENDING | `test_investors_rls.sql` criado, depende de Investor 01/02 ficticios. |
| Workspaces | PENDING | `test_workspace_access.sql` criado. |
| Roles/capabilities | PENDING | `test_roles_capabilities.sql` criado. |
| Auditoria | PENDING | `test_audit_permissions.sql` criado. |

## Revisao SECURITY DEFINER

| Funcao | Finalidade | Search path | Public execute | Risco |
| --- | --- | --- | --- | --- |
| `handle_new_auth_user_profile()` | Criar profile basico apos `auth.users` | `public, auth` | Nao concedido | REVIEW: validar owner ao aplicar. |
| `record_audit_log()` | Inserir log controlado | `public` | Revogado de `public` | REVIEW: usar futuramente via API/server-side. |
| `current_profile_id()` | Retornar `auth.uid()` | `public, auth` | Revogado de `public`; granted authenticated | Baixo. |
| `is_profile_active()` | Bloquear usuario suspenso/disabled | `public, auth` | Revogado de `public`; granted authenticated | Baixo. |
| `current_profile_organization_id()` | Evitar subquery recursiva em profile update | `public, auth` | Revogado de `public`; granted authenticated | Baixo. |
| `is_organization_member()` | Validar organizacao ativa | `public, auth` | Revogado de `public`; granted authenticated | Baixo. |
| `is_workspace_member()` | Validar workspace membership | `public, auth` | Revogado de `public`; granted authenticated | Baixo. |
| `has_role()` | Resolver role ativa e nao expirada | `public, auth` | Revogado de `public`; granted authenticated | REVIEW: validar em banco local. |
| `has_capability()` | Resolver capability com explicit deny | `public, auth` | Revogado de `public`; granted authenticated | REVIEW: validar em banco local. |
| `enforce_profile_update_scope()` | Bloquear edicao de campos administrativos pelo dono do profile | `public, auth` | Revogado de `public` | Baixo. |

Nao ha SQL dinamico, nomes de tabela montados por string, senha/token ou dependencia de parametros livres do frontend para determinar identidade. A identidade vem de `auth.uid()`.

## Auditoria

Validado estaticamente:

- `metadata` deve ser JSON object.
- `metadata` limitada a 8192 bytes.
- Nao ha policy de update/delete para usuarios comuns.
- Consulta exige `audit.view` ou `audit.export`.

Pendente:

- Criacao real de log administrativo.
- Validacao de actor/organization em banco local.
- Tentativa real de update/delete por usuario comum.

## Indices e Desempenho Inicial

Indices criados para:

- FKs e filtros frequentes (`organization_id`, `profile_id`, `workspace_id`, `status`).
- Resolucao de roles e memberships.
- Auditoria por organizacao/data, actor/data e entidade.
- Unicidade de roles globais com `workspace_id is null`.

Teste de carga local: PENDING por ausencia de banco local. Nao foram adicionados indices novos nesta sprint alem dos ja existentes.

## Checklist Antes de Aplicar no Supabase Remoto

- REVIEW: aplicar em Supabase local com banco limpo.
- REVIEW: executar seeds duas vezes.
- REVIEW: criar usuarios ficticios locais.
- REVIEW: executar todos os SQLs em `supabase/tests/portal/`.
- REVIEW: revisar owner das funcoes `SECURITY DEFINER`.
- REVIEW: validar RLS com JWTs ficticios para Investor 01/02/Admin/Suspended.
- REVIEW: validar que `public.leads` segue funcionando sem alteracao.
- REVIEW: fazer backup antes de staging/producao.

## Comandos Futuros

Exemplo quando houver Supabase local:

```bash
supabase start
supabase db reset
cd supabase/tests/portal
psql "$SUPABASE_DB_URL" -f test_seed_idempotency.sql
psql "$SUPABASE_DB_URL" -f test_constraints.sql
psql "$SUPABASE_DB_URL" -f test_profiles_rls.sql
psql "$SUPABASE_DB_URL" -f test_investors_rls.sql
psql "$SUPABASE_DB_URL" -f test_workspace_access.sql
psql "$SUPABASE_DB_URL" -f test_roles_capabilities.sql
psql "$SUPABASE_DB_URL" -f test_audit_permissions.sql
```

## Aprovacao

Status: REVIEW, ainda nao aprovado para aplicar em producao.

Motivo: a validacao estatica passou, mas os testes reais de RLS, constraints, fixtures e carga precisam ser executados em ambiente Supabase local/staging antes do remoto.

## Proxima Etapa Recomendada

Sprint 4: configurar ambiente Supabase local/staging, executar migrations, criar fixtures ficticias, rodar os testes SQL e ajustar somente falhas reais encontradas.
