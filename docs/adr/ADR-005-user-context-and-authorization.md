# ADR-005 - User Context and Authorization

## Status

Accepted for review.

## Contexto

A autenticacao do Portal ja valida sessao Supabase Auth. A Sprint 5 precisa transformar a sessao em contexto autorizado sem conectar modulos de negocio e sem confiar em roles definidas pelo navegador.

## Decisao

Criar uma camada central `user-context` que carrega profile, organization, workspaces, roles e capabilities a partir do Supabase. O guard libera rotas privadas somente quando o contexto estiver autorizado e possuir capabilities minimas. A navegacao passa a ser derivada de capabilities.

## Alternativas Consideradas

- Inferir permissao pelo e-mail ou metadata do usuario: rejeitado por inseguro.
- Usar apenas `role === "admin"` no frontend: rejeitado porque roles nao sao capabilities.
- Criar mock amplo de autorizacao: rejeitado para evitar falso positivo em ambiente sem migrations.
- Conectar modulos de negocio agora: rejeitado por estar fora do escopo.

## Consequencias

O Portal passa a conhecer o contexto real do usuario e pode esconder menus conforme capabilities. A seguranca segue dependente de RLS e os testes reais exigem Supabase local/staging com migrations aplicadas.

## Riscos

- Ambientes sem migrations aplicadas bloqueiam o dashboard.
- RLS precisa ser validada com fixtures ficticias antes de producao.
- Capabilities exibidas no frontend melhoram UX, mas nao substituem policies.
