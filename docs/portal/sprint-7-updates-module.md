# Sprint 7 - Módulo de Atualizações Oficiais

## Objetivo

Criar o primeiro módulo funcional do Portal do Investidor: uma área de comunicação oficial para publicar e acompanhar a evolução do REROUTE.

## Rota

- `/portal/atualizacoes/`

A rota usa a mesma proteção já existente no Portal:

- sessão autenticada;
- contexto obrigatório;
- capabilities `portal.access` e `workspace.access`.

## Provider

O módulo usa o provider demonstrativo:

- `src/portal/providers/demo-updates.js`

Esse provider centraliza:

- categorias;
- status;
- publicações;
- tags;
- autores;
- resumo;
- conteúdo;
- data;
- tempo estimado de leitura.

Nenhum dado financeiro real, documento real, projeto real ou módulo administrativo foi conectado.

## Publicações Demonstrativas

Foram adicionadas 12 publicações demonstrativas cobrindo:

- arquitetura do Portal;
- finalização da Sprint 5;
- dashboard do investidor;
- autenticação;
- roadmap;
- módulo financeiro planejado;
- Supabase;
- design system;
- performance;
- fluxo de autenticação;
- preparação para investidores;
- próxima fase do MVP.

## Interface

A página contém:

- header contextual do Portal;
- filtros por categoria;
- filtros por status;
- pesquisa textual;
- cards premium de atualizações;
- timeline lateral;
- tags;
- tempo estimado de leitura;
- animações suaves.

## Dashboard

O dashboard passou a exibir as cinco publicações mais recentes publicadas usando o mesmo provider `demo-updates.js`.

## Sidebar

O item `Atualizações` passou a apontar para `/portal/atualizacoes/` e deixou de ser apenas uma âncora local.

## Substituição por Dados Reais

Para conectar dados reais futuramente, criar um serviço com o mesmo contrato de retorno do provider demonstrativo e substituir as chamadas por consultas ao Supabase ou a uma API interna protegida.

## Limitações

- Dados ainda são demonstrativos.
- Não existe criação administrativa de publicações nesta sprint.
- Não existe conexão com banco para atualizações.
- Não existe upload de anexos.
- Não há documentos, financeiro, projetos ou relatórios reais conectados.

## Próxima Sprint Recomendada

Sprint 8: criar a camada administrativa de publicação das atualizações oficiais, incluindo tabela no Supabase, RLS, permissões editoriais, estados de revisão e formulário protegido para administradores.
