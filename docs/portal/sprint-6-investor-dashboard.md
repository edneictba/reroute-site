# Sprint 6 - Primeiro Dashboard do Investidor

## Objetivo

Criar a primeira versão visual do Portal do Investidor, mantendo a autenticação, o contexto de usuário e as permissões já existentes. Esta sprint não conecta dados financeiros reais, documentos reais ou módulos administrativos.

## Estrutura

- `portal/dashboard/index.html`: página protegida do dashboard, com slots estruturais para header, status, roadmap, gráfico, atualizações e próximos passos.
- `src/portal/providers/demo-dashboard.js`: provider demonstrativo centralizado com todos os dados exibidos no dashboard.
- `src/portal/core/portal.js`: renderização dos componentes do dashboard com base no provider e no contexto autenticado.
- `src/portal/core/navigation.js`: navegação lateral gerada a partir do provider demonstrativo.
- `src/portal/styles/portal.css`: camada visual premium e responsiva do dashboard.

## Provider

O provider `getInvestorDashboardDemoData()` concentra:

- informações institucionais do header;
- card principal;
- status geral do projeto;
- roadmap;
- série demonstrativa do gráfico;
- últimas atualizações;
- próximos passos;
- itens da sidebar.

Para substituir por dados reais futuramente, a camada de renderização deve consumir um provider compatível com a mesma estrutura, vindo de serviços do Supabase ou de APIs internas.

## Componentes

O dashboard renderiza:

- header premium com usuário autenticado, workspace, role, último acesso e logout;
- card principal de boas-vindas;
- cards de status geral do projeto;
- timeline vertical de roadmap;
- gráfico de evolução com Chart.js;
- painel de últimas atualizações;
- painel de próximos passos;
- sidebar com módulos ativos e módulos "Em breve".

## Gráfico

O gráfico utiliza Chart.js via CDN apenas para visualização demonstrativa. Os dados representam maturidade visual do projeto por sprint e não possuem relação com capital, receita, investimentos ou métricas financeiras reais.

## Timeline

O roadmap usa estados demonstrativos:

- concluído;
- em andamento;
- próximo;
- planejado.

## Limitações

- Nenhum dado financeiro real conectado.
- Nenhum documento real conectado.
- Nenhum módulo administrativo habilitado.
- O dashboard depende do contexto autenticado já existente.
- O provider ainda é estático e deve ser substituído por serviço real em sprint futura.

## Próxima Sprint Recomendada

Implementar a Sprint Financeiro com modelagem de dados, permissões específicas, RLS, serviços de leitura e componentes visuais conectados apenas depois da validação de segurança.
