# ADR-002 - Roles and Capabilities

## Status

Accepted for review.

## Contexto

O Portal precisa proteger workspaces diferentes sem depender apenas do frontend. Roles descrevem papeis institucionais; capabilities representam permissoes granulares efetivas.

## Decisao

Implementar RBAC com `roles`, `capabilities`, `role_capabilities` e `user_roles`. Roles podem ser globais ou vinculadas a workspace. Capabilities sao verificadas por funcoes auxiliares usadas em RLS.

## Alternativas Consideradas

- Guardar permissoes em JSON no profile: rejeitado por dificultar auditoria e constraints.
- Usar somente roles sem capabilities: rejeitado por ser pouco granular.
- Conceder `super_admin` automaticamente: rejeitado por risco de escalada de privilegio.

## Consequencias

O frontend pode consultar permissao para UX, mas a fonte de verdade fica no banco/RLS. Novos modulos podem adicionar capabilities sem redesenhar a autorizacao.

## Riscos

- Grants administrativos precisam ser revisados antes de producao.
- Seeds de capabilities devem evoluir de forma controlada para evitar excesso de permissao.
