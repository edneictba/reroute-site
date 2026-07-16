# REROUTE Portal - Autorizacao

## Estrategia

A autorizacao deve combinar:

- RBAC por papeis;
- permissoes granulares;
- acesso por workspace;
- propriedade do recurso;
- escopo por organizacao;
- visibilidade do conteudo.

## Roles

Papeis previstos:

- super_admin
- admin
- investor
- employee
- manager
- advisor
- accountant
- legal
- auditor
- support

## Permissions

Permissoes devem representar capacidades, por exemplo:

- `users.invite`
- `users.suspend`
- `investors.read`
- `investors.write`
- `documents.read_private`
- `documents.upload`
- `finance.read`
- `finance.write`
- `audit.read`
- `projects.publish_update`

## Capabilities

Capabilities sao permissoes efetivas calculadas a partir de role, workspace, organizacao e regras do recurso.

## Regras por Perfil

Admin:

- gerencia usuarios;
- publica dados;
- acessa auditoria;
- nao acessa senhas;
- nao ignora RLS pelo frontend.

Investor:

- acessa documentos gerais publicados;
- acessa seus proprios documentos;
- visualiza informacoes autorizadas;
- nao edita dados administrativos;
- nao acessa dados pessoais de outros investidores.

Employee:

- acessa workspaces internos conforme permissao.

Advisor:

- acessa informacoes estrategicas autorizadas.

Finance:

- acessa modulo financeiro conforme permissao.

Legal:

- acessa documentos juridicos autorizados.

## Regra Fundamental

Nenhuma permissao deve depender apenas de JavaScript no navegador. RLS e APIs server-side sao obrigatorias para proteger dados.
