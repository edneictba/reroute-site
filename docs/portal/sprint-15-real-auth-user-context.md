# REROUTE Portal | Sprint 15 - Integracao Real com Supabase Auth e Contexto do Usuario

Data: 2026-07-15

## Objetivo

Consolidar a integracao real do Portal com Supabase Auth e com o contexto autorizado do usuario:

- usuario autenticado;
- profile;
- organization;
- workspaces;
- memberships;
- roles;
- capabilities;
- active workspace;
- guards;
- menu dinamico;
- dashboard contextual.

Os modulos de negocio permanecem demonstrativos.

## Auditoria Inicial

Foi encontrada uma implementacao real parcial ja existente:

- `src/portal/lib/supabase-client.js`: cliente Supabase unico.
- `src/portal/services/auth-service.js`: login, logout, session, recovery e reset.
- `src/portal/providers/auth-provider.js`: estado de sessao.
- `src/portal/auth/user-context.js`: carregava profile, organization, workspaces, roles e capabilities diretamente do Supabase.
- `src/portal/guards/route-guard.js`: protecao de rotas com capabilities.
- `src/portal/core/navigation.js`: menu derivado de capabilities.

Lacuna encontrada:

- `docs/portal/sprint-14-data-layer.md` nao existe neste workspace.
- Nao existiam pastas reais de `repositories`, `models` ou `dtos` antes desta sprint.

## Migrations Existentes no Projeto

As migrations locais contem as tabelas esperadas:

- `organizations`
- `profiles`
- `workspaces`
- `workspace_members`
- `roles`
- `user_roles`
- `capabilities`
- `role_capabilities`
- `investors`
- `audit_logs`

Nenhuma migration foi aplicada automaticamente.

## Arquitetura Real Implementada

### Cliente Supabase

Arquivo:

- `src/portal/lib/supabase-client.js`

Mantem uma unica instancia do Supabase Client.

Variaveis publicas aceitas pelo build/config:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- fallback: `SUPABASE_URL`
- fallback: `SUPABASE_ANON_KEY`

Nao ha uso de `SUPABASE_SERVICE_ROLE_KEY`.

### Repositories

Criados:

- `src/portal/repositories/auth-repository.js`
- `src/portal/repositories/profile-repository.js`
- `src/portal/repositories/organization-repository.js`
- `src/portal/repositories/workspace-repository.js`
- `src/portal/repositories/role-repository.js`
- `src/portal/repositories/capability-repository.js`

Responsabilidade:

- concentrar chamadas ao Supabase;
- impedir chamadas diretas das paginas ao SDK;
- ler apenas dados necessarios;
- respeitar RLS.

### DTOs e Models

Criados:

- `src/portal/dtos/portal-dtos.js`
- `src/portal/models/user-context-models.js`

Responsabilidade:

- transformar registros do Supabase em objetos normalizados;
- evitar espalhar formato bruto do banco pela aplicacao;
- manter compatibilidade com o Portal atual.

### Services

Criados:

- `src/portal/services/authorization-service.js`
- `src/portal/services/user-context-service.js`

Alterado:

- `src/portal/services/auth-service.js`

Responsabilidade:

- autenticar via repository;
- resolver contexto real;
- validar status;
- resolver capabilities efetivas;
- negar por padrao;
- expor helpers de autorizacao.

## Fluxo Real de Autenticacao

1. Login chama `signIn()` em `auth-service`.
2. `auth-service` chama `auth-repository`.
3. `auth-repository` chama Supabase Auth.
4. `auth-provider` preserva sessao, user e listener de auth.
5. Guards carregam o contexto quando a rota exige `data-context-required="true"`.

Funcoes disponiveis:

- `getSession()`
- `getCurrentUser()`
- `signIn()`
- `signOut()`
- `onAuthStateChange()`
- `requestPasswordReset()`
- `updatePassword()`
- `refreshSession()`

## Fluxo de Profile

1. `profileRepository.getByAuthUserId(authUser.id)`.
2. `ProfileDTO.fromRecord()`.
3. Validacao de status.

Estados:

- sem profile: bloqueado;
- `invited`: bloqueado;
- `active`: continua;
- `suspended`: bloqueado;
- `disabled`: bloqueado.

O frontend nao altera status do profile.

## Fluxo de Organization

1. Organization e lida pelo `organization_id` do profile.
2. `organizationRepository.getById(profile.organizationId)`.
3. `OrganizationDTO.fromRecord()`.
4. Organization precisa existir e estar `active`.

Nenhum `organization_id` vindo de URL e usado como fonte de confianca.

## Fluxo de Workspaces

1. `workspaceRepository.listMembershipsForProfile(profile.id)`.
2. `WorkspaceDTO.fromMembershipRecord()`.
3. Sao aceitos somente:
   - membership `active`;
   - workspace `active`;
   - mesma organization do profile.

O usuario nao ganha acesso por conhecer um slug.

## Fluxo de Roles

1. `roleRepository.listUserRolesForProfile(profile.id)`.
2. `RoleDTO.fromUserRoleRecord()`.
3. Sao aceitas somente roles:
   - ativas;
   - nao expiradas;
   - da mesma organization;
   - globais ou vinculadas a workspace permitido.

Permissao nao e inferida pelo nome da role.

## Fluxo de Capabilities

1. `capabilityRepository.listForRoleIds(roleIds)`.
2. `CapabilityDTO.fromRoleCapabilityRecord()`.
3. `getEffectiveCapabilities()` resolve:
   - negar por padrao;
   - `granted=true` concede;
   - `granted=false` remove grant positivo;
   - duplicidades eliminadas via `Set`.

Helpers:

- `hasCapability()`
- `hasAnyCapability()`
- `hasAllCapabilities()`
- `getEffectiveCapabilities()`
- `canAccessWorkspace()`

## Active Workspace

Prioridade:

1. preferencia salva no navegador, se ainda autorizada;
2. workspace vinculado a role contextual;
3. workspace coerente com role principal;
4. primeiro workspace ativo permitido.

Persistencia:

- apenas slug do workspace;
- nunca tokens, roles ou capabilities.

## Guards

Atualizado:

- `src/portal/guards/route-guard.js`

Helpers expostos:

- `requireAuth()`
- `requireProfile()`
- `requireActiveProfile()`
- `requireOrganization()`
- `requireWorkspace()`
- `requireCapability()`
- `requireCapabilities()`

Fluxo:

Sessao -> profile -> status -> organization -> workspace -> role -> capability -> rota.

## Navegacao

Arquivo:

- `src/portal/core/navigation.js`

O menu continua derivado de capabilities reais do contexto.

Exemplos:

- Dashboard: `portal.access`, `workspace.access`
- Investidores: `investor.manage`
- Admin Center: `users.manage`, `roles.view`, `audit.view`

Itens sem permissao nao aparecem, e as rotas seguem protegidas por guard.

## Header e Dashboard Contextual

O Portal exibe:

- nome por `displayName`;
- fallback para `fullName`;
- fallback para e-mail;
- avatar real quando `avatarUrl` existir;
- organization;
- workspace ativo;
- role contextual;
- status do profile;
- data/hora de carregamento do contexto.

Dashboard atualizado:

- adicionada metrica `Sessao: Autenticada`;
- aviso: dados de negocio permanecem demonstrativos nesta fase.

## Estados Tratados

- sem sessao;
- sem profile;
- profile invited;
- profile suspended;
- profile disabled;
- organization ausente;
- organization inativa;
- sem workspace;
- sem role;
- sem capability;
- erro de rede;
- tabelas ausentes/migrations nao aplicadas;
- sessao expirada.

## Seguranca

Confirmado na implementacao:

- nenhuma service role no frontend;
- paginas nao chamam Supabase diretamente;
- capabilities nao ficam em localStorage;
- active workspace e revalidado contra workspaces permitidos;
- roles expiradas sao ignoradas;
- organization vem do profile;
- RLS permanece a barreira principal;
- dados reais de contexto sao aplicados via `textContent` no renderer atual, exceto avatar URL como background visual.

## Testes

| Teste | Status | Observacao |
| --- | --- | --- |
| Migrations locais contem tabelas esperadas | PASS | Arquivos SQL locais encontrados. |
| `node --check` | PASS | 27 arquivos JS em `src/portal` validados. |
| `npm run lint` | PASS | Lint concluido sem erros. |
| `npm run build` | PASS | Build concluido em `dist/`. |
| Rotas HTTP locais | PASS | 15 rotas do Portal retornaram HTTP 200 em servidor estatico temporario. |
| Login valido | PENDING | Depende de ambiente Supabase com usuario ficticio. |
| Login invalido | PENDING | Depende de ambiente Supabase. |
| Sessao restaurada | PENDING | Depende de ambiente Supabase. |
| Usuario sem profile | PENDING | Depende de fixture. |
| Profile invited/suspended/disabled | PENDING | Depende de fixtures. |
| Organization ativa/inativa | PENDING | Depende de fixtures. |
| Sem workspace/membership suspended | PENDING | Depende de fixtures. |
| Role valida/expirada | PENDING | Depende de fixtures. |
| Capability presente/ausente | PENDING | Depende de fixtures. |
| Investor tentando admin | PENDING | Depende de fixtures. |
| Admin acessando admin | PENDING | Depende de fixtures. |
| Logout | PENDING | Depende de ambiente Supabase. |
| Falha de rede | REVIEW | Tratamento existe; simulacao nao executada. |

## Configuracao Manual Necessaria

1. Aplicar migrations locais em ambiente Supabase local/staging autorizado.
2. Aplicar seeds de organization, workspaces, roles e capabilities.
3. Criar usuarios ficticios de teste com dominio reservado.
4. Criar profiles e memberships coerentes.
5. Configurar variaveis publicas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

ou:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

6. Configurar Redirect URLs do Supabase Auth para recovery/reset.

## Pendencias

- Testes E2E reais com usuario ficticio.
- Fixtures locais/staging.
- Modularizacao futura de `portal.js`.
- Estrategia para CDN/SRI do Supabase SDK.
- Documentacao ausente da Sprint 14 deve ser criada ou recuperada.

## Confirmacoes

- Nenhuma tabela foi criada nesta sprint.
- Nenhuma migration foi aplicada automaticamente.
- Nenhum dado financeiro real foi conectado.
- Nenhum documento real foi conectado.
- Nenhum Storage foi conectado.
- Nenhum projeto real foi conectado.
- Nenhum investidor real foi criado.
- Nenhuma service role foi exposta.
- Nenhuma funcionalidade da Landing Page foi alterada.
- Nenhum fluxo de leads foi alterado.
- Resend nao foi alterado.
- Nenhum commit foi realizado.
- Nenhum deploy foi realizado.
