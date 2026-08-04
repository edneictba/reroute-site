# REROUTE — Boas Práticas de Desenvolvimento

> Práticas de engenharia para o `reroute-app` (e, no que couber, para o `reroute-site`). Adaptadas de um projeto de produção maduro (Marketing OS/StartSe), enxugadas para a realidade de um MVP tocado com agentes de IA (Codex). Harness-agnostic: valem para qualquer agente ou pessoa.

## Princípios não-negociáveis

Curtos, verificáveis, e todo PR responde a eles. Violação **bloqueia** o merge.

1. **O motor é o produto; o LLM é a voz.** Regra de saúde/recálculo é código determinístico com teste. LLM nunca decide número, meta ou trava.
2. **Nada de saúde sem fonte e sem revisor.** Todo item de catálogo (exercício, orientação alimentar) tem fonte citável, texto de autoria própria e `revisado_por` (CREF/CRN) preenchido antes de publicar.
3. **Trava de segurança é teto, nunca é sobrescrita.** Nenhuma preferência de usuário ou diretriz desativa uma trava. Conflitos ficam visíveis e pendentes — nunca resolvidos em silêncio.
4. **RLS no banco, autorização no servidor.** Cada pessoa só acessa os próprios dados. Esconder botão na UI não é segurança.
5. **O erro não quebra nada.** Nem para a pessoa usuária (lapso → recálculo, nunca punição; toda sessão tem versão mínima), nem no código (falha degrada com mensagem clara, nunca tela branca).
6. **GitHub é a fonte da verdade.** Todo trabalho termina com commit e push. Nada importante vive só na máquina local ("é o nosso Drive").

## Fluxo de trabalho (obrigatório)

**Toda implementação é validada localmente antes de subir. Produção nunca é ambiente de teste.**

1. Criar branch: `feat/...`, `fix/...`, `chore/...`, `docs/...`
2. **Teste antes do código** (TDD: vermelho → verde → refatora) para lógica de domínio — no mínimo, todo módulo do motor de rota
3. Validar local: `npm run lint && npm run test && npm run build` verdes **na máquina** — não delegar a primeira validação ao CI
4. Commit no padrão Conventional Commits: `feat(checkout): registrar sintoma no check-out da noite`
5. Push + Pull Request → CI verde → merge (squash)
6. Merge na `main` = deploy automático (Vercel)

**Regra de desistência** (para sessões com agente): se o CI/teste ficar vermelho e não resolver em ~2 tentativas, deixe nota no item, **não faça merge quebrado**, passe para o próximo item.

**Todo bug em produção ganha teste de regressão**: primeiro o teste que reproduz a falha (vermelho), depois o fix. O PR cita o teste.

## Qualidade automatizada (o "gate" antes de produção)

Decisão do kick-off: "ferramentas dentro do projeto que validam a cada subida — se não estiver correto, nem sobe". Na prática:

### Local (Husky — três ganchos de uma linha)
| Gancho | Faz |
|---|---|
| `pre-commit` | `lint-staged` (ESLint --fix + Prettier nos arquivos alterados) |
| `commit-msg` | `commitlint` (valida o padrão da mensagem) |
| `pre-push` | `lint` + `test` completos |

### CI (GitHub Actions)

**`ci.yml`** — job `quality` sequencial em todo PR e push na `main`:
```
install (lockfile congelado) → lint → format:check → typecheck → test → build → audit de dependências (--prod, nível high)
```
- `concurrency` com `cancel-in-progress` (push novo cancela o CI antigo)
- `permissions: contents: read` no topo (privilégio mínimo)
- Actions pinadas por SHA com a versão em comentário

**`security.yml`** — em PR, push na main e semanalmente:
- **Gitleaks** (segredos vazados; versão fixa; varre o histórico)
- **Semgrep** (SAST — padrões inseguros em TS/React; falha só em `error`)
- Resultado postado como comentário único no PR (marcador HTML oculto, atualizado a cada push — nunca duplica)

**Dependabot — política do projeto: alertas sim, PRs automáticos não.** Os *Dependabot alerts* (gratuitos, inclusive em repo privado) ficam ativados na aba Security e avisam quando uma dependência tem vulnerabilidade conhecida. Os PRs automáticos de atualização ficam **desativados** (`open-pull-requests-limit: 0` no `dependabot.yml`) — atualização de dependência entra na rotina semanal com revisão humana, não como ruído de PR. Para reativar no futuro, basta subir o limite.

### Proteção da `main`
- Sem push direto: tudo via PR
- CI verde obrigatório para merge
- Squash merge (histórico limpo, 1 commit por entrega)

## Padrões de código

- **TypeScript `strict`** + `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`
- **ESLint** com `--max-warnings=0` (aviso é erro) + **Prettier** (formatação nunca é debate)
- Testes: **Vitest** para unidade (motor de rota ~100% de cobertura), Testing Library para componentes; e2e (Playwright) só em marcos
- Testes **não dependem de serviço externo**: repositórios injetáveis, fetch mockado — nunca exigir Supabase no ar para rodar `npm test`
- Envelope de resposta padrão nas APIs: `{ data, meta }` — erro sempre estruturado

## Documentação viva no repositório

| Arquivo | Papel |
|---|---|
| `AGENTS.md` (raiz) | Manual operacional para **qualquer agente de IA** (Codex, Claude, Gemini) e qualquer pessoa: o que é o projeto, princípios, comandos, workflow, armadilhas conhecidas. Padrão aberto lido automaticamente pelo Codex. |
| `README.md` | Visão geral + como rodar em 5 minutos |
| `docs/ROADMAP.md` | Plano executável com checkboxes, "O PADRÃO" (receita passo a passo apontando uma feature de referência) e o fluxo por item |
| `docs/adr/NNNN-titulo.md` | **Toda decisão estrutural vira ADR**: `Status · Data · Contexto · Decisão · Consequências` |
| Seção "Armadilhas conhecidas" no `AGENTS.md` | Cresce a cada incidente — é o que impede o agente de repetir o erro do mês passado |

**Template de PR** (`.github/pull_request_template.md`):
- O que muda
- Teste que cobre (escrito antes da mudança — TDD)
- Princípios respeitados (checkbox por princípio, com N/A)
- Checklist: lint/test verdes localmente · ADR atualizado se houve decisão estrutural

## Segredos e configuração

- `.env` **nunca** no Git; `.env.example` sempre atualizado, com comentário por variável explicando o efeito de deixá-la vazia
- Segredos de produção: painel da Vercel + GitHub Secrets
- Convenção: `SCREAMING_SNAKE_CASE` com prefixo por domínio (`SUPABASE_*`, `ONESIGNAL_*`, `POSTHOG_*`)
- Gitleaks no CI garante que segredo commitado por engano é pego antes do merge

## Observabilidade como Definition of Done

**Toda feature nasce com evento de analytics e tratamento de erro. Não é "depois".**

- Page views automáticos + eventos nomeados (`checkout_concluido`, `lapso_recuperado`) — de preferência declarativos (`data-track="evento"`)
- Erros capturados com contexto (Sentry)
- **Gate por ambiente numa função pura testável**: analytics/telemetria só ligam em produção; dev e testes nunca enviam dados
- Detalhes de ferramentas e setup: `05-setup-infraestrutura.md`

## Aplicação no `reroute-site` (repositório existente)

Retrofit mínimo, em ordem de retorno:

1. `AGENTS.md` na raiz (o repo tem `.codex/*.md` **vazios** — consolidar num só arquivo real)
2. `ci.yml` com o job `quality` usando os scripts que **já existem** (`npm run lint`, smoke tests, `npm run build`)
3. Proteção da `main` + template de PR
4. Corrigir domínio canônico (reroutehns.com.br → www.reroute.com.br)
5. `security.yml` (Gitleaks + Semgrep) e `dependabot.yml`
