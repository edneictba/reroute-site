# ADR-006 - Real Supabase User Context

## Status

Accepted for review.

## Contexto

O Portal ja possuia autenticacao Supabase Auth e um contexto de autorizacao real concentrado em `src/portal/auth/user-context.js`. A Sprint 15 precisava consolidar essa integracao em camadas mais claras, sem conectar modulos de negocio reais, sem aplicar migrations automaticamente e sem usar `service_role`.

## Decisao

Manter Supabase Auth como provedor de sessao e carregar o contexto real do usuario a partir das tabelas privadas do Portal:

- `profiles`
- `organizations`
- `workspace_members`
- `workspaces`
- `user_roles`
- `roles`
- `role_capabilities`
- `capabilities`

O frontend passa a usar repositories, DTOs, models e services para normalizar os dados antes de entregar o contexto ao Portal.

As paginas continuam sem chamar o SDK diretamente. A seguranca continua dependendo de RLS e policies no Supabase.

## Alternativas Consideradas

- Manter tudo em `user-context.js`: rejeitado por dificultar crescimento e testes.
- Criar bypass demonstrativo amplo: rejeitado por risco de falso positivo.
- Inferir permissao pelo nome da role: rejeitado porque capabilities sao a unidade efetiva.
- Criar ou aplicar migrations nesta sprint: rejeitado pelo escopo e pelo risco de alterar ambiente remoto.

## Consequencias

- A camada de contexto fica mais preparada para evoluir.
- Modulos de negocio continuam demonstrativos.
- Ambientes sem migrations aplicadas seguem bloqueando o Portal com erro controlado.
- Testes reais dependem de Supabase local/staging com fixtures ficticias autorizadas.

## Riscos

- RLS incorreta no ambiente remoto pode bloquear leituras esperadas ou expor dados indevidos.
- `portal.js` ainda e monolitico e deve ser modularizado antes de conectar mais dados reais.
- Capabilities novas exigem seed/migration futura revisada.
- O uso de CDN do Supabase SDK ainda deve ser reavaliado antes de ambiente privado sensivel.
