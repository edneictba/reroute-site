# REROUTE Portal | Sprint 13.5 - UX/UI Polish Premium

Data: 2026-07-15

## Objetivo

Refinar a experiencia visual do REROUTE Portal para aumentar consistencia, legibilidade, acabamento institucional e sensacao de produto SaaS premium, sem criar funcionalidades novas e sem alterar autenticacao, autorizacao, Supabase, Storage, Leads, Resend ou Landing Page.

## Auditoria Inicial

Foram revisados:

- `docs/portal/architecture.md`;
- `docs/portal/coding-standards.md`;
- `docs/portal/security.md`;
- `docs/portal/workspaces.md`;
- `docs/portal/sprint-12-5-technical-audit.md`;
- `docs/portal/sprint-13-governance-admin-center.md`;
- ADRs existentes;
- rotas em `portal/`;
- estilos em `src/portal/styles/portal.css`;
- renderizacao compartilhada em `src/portal/core/portal.js`.

## Inconsistencias Encontradas

- Sidebar funcional, mas com estado ativo pouco destacado para um produto administrativo premium.
- Cards, tabelas e filtros possuíam boa base, porem faltava polimento consistente de hover, foco, densidade e separacao visual.
- Badges dependiam principalmente de cor e classe manual.
- Tabelas administrativas e de dados ficavam legiveis, mas sem hover de linha e sem cabecalho mais forte.
- Gráficos tinham altura fixa, menos adaptavel para telas grandes e intermediarias.
- Drawer de detalhe e modal podiam ter entrada visual mais refinada.
- Tokens de layout e z-index estavam menos explicitos do que o restante do Design System.

## Melhorias Aplicadas

### Tokens

Foram adicionados ou consolidados tokens para:

- informacao;
- raio extra;
- largura maxima de conteudo;
- largura da sidebar;
- altura do header;
- sombra de cards;
- z-index de sidebar, header e overlays.

### Layout Geral

- Conteudo privado agora respeita largura maxima centralizada.
- Sidebar usa token de largura.
- Header usa token de altura.
- Superficies ganharam transicoes consistentes.

### Sidebar

- Navegacao recebeu container discreto.
- Item ativo ganhou destaque com gradiente sutil, marcador lateral e sombra interna.
- Hover ficou mais suave e direcional.
- Itens da navegacao receberam `title` para melhorar descoberta e contexto.

### Header e Topbar

- O header manteve estrutura e dados existentes.
- Altura e z-index foram padronizados por token.
- Comportamento responsivo existente foi preservado.

### Cards e Metricas

- Cards ganharam transicao uniforme.
- Hover agora melhora borda, fundo e sombra sem mudar identidade visual.
- Metricas receberam overflow mais seguro.

### Tabelas

- Tabelas receberam container com acabamento interno.
- Cabeçalho ficou mais forte e sticky dentro do scroll da tabela.
- Linhas receberam hover discreto.
- Leitura horizontal em telas menores foi preservada.

### Filtros e Inputs

- Inputs e selects receberam hover/focus mais consistente.
- Estados de foco mantêm contraste alto e compatibilidade com teclado.

### Badges e Status

- Badges agora possuem indicador visual por ponto, reduzindo dependencia exclusiva de cor.
- O helper `createBadge` adiciona classes semanticas derivadas do texto do status.
- Estados comuns como ativo, publicado, arquivado, pendente, planejado, suspenso, bloqueado, disponivel e integralizado foram padronizados visualmente.

### Graficos

- `portal-chart-wrap` agora usa altura responsiva com `clamp`.
- Contraste e moldura dos graficos foram mantidos.
- Nenhum dado ou biblioteca foi alterado.

### Timelines, Modais e Drawers

- Drawer de detalhe ganhou animação curta de entrada.
- Modal ganhou animação de entrada padronizada.
- `prefers-reduced-motion` continua respeitado.

## Paginas Revisadas

Rotas consideradas no polish:

- `/portal/`
- `/portal/login/`
- `/portal/dashboard/`
- `/portal/atualizacoes/`
- `/portal/documentos/`
- `/portal/roadmap/`
- `/portal/projetos/`
- `/portal/financeiro/`
- `/portal/investidores/`
- `/portal/admin/`
- `/portal/acesso-negado/`
- `/portal/manutencao/`
- `/portal/404/`
- `/portal/recuperar-senha/`
- `/portal/redefinir-senha/`

## Responsividade

Foram preservados e reforçados os breakpoints existentes:

- 1120px;
- 860px;
- 560px.

As melhorias focam em:

- conteudo privado centralizado em telas grandes;
- tabelas com rolagem horizontal controlada;
- graficos com altura adaptavel;
- Admin Center com grid responsivo;
- sidebar mobile preservada.

## Acessibilidade

Melhorias aplicadas:

- foco visual preservado e reforcado em inputs/selects;
- `aria-current` continua sendo usado pela navegacao;
- `aria-expanded` continua sendo usado no menu mobile;
- badges deixam de depender somente de cor;
- hover nao substitui foco;
- animações seguem `prefers-reduced-motion`.

## Performance

Melhorias seguras:

- ajustes concentrados em CSS;
- nenhuma biblioteca nova;
- nenhum script visual adicional;
- nenhuma imagem nova;
- nenhum dado adicional;
- nenhum provider alterado em dados de negocio.

Pontos ainda pendentes:

- Chart.js continua carregado por CDN nas paginas com graficos.
- `portal.js` continua monolitico, conforme divida tecnica da Sprint 12.5.
- Validacao visual automatizada completa ainda deve ser criada em sprint propria.

## Validacao

| Item | Status | Observacao |
| --- | --- | --- |
| `node --check` nos JS alterados | PASS | `src/portal/core/portal.js` validado. |
| `npm run lint` | PASS | Lint concluido sem erros. |
| `npm run build` | PASS | Build concluido em `dist/`. |
| HTTP local em rotas | PASS | 15 rotas obrigatorias retornaram HTTP 200 em servidor estatico temporario. |
| Console em navegador | PASS | Nenhum erro capturado nas rotas verificadas. |
| Console em sessao autenticada real | REVIEW | Depende de sessao/contexto real. |
| Responsividade basica | PASS | `/portal/`, `/portal/login/` e `/portal/admin/` sem scroll horizontal em 1440, 768 e 390px. |
| Responsividade autenticada completa | REVIEW | Conteudo privado completo depende de sessao/contexto autorizado. |
| Dados, providers e calculos | PASS | Nao foram alterados. |

## Divida Visual Restante

1. Criar suite visual automatizada com screenshots por rota e viewport.
2. Separar CSS por dominio quando a modularizacao do Portal iniciar.
3. Criar componentes reais reutilizaveis para tables, badges, metric cards e drawers.
4. Revisar tipografia com design tokens mais granulares.
5. Definir estrategia para CDN/SRI antes da producao privada.

## Riscos

- O polish visual nao substitui validacao em navegador autenticado real.
- O uso amplo de `innerHTML` segue como divida tecnica para a entrada de dados reais.
- A modularizacao de `portal.js` segue recomendada antes de novas integrações sensiveis.

## Proximos Passos Recomendados

Antes da Sprint 14, recomenda-se validar visualmente o Portal autenticado com usuario admin e investidor, capturando screenshots em desktop, tablet e mobile.

## Confirmacoes

- Nenhuma funcionalidade nova foi criada.
- Nenhum provider teve dados de negocio alterados.
- Nenhuma regra de autenticacao foi alterada.
- Nenhuma regra de autorizacao foi alterada.
- Nenhuma tabela foi alterada.
- Nenhuma migration foi criada ou aplicada.
- Nenhum banco foi conectado.
- Nenhum Storage foi conectado.
- Nenhum dado real foi utilizado.
- Nenhuma funcionalidade da Landing Page foi alterada.
- Nenhum fluxo de leads foi alterado.
- Resend nao foi alterado.
- Nenhum commit foi realizado.
- Nenhum deploy foi realizado.
