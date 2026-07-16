# REROUTE Portal | Sprint 13 - Governanca, Admin Center e Controle Editorial

Data: 2026-07-15

## Objetivo

Criar a primeira versao demonstrativa do Admin Center do REROUTE Portal, sem CRUD real, sem conexao com Supabase, sem Storage e sem dados reais.

O modulo prepara a fundacao visual e conceitual para governanca administrativa, controle editorial, workspaces, roles, capabilities, usuarios, convites, logs e auditoria.

## Arquitetura

Arquivos principais:

- `portal/admin/index.html`: rota privada do Admin Center.
- `src/portal/providers/demo-admin.js`: provider demonstrativo centralizado.
- `src/portal/core/portal.js`: renderizacao do modulo administrativo.
- `src/portal/styles/portal.css`: estilos especificos do Admin Center, seguindo o Design System do Portal.

A rota `/portal/admin/` usa o mesmo shell protegido das demais areas privadas:

- `data-auth-required="true"`
- `data-context-required="true"`
- `data-required-capabilities="portal.access,workspace.access,users.manage,roles.view,audit.view"`
- `data-portal-page="admin"`

## Provider

Todos os dados administrativos saem de `src/portal/providers/demo-admin.js`.

O provider entrega:

- navegacao administrativa;
- indicadores executivos;
- workspaces;
- roles;
- capabilities;
- usuarios demonstrativos;
- fluxo de convites;
- fluxo editorial;
- administracao visual de roadmap;
- administracao visual de documentos;
- configuracoes demonstrativas;
- logs;
- auditoria.

Nenhum dado esta conectado ao banco.

## Menu Administrativo

O Admin Center apresenta os seguintes modulos:

- Dashboard
- Usuarios
- Investidores
- Financeiro
- Projetos
- Roadmap
- Atualizacoes
- Documentos
- Permissoes
- Configuracoes
- Logs
- Auditoria

Todos estao em modo demonstrativo.

## Workspaces

Foram modelados os workspaces:

- Investor
- Admin
- Finance
- Advisor
- Team
- Legal

Cada workspace exibe:

- status;
- quantidade de usuarios;
- capabilities associadas.

## Roles

Foram modeladas as roles:

- Owner
- Administrator
- Finance
- Advisor
- Investor
- Team
- Legal
- Support
- Viewer

Cada role exibe:

- descricao;
- quantidade de usuarios;
- nivel de acesso.

## Capabilities

A matriz demonstrativa exibe:

- capability;
- quem pode;
- quem nao pode;
- dependencias;
- criticidade.

A matriz e somente leitura nesta sprint.

## Usuarios e Convites

O modulo exibe uma tabela de usuarios ficticios com:

- nome;
- workspace;
- role;
- status;
- ultimo acesso;
- convite;
- permissoes;
- acao demonstrativa.

O fluxo de convites mostra:

- rascunho;
- pendente;
- enviado;
- aceito;
- expirado;
- cancelado.

Nao ha envio real de convite.

## Controle Editorial

O painel editorial demonstra os estados:

- Rascunho
- Em revisao
- Aprovado
- Publicado
- Arquivado

Nao ha persistencia real.

## Roadmap e Documentos

O Admin Center inclui paineis demonstrativos para:

- novo marco;
- edicao de prioridade;
- categoria;
- status;
- categorias de documentos;
- versoes;
- tipo;
- permissoes;
- upload placeholder.

Nao ha salvamento e nao ha conexao com Storage.

## Configuracoes

Foram criadas entradas demonstrativas para:

- Empresa
- Branding
- Portal
- Integracoes
- Notificacoes
- Seguranca
- Sessoes
- API

## Logs e Auditoria

O modulo inclui:

- timeline administrativa de logs demonstrativos;
- tabela de auditoria com data, usuario, evento, modulo, resultado, criticidade, origem e IP ficticio.

## Integracoes Futuras

Quando o modulo evoluir para dados reais, recomenda-se:

1. Criar tabelas administrativas com RLS antes de qualquer CRUD.
2. Separar APIs administrativas em Vercel Functions.
3. Manter `service_role` fora do frontend.
4. Substituir `demo-admin.js` por adapters/repositories.
5. Adicionar logs reais de auditoria em operacoes sensiveis.
6. Criar controles de aprovacao editorial.
7. Conectar upload somente apos politica de Storage definida.

## Limitacoes Atuais

- Nenhum dado real conectado.
- Nenhum usuario real criado.
- Nenhum convite real enviado.
- Nenhum CRUD implementado.
- Nenhum upload real.
- Nenhum registro de auditoria real.
- Nenhuma alteracao de RLS.
- Nenhuma migration criada.

## Validacao Esperada

Executar:

- `npm run lint`
- `npm run build`

Validar:

- `/portal/admin/`
- sidebar para usuarios com `users.manage`, `roles.view` e `audit.view`;
- renderizacao dos paineis;
- responsividade desktop/tablet/mobile;
- ausencia de erros no console em sessao autenticada.

## Confirmacoes

- Landing Page nao foi alterada.
- Sistema de leads nao foi alterado.
- Resend nao foi alterado.
- Login e recuperacao de senha nao foram alterados.
- Supabase remoto nao foi conectado por este modulo.
- Storage nao foi conectado.
- Nenhuma tabela foi alterada.
- Nenhuma migration foi criada.
- Nenhum dado real foi usado.
