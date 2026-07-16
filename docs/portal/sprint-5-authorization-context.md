# REROUTE Portal - Sprint 5 Authorization Context

## Escopo

Integra o usuario autenticado com profile, organization, workspaces, roles e capabilities. O dashboard permanece demonstrativo e nenhum modulo de negocio foi conectado.

## Arquitetura da Camada de Contexto

Arquivos principais:

- `src/portal/auth/user-context.js`
- `src/portal/core/navigation.js`
- `src/portal/guards/route-guard.js`
- `src/portal/core/portal.js`

O contexto centralizado contem:

- `authUser`
- `profile`
- `organization`
- `workspaces`
- `roles`
- `capabilities`
- `activeWorkspace`
- `loading`
- `error`
- `isAuthenticated`
- `isAuthorized`

## Fluxo de Carregamento

1. Guard valida sessao Supabase Auth.
2. Se a rota exige contexto, chama `loadUserContext(authUser)`.
3. O contexto carrega `profiles` pelo `auth.uid()`.
4. Valida `profile.status`.
5. Carrega organization vinculada e valida `status`.
6. Carrega memberships ativos em workspaces ativos.
7. Carrega roles ativas, nao expiradas e coerentes com organization/workspace.
8. Resolve capabilities a partir de `role_capabilities`.
9. Define `activeWorkspace`.
10. Libera a rota apenas se houver `portal.access` e `workspace.access`.

## Regras de Profile

- Sem profile: acesso negado.
- `invited`: acesso negado ate ativacao futura.
- `active`: segue o carregamento.
- `suspended`: acesso bloqueado.
- `disabled`: acesso bloqueado.

O frontend nao permite alterar status do profile. RLS continua sendo a barreira principal.

## Regras de Organization

- A organization vem exclusivamente do profile.
- Nenhum `organization_id` e aceito da URL.
- Organization inexistente ou inativa bloqueia acesso.

## Regras de Workspace

- Workspaces sao carregados somente via `workspace_members`.
- Membership precisa ser `active`.
- Workspace precisa ser `active`.
- `activeWorkspace` e validado contra memberships.
- Apenas o slug do workspace ativo pode ser persistido como preferencia visual.

## Regras de Roles

Roles validas exigem:

- `user_roles.status = active`
- `roles.status = active`
- `expires_at` ausente ou futuro
- mesma organization do profile
- workspace vinculado apenas quando o usuario possui membership ativo

Nenhuma permissao e inferida somente pelo nome da role.

## Resolucao de Capabilities

Capabilities sao resolvidas a partir de `role_capabilities`.

Regras:

- negacao por padrao;
- `granted=false` remove grant positivo do mesmo capability;
- resultado fica em `Set`;
- nenhuma capability e definida em localStorage;
- frontend apenas reflete autorizacao fornecida pelo banco/RLS.

## Guard

`protectPrivatePage()` agora suporta:

- sessao obrigatoria;
- contexto obrigatorio por `data-context-required="true"`;
- capabilities obrigatorias por `data-required-capabilities`;
- redirect seguro para `/portal/acesso-negado/`;
- redirect seguro para login com `returnTo` interno.

## Navegacao Dinamica

`src/portal/core/navigation.js` define itens por capability.

Itens iniciais:

- Visao geral: `portal.access`, `workspace.access`
- Meu perfil: `profile.view_own`
- Projeto: `portal.access`
- Usuarios: `users.view`
- Auditoria: `audit.view`

Ocultar menu nao substitui protecao de rota.

## Header e Dashboard

O header exibe:

- nome contextual;
- avatar generico com inicial;
- seletor de workspace quando houver mais de um workspace;
- logout.

O dashboard exibe:

- organizacao;
- workspace ativo;
- role contextual;
- status do profile;
- data/hora de carregamento do contexto.

Os cards de negocio continuam demonstrativos.

## Estados

Estados tratados:

- profile inexistente;
- profile invited;
- profile suspended;
- profile disabled;
- organization inativa;
- sem workspace;
- sem role;
- sem `portal.access` / `workspace.access`;
- erro ao carregar contexto;
- tabelas do Portal ausentes no ambiente.

## Testes Executados

| Teste | Resultado | Observacao |
| --- | --- | --- |
| Sintaxe JS | PASS | `node --check` nos modulos do Portal. |
| Lint | PASS | `npm run lint`. |
| Build | PASS | `npm run build`. |
| Rotas estaticas no dist | PASS | Dashboard e acesso negado retornaram HTTP 200. |
| Contexto real com banco | PENDING | Depende das migrations aplicadas em Supabase local/staging. |
| Profiles/roles/workspaces reais | PENDING | Depende de fixtures ficticias. |
| Menu dinamico real | PENDING | Depende de capabilities reais. |

## Limitacoes

- Nao ha modo mock/bypass de autorizacao.
- Se as migrations nao estiverem aplicadas no Supabase usado, o dashboard nao e liberado.
- A autorizacao final continua dependente de RLS.
- Modulos Financeiro, Projetos, Documentos, Investidores, Relatorios e Comunicados nao foram conectados.

## Como Testar Localmente

1. Aplicar migrations da Sprint 2 em Supabase local/staging.
2. Criar usuarios ficticios com dominio `example.test`.
3. Criar profiles ativos, memberships, roles e capabilities.
4. Configurar:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

5. Rodar:

```powershell
npm run build
py -m http.server 4174 --directory dist
```

6. Abrir `/portal/login/` e acessar `/portal/dashboard/`.

## Proximos Passos

Sprint 6: criar fixtures locais/staging e validar E2E o contexto real com usuarios ficticios, sem conectar modulos de negocio.
