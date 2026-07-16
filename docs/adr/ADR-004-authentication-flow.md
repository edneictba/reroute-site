# ADR-004 - Authentication Flow

## Status

Accepted for review.

## Contexto

O REROUTE Portal precisa autenticar usuarios autorizados sem permitir cadastro publico e sem expor segredos no frontend. A autorizacao por roles/capabilities sera tratada depois; esta decisao cobre apenas autenticacao, sessao e recuperacao de senha.

## Decisao

Usar Supabase Auth no frontend com anon key publica, cliente unico do Portal, provider central de sessao e guards reutilizaveis. O login usa e-mail/senha; a recuperacao usa `resetPasswordForEmail`; a redefinicao usa `updateUser` durante sessao de recovery. Rotas privadas ocultam conteudo ate a sessao ser resolvida.

## Alternativas Consideradas

- Criar autenticacao propria: rejeitado por risco e custo.
- Usar service role no frontend: rejeitado por risco critico.
- Implementar cadastro publico: rejeitado por estar fora do escopo e do modelo de convite.
- Conectar roles/capabilities nesta sprint: rejeitado para manter autenticacao separada de autorizacao.

## Consequencias

O Portal passa a ter fluxo real de acesso, logout, recovery e reset. A seguranca de dados continua dependendo de RLS e da Sprint 5 para autorizacao por roles/capabilities na UX.

## Riscos

- Redirect URLs incorretas no Supabase quebram recovery.
- Sem ambiente local/staging, fluxos reais precisam ser validados antes de producao.
- Autenticacao nao bloqueia por si so usuarios sem role; isso sera tratado na Sprint 5.
