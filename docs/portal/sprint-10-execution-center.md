# Sprint 10 - Execution Center (MVP / Projetos)

## Objetivo

Criar o módulo oficial de execução do MVP para mostrar como o REROUTE está sendo construído por projetos, épicos, módulos, sprints e tarefas.

## Rota

- `/portal/projetos/`

A rota segue o padrão protegido do Portal:

- sessão autenticada;
- contexto obrigatório;
- capabilities `portal.access` e `workspace.access`.

## Provider

O módulo usa exclusivamente:

- `src/portal/providers/demo-projects.js`

O provider centraliza:

- projetos;
- épicos;
- módulos;
- sprints;
- tarefas;
- status;
- categorias;
- prioridades;
- resumo calculado para o dashboard;
- relação visual entre marcos do Roadmap e módulos.

## Estrutura

Projeto -> Épicos -> Módulos -> Sprints -> Tarefas

Cada projeto contém:

- nome;
- descrição;
- status;
- prioridade;
- percentual;
- responsável placeholder;
- data prevista;
- dependências;
- categoria;
- versão.

## Volume Demonstrativo

- 5 projetos;
- 15 épicos;
- 40 módulos;
- 6 sprints;
- 60 tarefas.

## Interface

A página contém:

- indicadores executivos;
- filtros por categoria, status, prioridade e pesquisa;
- kanban estilo Linear;
- lista detalhada de execução;
- timeline de tarefas, riscos e próximos passos;
- conexão visual com o Roadmap via parâmetro `?roadmap=`.

## Dashboard

O dashboard recebeu o card `Execution Center`, exibindo:

- Projetos Ativos;
- Sprint Atual;
- Tarefas Concluídas;
- Próximas Entregas.

## Conexão com Roadmap

Cada marco do Roadmap exibe um link para os módulos relacionados no Execution Center. O filtro é aplicado por `roadmapId` no provider demonstrativo.

## Como Conectar Futuramente ao Banco

1. Criar tabelas para `projects`, `epics`, `modules`, `sprints` e `tasks`.
2. Definir relacionamentos por IDs e workspace.
3. Adicionar policies RLS por role e capability.
4. Criar serviço de leitura protegido para o Portal.
5. Substituir `getDemoProjectsData()` por consultas reais mantendo o contrato de dados.
6. Criar módulo administrativo separado para edição e governança.

## Limitações

- Nenhum dado real conectado.
- Nenhuma alteração em Supabase.
- Nenhuma alteração em RLS.
- Nenhuma alteração em autenticação.
- Nenhum dado financeiro real.
- Riscos, responsáveis e tarefas são placeholders demonstrativos.

## Próxima Sprint Recomendada

Sprint 11: módulo financeiro demonstrativo para investidores, ainda sem dados reais, preparando contrato de dados, visualização executiva e permissões futuras.
