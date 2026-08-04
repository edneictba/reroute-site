# AGENTS.md — reroute-site

Manual operacional deste repositório para qualquer agente de IA (Codex, Claude, Gemini) e qualquer pessoa desenvolvedora. Leia antes de alterar qualquer coisa.

## O que é este repositório

Site institucional do REROUTE ("um GPS para emagrecer"), com **três superfícies no mesmo repo**:

| Superfície | URL | Código |
|---|---|---|
| Landing page | https://www.reroute.com.br | `index.html`, `conheca/`, `src/` |
| Portal do investidor | https://portal.reroute.com.br | `portal/`, `dist-portal/` |
| Admin da landing (leads/analytics) | `/admin` | `admin/`, `api/`, `server/` |

Site estático + funções serverless na Vercel. **Sem framework de frontend** — HTML/CSS/JS puro com build script Node (`scripts/build.js`). Deploy contínuo: merge na `main` publica na Vercel.

**A aplicação NÃO mora aqui** — vive em `github.com/rnatto-gempe/reroute-app` (privado). O planejamento completo está em `docs/planejamento/` (espelho) e no `docs/` do repo do app (fonte).

## Princípios

1. **GitHub é a fonte da verdade.** Todo trabalho termina com commit e push. `node_modules`, `.next`, `dist/` gerado — nunca no repo.
2. **Simplicidade primeiro.** Este site é estático de propósito. Não adicionar framework, CDN ou dependência sem necessidade clara.
3. **Supabase com RLS.** A tabela `leads` aceita INSERT público e nada de SELECT público. Policies em `supabase/`.
4. **Validar antes de subir.** `npm run lint` e os smoke tests existem para isso. Não publicar sem rodar.
5. **Preservar o design aprovado.** Mudança visual só com aprovação; a identidade está em `docs/planejamento/03-identidade-visual.md`.

## Comandos

```bash
npm install            # instalar dependências
npm run dev            # build local + servidor estático
npm run build          # build da landing (gera dist/)
npm run build:portal   # build do portal
npm run lint           # verificação de código
npm run test:production        # smoke tests: e-mail, admin, analytics, readiness
npm run test:portal-production # smoke tests do portal
```

## Estrutura

```
index.html          # landing (fonte)
conheca/            # página "Conheça o REROUTE"
src/styles/style.css    # tokens visuais em :root (fonte da identidade)
src/scripts/        # comportamento da landing + analytics + i18n
api/                # funções serverless (Vercel): leads, admin, analytics
server/             # lógica compartilhada das funções (Resend, Supabase)
portal/             # portal do investidor (páginas)
supabase/           # SQL: tabelas, policies RLS, migrations, seeds
scripts/            # build, lint e smoke tests
docs/               # documentação (adr/, portal/, planejamento/)
vercel.json         # rewrites das APIs + redirects (portal por hostname)
.env.example        # todas as variáveis de ambiente documentadas
```

## Integrações e variáveis

Ver `.env.example`. Resumo: **Supabase** (leads + portal), **Resend** (e-mail `boasvindas@email.reroute.com.br`), **Cloudflare Turnstile** (anti-spam do formulário), segredos de rate-limit e auditoria do admin. Segredos reais só no painel da Vercel — nunca no código.

## Armadilhas conhecidas

- ⚠️ **Domínio canônico divergente:** `index.html`, `robots.txt` e `sitemap.xml` ainda apontam `reroutehns.com.br`, que não resolve mais. O oficial é `https://www.reroute.com.br`. Corrigir e não reintroduzir.
- O plano Vercel é **Hobby**: sem colaboradores no painel. Todo o fluxo passa pelo GitHub; o deploy é automático.
- São **2 projetos Vercel apontando para este mesmo repo** (landing e portal). Cuidado ao mexer em `vercel.json`/`vercel.portal.json`.
- Os arquivos `.codex/*.md` são placeholders vazios de uma estrutura antiga — a documentação real é este arquivo + `docs/`.
- A landing tem versão em 2 idiomas (i18n em `src/scripts/i18n*.js`) — testar troca de idioma ao alterar copy.

## Planejamento do produto

A documentação de planejamento da consultoria (visão, MVP, arquitetura, boas práticas, infraestrutura, prompts) está em **`docs/planejamento/`**. Comece por `00-contexto-e-visao.md`.
