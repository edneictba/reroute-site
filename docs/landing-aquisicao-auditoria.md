# Auditoria anterior à implementação — aquisição e acesso

Missão local, 15/09/2026. Sem commit, push, deploy ou alterações externas.

## Identificação e estado inicial

- Pasta: `C:/Users/Ednei/Desktop/REROUTE/Site/reroute-site-publicacao`.
- Remote conferido: `https://github.com/edneictba/reroute-site.git`.
- `index.html` já tinha um diff local da tentativa anterior do assistente: menu, título, descrição e nota do hero. Nenhum outro arquivo modificado no início. A missão atual substitui essa copy provisória.
- HTML/CSS/JS sem framework. `scripts/build.js` copia ativos e monta `/conheca/` com três templates extraídos do index. Landing, portal e admin coexistem; app está em outro repositório.
- Páginas públicas: index, conheca, política, termos e aviso legal. Portal e admin têm estruturas e APIs próprias; não serão alterados.
- Idiomas reais: PT, ES e EN em `src/scripts/i18n.js`, com seletores por CSS e data-i18n; escolha em localStorage. HTML base PT, sem URLs por idioma/hreflang. O AGENTS cita dois idiomas, mas o código tem três.

## Ativos e apresentação

- Logo oficial: `logo-reroute-hns-*` PNG/WebP, versão redonda e selos; favicons e manifest existentes.
- Fotos: `founder-before.jpeg` (1200×1600) e `founder-current.png` (462×612), inspecionadas, sem números de resultados e sem edição planejada.
- Seis artes `reroute-em-acao/01.png` a `06-1.png`: demonstrações ilustrativas em português. Não comprovam funcionalidades em produção. Inspecionada a arte do painel.
- Mapa HNS em JPG/PNG/WebP e tamanhos 640/960/1280; arte GLP-1 e `hero-phone-identity.png`.
- Sem arquivos de fontes ou vídeos encontrados no inventário de assets. Fonte de sistema. Ícones locais e SVGs inline.
- Preservar tokens navy/azul/ciano/verde, formas e identidade documentadas em `03-identidade-visual.md`.

## Copy obsoleta e função

- Hero/nota/CTA: expectativa de primeiros testes e acesso antecipado.
- Formulário e benefícios: participação em testes e lista de espera, não criação de conta.
- Modal de sucesso: afirma participação confirmada e e-mail enviado mesmo quando envio pode falhar.
- `/conheca/`: CTA final de primeiros testes; traduções reproduzem esse posicionamento.
- E-mail em `src/emails/templates/welcome-email.js`: preheader e corpo de lista de espera, lugar reservado e produto em desenvolvimento. PROIBIDO alterar nesta missão; conflito para revisão.
- IDs técnicos waitlist, evento welcome_waitlist e action Turnstile são contratos de integração, não copy a remover mecanicamente.

## Leads, proteção e fluxo posterior

- `waitlistForm`: nome, email, whatsapp_local com biblioteca intl-tel-input e hidden whatsapp E.164.
- JS envia exatamente name, email, whatsapp e turnstileToken para POST `/api/register-lead`.
- Nome mínimo 2, máximo 80 no servidor; e-mail máximo 254; telefone E.164; rejeição de campos extras e caracteres inválidos; corpo máximo 8192 bytes.
- Turnstile action `waitlist_registration`, validação de hostname, origin/host e rate limit por hashes HMAC de IP/e-mail.
- Servidor usa SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para RPC `register_public_lead`, associado à tabela leads; valores secretos não consultados. CSP cita o projeto público `lfubkmzwahfuvngegdhg.supabase.co`, o destino real depende do ambiente.
- Apenas status created dispara Resend; duplicatas não reenviam. Remetente vem de RESEND_FROM_EMAIL, reply-to contato@reroute.com.br. Falha no envio não desfaz lead e resposta continua success.
- Integração não cria usuário/Auth, nem concede acesso ao app. Nenhuma submissão real será executada.
- Proposta: manter contato opcional separado dos CTAs de acesso; documentar conflito do e-mail para decisão posterior.

## Analytics e SEO

- Analytics próprio `/api/analytics`: page_view, cta_click, form_open/start/submit/abandon, scroll_depth e page_duration; visitor/session IDs, opt-out, exclusão admin, cinco UTMs e referrer. Preservar arquivo e nomes de eventos.
- Meta Pixel 653689209335433 condicionado a consentimento; PageView e Lead existentes. Nenhum Google Analytics/GTM encontrado nos scripts públicos inspecionados.
- Index/conheca canonical e OG já apontam www.reroute.com.br. Robots/sitemap ainda apontam reroutehns.com.br; corrigir localmente.
- JSON-LD index contém SoftwareApplication com PreOrder, incompatível com disponibilidade; alinhar descrição e oferta inicial gratuita sem prometer módulos não verificados.
- OG/Twitter usam og-reroute.png existente; preservar imagem. Manter páginas indexáveis, headings e metadados coerentes.

## Evidência de produto e limites

- Inspeção pública no navegador: https://app.reroute.com.br redireciona para /entrar. Tela REROUTE ACESSO AO BETA oferece login Google ou envio de link por e-mail.
- Não houve autenticação, envio de link, cadastro ou alteração de conta. Elegibilidade de novos usuários não foi comprovada.
- Gratuidade inicial e experiência utilizável: fornecidas pelo responsável no briefing.
- Planejamento local ainda afirma app não iniciado e tem tarefas todo; não comprova entrega. Alimentação, proteína, hidratação, treino, GLP-1, hormônios, exames e recálculo automático não serão anunciados como funcionalidades verificadas.
- A página distinguirá acesso disponível, conceito de navegação e visão em evolução. Artes existentes serão rotuladas como ilustrativas.

## Estado final da missão

- Landing reposicionada localmente para aquisição e acesso.
- Hero apresenta “Emagrecer é o objetivo. Organização é a rota.”, HNS, experiência inicial gratuita e dois CTAs para `https://app.reroute.com.br/` e `/entrar`.
- Foi criado um bloco de acesso com distinção entre novo usuário e usuário existente.
- O formulário anterior foi mantido como contato opcional, com aviso explícito de que não cria conta e não é necessário para acessar o app.
- O tour de imagens foi movido para depois da proposta e rotulado como ilustração da ideia, sem afirmar que as telas representam a versão atual.
- A seção de evolução comunica direção futura sem prometer recursos ou prazo.
- JSON-LD foi alinhado a experiência inicial gratuita/InStock e o hash correspondente foi atualizado na CSP.
- Robots e sitemap apontam para `www.reroute.com.br`; canonical e OG existentes foram preservados.
- `src/scripts/script.js` transporta somente UTMs e identificadores de aquisição permitidos para o domínio verificado do app.
- PT, EN e ES receberam copy semanticamente equivalente; no browser, troca de idioma alterou `lang`, título e conteúdo sem reintroduzir termos de pré-lançamento na landing.

## Limites preservados e pendências reais

- Nenhuma submissão de formulário foi feita. A prévia usa `scripts/preview-landing.js`, que responde analytics localmente e nunca encaminha cadastro, Turnstile, Supabase ou Resend.
- Os smoke tests usam mocks/fetch simulado e não acessam dados reais.
- O e-mail transacional e os identificadores técnicos `waitlist`, `welcome_waitlist` e `waitlist_registration` ainda carregam nomenclatura de lista de espera. Eles não foram alterados porque são contratos da integração existente; revisar o texto/template em missão própria antes de mudar o fluxo de comunicação.
- A tela pública do app confirmou entrada por Google e link de e-mail; o restante da experiência não foi autenticado. Portanto recursos internos não foram anunciados como comprovados.
- A página “Conheça” continua herdando blocos compartilhados do index pelo build.
- `dist/` é saída gerada e aparece no status porque está rastreada no estado atual do repositório; não foi removida nesta missão.

## Validação executada

- `npm run lint`: passou.
- `npm run build`: passou.
- `npm run test:production`: passou — registro/Turnstile/Resend simulados, admin, analytics, Meta Pixel e readiness.
- Prévia isolada: `node scripts/preview-landing.js`, loopback em `http://localhost:4186`.
- Browser: hero e navegação revisados em desktop; layout revisado em 390×844; imagens carregadas sem falhas e sem overflow horizontal (`scrollWidth` menor que `innerWidth`).
- Browser: PT, EN e ES revisados; menu, seletor de idioma, CTAs, navegação interna, rodapé e disclosure do contato conferidos.
- Browser: botão do formulário sem dados exibiu validações, sem submissão.
- Browser: consentimento foi recusado na prévia; nenhum pixel de marketing foi habilitado.
- Não foram executadas migrations, SQL, Auth, RLS, Supabase remoto, Resend, deploy, commit ou push.

## Fechamento — hero de aquisição e cadastro no topo

Nesta etapa, o hero foi ajustado para comunicar que os primeiros acessos estão sendo liberados em lotes graduais, com cadastro gratuito e acompanhamento por e-mail. O formulário existente foi reposicionado uma única vez para o topo, à direita da mensagem no desktop e abaixo dela no mobile. O endpoint `/api/register-lead`, os campos, consentimento, Turnstile, proteção contra duplicidade, UTMs e eventos de analytics foram preservados.

O fluxo atual é: visitante novo lê a proposta, preenche o cadastro e aguarda a liberação por e-mail; quem já recebeu acesso segue diretamente para `https://app.reroute.com.br/entrar`. A revisão local não cria conta, não autentica usuário e não promete recursos futuros como disponíveis. Recursos apresentados como evolução continuam explicitamente separados da experiência atual.

O formulário não foi submetido no navegador. A prévia local continua isolada: analytics são respondidos localmente e o registro retorna bloqueio de prévia, sem Supabase, Resend, Turnstile remoto ou dados de produção. Nenhuma alteração de banco, Auth, RLS, infraestrutura, commit, push, publicação ou deploy foi feita nesta etapa.
