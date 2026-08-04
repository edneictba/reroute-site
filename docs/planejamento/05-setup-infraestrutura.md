# REROUTE — Setup de Infraestrutura (passo a passo)

> Tudo que precisa ser configurado, na ordem certa, com o porquê de cada coisa. Serviços com free tier generoso e/ou open source — custo mensal alvo do MVP: **R$ 0** (fora domínio e assinaturas de IA).

## Mapa de serviços

| Serviço | Papel | Custo MVP |
|---|---|---|
| GitHub | Código (fonte da verdade) + CI | R$ 0 |
| Vercel | Hospedagem (landing, portal, app) | R$ 0 (Hobby) |
| Supabase | Banco, autenticação, storage | R$ 0 (free tier) |
| Cloudflare | DNS, proteção, Turnstile, cache | R$ 0 |
| Resend | E-mail transacional | R$ 0 (3k/mês) |
| OneSignal | Notificações push (web + app futuro) | R$ 0 (push ilimitado) |
| PostHog | Analytics de produto (open source) | R$ 0 (1M eventos/mês) |
| Sentry | Monitoramento de erros (open source) | R$ 0 (5k erros/mês) |
| OpenRouter | Gateway de IA (qualquer modelo, 1 chave) | Pré-pago com **teto definido** |
| Registro.br | Domínio reroute.com.br | ~R$ 40/ano |

---

## 1. GitHub (fonte da verdade)

**Já existe:** `github.com/edneictba/reroute-site` com deploy contínuo para a Vercel.

**Feito em 04/08/2026:** repositório **`rnatto-gempe/reroute-app`** criado (privado), com protótipo de UI (demo via GitHub Pages), documentação de planejamento e convite de colaborador enviado ao Ednei (`edneictba`).

**Falta:**
1. Ednei aceitar o convite de colaborador.
2. Proteger a `main`: `Settings → Branches → Add branch protection rule` → marcar *Require a pull request before merging* e *Require status checks to pass* (selecionar o CI quando o esqueleto do app entrar).
3. Segredos do CI: `Settings → Secrets and variables → Actions` (adicionar conforme os workflows pedirem).
4. (Futuro) Transferir o repositório para a conta do Ednei, se fizer sentido societariamente.

> ⚠️ **O Pages da demo é público mesmo com repo privado.** Por isso o deploy do Pages publica somente a demo (`index.html`), nunca `docs/` — e nenhum segredo ou dado sensível pode ser commitado.

> 💡 **Regra de ouro:** todo trabalho termina com commit e push. Peça ao Codex: *"commita e sobe para o GitHub"*. `node_modules` e `.next` nunca entram no repositório (o `.gitignore` cuida disso).

## 2. Cloudflare (DNS + proteção)

Hoje o domínio aponta do Registro.br direto para a Vercel. Colocar o Cloudflare na frente dá: DNS rápido com painel único, proteção contra bots/ataques (WAF), cache, analytics de tráfego — e o **Turnstile** (anti-spam do formulário, que o site já usa) passa a morar na mesma conta.

1. Criar conta em cloudflare.com (plano **Free**).
2. `Add a site` → `reroute.com.br` → o Cloudflare importa os registros DNS existentes automaticamente (conferir: `www`, `portal`, raiz, e os registros de e-mail).
3. O Cloudflare mostra **2 nameservers** (ex.: `ana.ns.cloudflare.com`).
4. No **Registro.br** → domínio → `Alterar servidores DNS` → substituir pelos nameservers do Cloudflare. Propagação: até 24h, geralmente minutos.
5. Em `SSL/TLS`, deixar modo **Full (strict)**.
6. Registros apontando para a Vercel: manter `CNAME` → `cname.vercel-dns.com` (raiz, `www`, `portal` e futuramente `app`). Se a Vercel reclamar de certificado, colocar o registro em modo **DNS only** (nuvem cinza) — a Vercel emite o certificado dela.
7. **Turnstile**: `Turnstile → Add site` → registrar `reroute.com.br` (e depois `app.reroute.com.br`) → copiar site key/secret para as variáveis de ambiente (o site já usa `NEXT_PUBLIC_TURNSTILE_SITE_KEY`/`TURNSTILE_SECRET_KEY`).

> ⚠️ Depois da migração, testar: site, portal, envio do formulário e recebimento do e-mail de boas-vindas.

## 3. Supabase (banco + auth)

**Já existe:** projeto usado pela landing (tabela `leads`) e portal.

**Fazer para o app:**
1. Criar **projeto separado** para o `reroute-app` (isola dado de saúde do dado de marketing; free tier permite 2 projetos).
2. Toda tabela nasce com **RLS habilitado** e policy explícita — dado de saúde é sensível (LGPD).
3. Migrations sempre versionadas no repositório (`supabase/migrations/`) — nunca mudança manual no painel.
4. **Resolver o limite de e-mail:** o Supabase Auth por padrão envia e-mails pelo SMTP embutido, com limite baixo (~2–4/hora). Em `Authentication → SMTP Settings`, configurar SMTP customizado apontando para o **Resend** (host `smtp.resend.com`) — o repositório já tem conta Resend configurada (`boasvindas@email.reroute.com.br`). Isso elimina o limite que o Ednei relatou.

## 4. Vercel (hospedagem)

**Já existe:** 2 projetos (landing + portal) apontando para o mesmo repo, deploy contínuo, plano Hobby.

**Fazer:**
1. Criar projeto novo importando o repo `reroute-app`.
2. Domínio: `app.reroute.com.br` (criar o CNAME no Cloudflare).
3. Variáveis de ambiente no painel (`Settings → Environment Variables`): Supabase, OneSignal, PostHog, Sentry, Turnstile — espelhando o `.env.example` do repo.
4. ⚠️ **Plano Hobby não permite colaborador** (força upgrade para Pro). Fluxo combinado: Renato trabalha via GitHub; o deploy é automático no merge. Ninguém precisa de acesso à Vercel para desenvolver.

## 5. Resend (e-mail)

**Já existe:** domínio `email.reroute.com.br` configurado no repo da landing.

**Conferir/fazer:**
1. Domínio verificado no painel do Resend (registros DKIM/SPF — que agora moram no Cloudflare).
2. Usar o mesmo Resend como SMTP do Supabase Auth (passo 3.4).
3. Free tier: 3.000 e-mails/mês — suficiente para o beta.

## 6. OneSignal (push)

1. Criar conta e app "REROUTE" → escolher **Web Push**.
2. Configurar o site `app.reroute.com.br` (o OneSignal gera o service worker a colocar no projeto).
3. Guardar `App ID` (frontend) e `REST API Key` (backend, para disparos agendados: manhã/noite).
4. Free tier: push ilimitado. A mesma conta servirá o app Android no futuro e campanhas para a base.

> 📱 Web push funciona em Android direto; no iOS exige o site **instalado como PWA** (atalho na tela inicial, iOS 16.4+) — mais um motivo para o fluxo de "adicionar à tela inicial" ser caprichado no onboarding.

## 7. PostHog (analytics de produto)

Open source, free tier de 1M eventos/mês, com session replay e feature flags inclusos.

1. Criar conta em posthog.com (região **EU** ou US) → novo projeto "reroute-app".
2. Instalar o SDK JS no app; ativar autocapture + eventos nomeados.
3. Eventos mínimos do MVP: `onboarding_iniciado`, `onboarding_concluido`, `checkin_manha`, `checkout_noite`, `sintoma_registrado`, `lapso_recuperado`, `tarefa_concluida`, `agua_registrada`.
4. Dashboards: **retenção D7/D30** (nativo), funil do onboarding, e as métricas do MVP (recuperação pós-lapso em 48h, dias compostos).
5. **Gate de ambiente:** analytics só liga em produção (ver `04-boas-praticas.md`).
6. Bônus: **feature flags** do PostHog podem controlar o paywall desabilitado e o acesso por cupom do beta.

> Alternativa 100% self-hosted no futuro: PostHog self-hosted, ou a dupla SigNoz (telemetria técnica/OpenTelemetry) + OpenPanel (analytics) que usamos em outro projeto. Para o MVP, o cloud free tier vence: zero servidor para manter.

### 7.1 PostHog no fluxo do agente de IA (MCP + CLI)

**MCP** ([docs](https://posthog.com/docs/model-context-protocol/codex)) — conecta o Codex direto ao PostHog. O agente passa a consultar analytics, investigar erros e gerenciar feature flags de dentro da conversa (útil para "quantas pessoas concluíram o onboarding esta semana?" sem abrir painel):

```bash
codex mcp add posthog --url https://mcp.posthog.com/mcp
# ou, com wizard: npx @posthog/wizard mcp add
```

Autenticação por OAuth nativo — na primeira chamada abre o login do PostHog (detecta a região US/EU sozinho).

**CLI** ([docs](https://posthog.com/docs/cli)) — para o que o MCP não cobre, principalmente **automação em build/CI**: upload de source maps (stack traces legíveis em produção), symbol sets e acesso à API em scripts:

```bash
npm install -g @posthog/cli@latest
posthog-cli login          # abre o navegador e guarda o token
posthog-cli sourcemap ...  # no pipeline de build
```

Em CI/agentes sem navegador, autenticar por variáveis de ambiente: `POSTHOG_CLI_HOST`, `POSTHOG_CLI_PROJECT_ID`, `POSTHOG_CLI_API_KEY`. O comando `posthog-cli api` expõe a API completa para o agente executar configurações que o MCP não permita.

> **Divisão de papéis:** MCP = o agente consulta e opera no fluxo da conversa. CLI = build/CI e configurações via API. ⚠️ Regra de sempre: revisar as chamadas do MCP antes de aprovar (dados de produto saem por ali) — e chaves do CLI nunca no repositório.

## 8. Sentry (erros)

1. Criar conta em sentry.io → projeto Next.js.
2. Instalar via wizard (`npx @sentry/wizard@latest -i nextjs`) — captura erros de frontend e backend com stack trace e release.
3. Alertas por e-mail em erro novo. Free tier: 5k erros/mês.
4. Alternativa open source self-hosted no futuro: GlitchTip (compatível com o SDK do Sentry).

### 8.1 Sentry no fluxo do agente de IA (MCP + CLI)

**MCP** ([mcp.sentry.dev](https://mcp.sentry.dev/)) — o agente investiga erros de produção de dentro da conversa ("qual o erro mais frequente desde o último deploy?") e chega à causa com o contexto do stack trace:

```bash
codex mcp add sentry --url https://mcp.sentry.dev/mcp
```

Ou editando `~/.codex/config.toml`:

```toml
[mcp_servers.sentry]
url = "https://mcp.sentry.dev/mcp"
```

Na primeira execução do Codex, abre o fluxo OAuth para conectar à conta Sentry.

**CLI** ([docs](https://docs.sentry.io/cli/)) — para build/CI e configurações via API: criação de releases, upload de source maps, notificação de deploys e associação de commits (liga o erro ao commit que o causou):

```bash
npm install -g @sentry/cli
sentry-cli login                    # ou SENTRY_AUTH_TOKEN em CI/agentes
sentry-cli releases new <versao>    # no pipeline de deploy
sentry-cli sourcemaps upload ...
```

> **Divisão de papéis:** MCP = investigar/triagem no fluxo da conversa. CLI = releases e source maps no pipeline (o wizard do Next.js já configura boa parte disso automaticamente). Token do CLI em GitHub Secrets, nunca no código.

## 9. OpenRouter (gateway de IA)

Toda chamada de IA do app (transcrição do áudio, interpretação de texto, redação das mensagens) sai por **uma única chave do OpenRouter** — que roteia para qualquer modelo do mercado.

1. Criar conta em openrouter.ai.
2. Comprar **crédito pré-pago** (começar pequeno: US$ 10–20).
3. Em `Settings → Limits`, definir o **teto de gasto** — é isso que garante zero surpresa de fatura.
4. Criar uma **API key por ambiente** (uma para produção, outra para desenvolvimento), cada uma com seu limite. Guardar no cofre de credenciais.
5. No app, a chave vive em variável de ambiente (`OPENROUTER_API_KEY`) — o código chama a interface própria (`lib/voz/`), nunca o provedor direto.

**Por que gateway em vez de conta direto no provedor:**
- Trocar de modelo (ou usar um modelo barato para transcrição e um melhor para redação) é **configuração, não código**.
- **Custo e logs de todas as chamadas num painel só** — dá para ver custo por usuário-dia, que é uma métrica do MVP.
- Fallback automático se um provedor cair.
- Boas práticas de IA (limites por chave, políticas) aplicadas no gateway, não espalhadas no código.

## 10. Monitoramento de uptime (opcional, 5 min)

- **UptimeRobot** (free, 50 monitores): monitorar `www.reroute.com.br` e `app.reroute.com.br`, alerta por e-mail se cair.
- Alternativa open source (Uptime Kuma) exige servidor próprio — não vale para o MVP.

---

## Ordem de execução sugerida

| # | Ação | Depende de | Quem |
|---|---|---|---|
| 1 | Criar repo `reroute-app` + colaborador + proteção da main | — | Ednei (guiado) |
| 2 | Migrar DNS para Cloudflare | — | Ednei + Renato |
| 3 | Corrigir domínio canônico da landing (reroutehns.com.br → www.reroute.com.br) | — | Renato |
| 4 | Supabase: projeto do app + SMTP via Resend | 2 | Renato |
| 5 | Projeto Vercel do app + `app.reroute.com.br` | 1, 2 | Ednei (guiado) |
| 6 | CI (`ci.yml` + `security.yml`) nos dois repos | 1 | Renato |
| 7 | PostHog + Sentry no esqueleto do app | 1 | Renato |
| 8 | OneSignal (web push) | 5 | Renato |
| 9 | UptimeRobot | 5 | Ednei |
