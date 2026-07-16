# REROUTE Portal - Autenticacao

## Provedor

A autenticacao sera baseada em Supabase Auth.

## Fluxos Necessarios

### Login

O usuario informa e-mail e senha. A sessao e criada pelo Supabase Auth. Apos login, o Portal carrega perfil, organizacao, workspaces e permissoes.

### Logout

O logout encerra a sessao local e invalida o acesso no navegador.

### Convite

Contas nao devem ser criadas publicamente. Um administrador autorizado convida usuarios. O convidado recebe e-mail, define senha e passa a ter acesso conforme seus papeis e workspaces.

### Recuperacao de Senha

O usuario solicita reset por e-mail. O link deve direcionar para uma rota controlada do Portal.

### Sessao

O frontend deve observar mudancas de sessao, renovar estado quando necessario e redirecionar usuarios nao autenticados.

## Protecao de Rotas

Guards no frontend devem:

- verificar sessao;
- carregar perfil;
- confirmar acesso ao workspace;
- redirecionar quando necessario.

Esses guards nao substituem RLS. Eles apenas melhoram a experiencia.

## Usuarios Suspensos

Usuarios com status suspenso devem ser bloqueados por RLS e pelas APIs, mesmo que possuam sessao ativa.

## Evolucao Futura

MFA deve ser considerado para administradores, financeiro, juridico e usuarios com acesso a dados sensiveis.
