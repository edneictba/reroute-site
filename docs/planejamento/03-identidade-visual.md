# REROUTE — Identidade Visual

> Guia extraído da landing page oficial (`reroute-site`, atualizada em 02/08/2026 e em produção em https://www.reroute.com.br). Serve como fonte da verdade para a identidade visual da aplicação (app MVP), garantindo consistência entre landing, portal e produto.

## Conceito

O REROUTE se apresenta como um **Human Navigation System (HNS)**: um GPS para objetivos humanos. A metáfora central é **navegação** — quando a vida muda, o sistema **recalcula a rota** em vez de punir o erro. A identidade visual traduz isso com:

- **Fundo escuro profundo** (tema dark-first, remete a painel de navegação/cockpit)
- **Gradientes azul → ciano** (movimento, rota, tecnologia)
- **Verde/menta como cor de progresso** (chegada, sucesso, saúde)
- **Cantos bem arredondados** (acolhimento, sem agressividade)

## Tokens de cor

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#020617` | Fundo principal (azul-marinho quase preto) |
| `--bg2` | `#07111f` | Fundo secundário / gradientes de seção |
| `--panel` | `#0b1220` | Cartões e painéis |
| `--panel2` | `#111827` | Painéis elevados / hover |
| `--white` | `#ffffff` | Texto principal |
| `--muted` | `rgba(226,232,240,.82)` | Texto secundário |
| `--soft` | `rgba(255,255,255,.08)` | Superfícies sutis (chips, badges) |
| `--line` | `rgba(255,255,255,.12)` | Bordas e divisores |
| `--blue` | `#1687ff` | Cor primária de marca / CTAs |
| `--cyan` | `#22d3ee` | Cor secundária / destaque em gradientes |
| `--green` | `#22c55e` | Sucesso, progresso, confirmação |
| `--mint` | `#9fffc2` | Realce suave de progresso/positivo |

## Gradientes característicos

- **CTA / marca:** `linear-gradient(135deg, var(--blue), var(--cyan))`
- **Seções escuras:** radial azul no topo (`radial-gradient(circle at 75% 10%, rgba(22,135,255,.35), …)`) sobre `#020617`
- **Painéis:** `linear-gradient(145deg, rgba(255,255,255,.07), …)` sobre `--panel` (efeito vidro sutil)
- **Fundo de página:** `linear-gradient(180deg, #020617, #07111f 58%, #020617)`

## Tipografia e forma

| Elemento | Valor |
|---|---|
| Fonte | System stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Arial, sans-serif` |
| Largura máxima de conteúdo | `1180px` (`--max`) |
| Raio de borda padrão | `28px` (`--radius`) — cartões e botões bem arredondados |
| Espaçamento de seção | `110px` vertical |

## Tom de voz (copy)

Extraído da LP em produção:

- **Metáfora de rota em tudo:** "Se o seu destino é emagrecer, o REROUTE traça uma rota personalizada para a sua realidade."
- **Sem culpa, sem recomeço do zero:** quando a vida muda, o plano se adapta — nunca penaliza.
- **Português direto, segunda pessoa,** foco na realidade da pessoa (sono ruim, rotina corrida, medicação GLP-1).
- **CTAs de teste gratuito:** "Quero testar gratuitamente", "Cadastre-se gratuitamente".
- **Cautela clínica:** apoia quem usa medicação, mas nunca substitui orientação médica.

## Diretrizes para o app MVP

1. **Dark-first.** O app nasce com o mesmo tema escuro da LP. Se houver modo claro futuramente, derivar dos mesmos tokens.
2. **Reutilizar os tokens acima como design tokens** (CSS variables / Tailwind theme). Não inventar novas cores sem atualizar este guia.
3. **Progresso sempre em verde/menta**, rota e ação em azul/ciano.
4. **Uma tarefa por vez** na interface (decisão do kick-off, inspirada no app Fabulous): telas simples, um foco por tela, reduzindo ansiedade e aumentando conversão.
5. **Indicadores percentuais claros** de progresso/regresso alinhados às metas definidas no onboarding.
6. **Componentes com `border-radius` generoso (24–28px)** e bordas `rgba(255,255,255,.12)`.
7. **Logo:** matriz em `reroute-site/assets/images/logo-reroute-hns.png`, com variações otimizadas 320/640 em PNG e WebP.

## Pendências de identidade / SEO detectadas

- ⚠️ O repositório ainda referencia `https://reroutehns.com.br` como URL canônica (`index.html`, `robots.txt`, `sitemap.xml`), mas esse domínio **não resolve mais**. O domínio oficial é `https://www.reroute.com.br`. Corrigir canonical, sitemap e robots.
- Os guias `.codex/02_BRAND_GUIDE.md` e `.codex/05_DESIGN_SYSTEM.md` do repositório estão **vazios** — este documento pode ser usado para preenchê-los.
