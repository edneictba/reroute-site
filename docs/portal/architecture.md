# REROUTE Portal - Arquitetura

## Organizacao Geral

A arquitetura aprovada preserva a Landing Page estatica atual e adiciona o REROUTE Portal como modulo privado separado.

Camadas:

- Public: Landing Page e paginas institucionais.
- Portal: rotas privadas e publicas de autenticacao.
- Services: acesso ao Supabase e APIs internas.
- Auth: sessao, login, logout, convite e reset.
- Guards: protecao de rotas e redirecionamentos.
- Workspaces: areas do portal por perfil operacional.
- APIs serverless: operacoes sensiveis que exigem contexto server-side.
- Supabase: Auth, Postgres, RLS e Storage.

## Rotas

Rotas publicas:

- `/investidor`
- `/portal`
- `/portal/login`
- `/portal/recuperar-senha`

Rotas privadas iniciais:

- `/portal/investor`
- `/portal/investor/dashboard`
- `/portal/investor/investimento`
- `/portal/investor/documentos`
- `/portal/investor/progresso`
- `/portal/investor/relatorios`
- `/portal/investor/comunicados`
- `/portal/investor/perfil`
- `/portal/admin`
- `/portal/admin/dashboard`
- `/portal/admin/investidores`
- `/portal/admin/usuarios`
- `/portal/admin/documentos`
- `/portal/admin/auditoria`

Rotas futuras:

- `/portal/team`
- `/portal/advisor`
- `/portal/finance`
- `/portal/legal`

## Responsabilidades

O frontend melhora a experiencia, mas nao e a fonte de seguranca. O frontend pode esconder itens de menu, exibir estados e redirecionar usuarios, mas as regras reais devem estar em RLS, Storage policies e APIs server-side.

## Compatibilidade

A rota `/investidor` deve continuar existindo como entrada publica para investidores. Internamente, usuarios autenticados devem ser direcionados para `/portal/investor/dashboard`.

## Build

O projeto atual usa um build simples que copia arquivos para `dist`. Ao adicionar o Portal, `scripts/build.js` devera ser atualizado para copiar as pastas publicas do portal quando a implementacao comecar.
