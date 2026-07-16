# Sprint 9 - Roadmap Inteligente

## Objetivo

Criar o módulo oficial de Roadmap do REROUTE no Portal do Investidor, permitindo visualizar onde estamos, o que foi concluído, o que está em desenvolvimento e a visão estratégica dos próximos anos.

## Rota

- `/portal/roadmap/`

A rota segue o padrão protegido do Portal:

- sessão autenticada;
- contexto obrigatório;
- capabilities `portal.access` e `workspace.access`.

## Provider

O módulo usa exclusivamente:

- `src/portal/providers/demo-roadmap.js`

O provider centraliza:

- categorias;
- status;
- marcos;
- prioridade;
- percentual;
- data prevista;
- dependências;
- versão;
- responsável placeholder;
- resumo calculado para dashboard.

## Estrutura do Roadmap

A página contém:

- cabeçalho institucional;
- visão estratégica;
- barra geral de progresso;
- indicadores de total, concluídos, em desenvolvimento e planejados;
- filtros por categoria;
- filtros por status;
- pesquisa;
- cards premium de marcos;
- timeline estratégica lateral.

## Dashboard

O dashboard recebeu o card `Roadmap Geral`, exibindo:

- progresso geral;
- sprint atual;
- próxima sprint;
- última atualização.

## Marcos Demonstrativos

Foram adicionados 25 marcos demonstrativos, incluindo:

- Arquitetura;
- Landing;
- Portal;
- Dashboard;
- Atualizações;
- Data Room;
- Roadmap;
- Financeiro;
- Projetos;
- Documentos;
- Admin;
- Storage;
- API;
- Aplicativo Android;
- Aplicativo iOS;
- Memory Engine;
- Decision Engine;
- Behavior Engine;
- Context Engine;
- Goal Engine;
- Marketplace;
- API Pública;
- B2B;
- Enterprise;
- Lançamento Oficial.

## Como Conectar Futuramente ao Banco

1. Criar tabela `portal_roadmap_milestones`.
2. Criar campos para status, categoria, prioridade, percentual, dependências e owner.
3. Adicionar policies RLS por workspace, role e capability.
4. Criar serviço de leitura protegido no Portal.
5. Substituir `getDemoRoadmapData()` por consulta real mantendo o mesmo contrato.
6. Criar trilha administrativa separada para edição dos marcos.

## Limitações

- Nenhum dado real conectado.
- Nenhuma alteração em Supabase.
- Nenhuma alteração em RLS.
- Nenhuma alteração em autenticação.
- Nenhuma conexão com financeiro, documentos ou atualizações reais.
- O responsável ainda é placeholder demonstrativo.

## Próxima Sprint Recomendada

Sprint 10: criar o módulo de Projetos/MVP com provider demonstrativo, visão por frentes, status de execução, dependências e relação com o Roadmap.
