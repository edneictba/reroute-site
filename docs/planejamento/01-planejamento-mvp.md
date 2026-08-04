# REROUTE — Planejamento do MVP

> Roadmap de implementação do aplicativo REROUTE. Consolida o kick-off (30/07/2026) e os documentos de concepção (`referencias/sugestoes-iniciais/` — índice em `07-indice-referencias.md`). Harness-agnostic: qualquer agente de IA (Codex, Claude, Gemini) ou pessoa desenvolvedora executa a partir daqui.

## A hipótese que o MVP testa

> "Um loop diário curto que **recalcula o plano** em vez de **registrar falha** mantém mais pessoas em movimento do que um app que mede aderência — e o momento de maior alavancagem é **logo depois do lapso**, não no dia bom."

**Três provas** (perda de peso NÃO é métrica primária — entra só como tendência semanal secundária):

| Prova | O que mede | Alvo |
|---|---|---|
| Retenção | D7 e D30 | D7 ≥ 45% · D30 ≥ 30% (benchmark do mercado: ~30% no mês 1) |
| Recuperação | % que faz check-in em ≤48h após registrar lapso | ≥ 50% — métrica própria, nenhum concorrente mede |
| Dia composto | Dias com proteína + movimento juntos | crescer ao longo das semanas |

**Números-âncora:** 3 públicos (vai começar / está usando / já parou a caneta — modos do mesmo motor, não produtos distintos) · 2 check-ins/dia de ~30s (manhã calibra, noite recalcula) · 4 pilares (proteína, água/fibra, força, caminhada) · método **R·O·T·A** = Reconhecer, Observar, Traçar, Agir (executado no check-out).

## Princípios de execução

- **Web-first é o caminho crítico; Android é aditivo.** PWA em `app.reroute.com.br`, atalho na tela inicial, push — sem loja. Android (US$ 25) só depois do beta validar.
- **O motor é o produto; o LLM é a voz.** Regras de recálculo são código determinístico com suíte de testes escrita **antes** de qualquer prompt.
- **Primeiro o que pode matar a tese, depois o que a torna encantadora** — as etapas abaixo são ordenadas por risco de invalidação. Erro comum que essa ordem evita: construir a Linha bonita antes de saber se alguém faz check-in duas vezes por dia.

## Etapas de construção

### Etapa 00 — Fundação: motor e dados (3–4 semanas)
Risco que elimina: o produto virar "mais um app que chuta número".

- Repositório `reroute-app` + CI + esqueleto do projeto (engenharia: ver `04-boas-praticas.md`; infra: `05-setup-infraestrutura.md`)
- **Motor determinístico com suíte de casos derivada da matriz cruzada** (estado do dia × 4 pilares — 8 estados mapeados na concepção). Regras com ID auditável (`SEG-01`, `CUI-01`, `SIN-01..03`, `NIV-*`, `REC-*`, `PRG-*`)
- Tabela nutricional canônica ingerida da **POF/IBGE com `fonte_id` por linha** (TBCA bloqueada: exige licença paga; Open Food Facts isolada por ODbL)
- **Modelo PEP**: 1 PEP = porção que entrega ~25g de proteína (`g_por_PEP = 2500 / prot_100g`; ≤150g âncora, ≤400g complemento, >400g não-âncora). O app mostra porções, nunca gramas — mantém o produto fora do perímetro de prescrição (Lei 8.234/1991)
- Catálogo de ~20 movimentos (taxonomia do free-exercise-db só campos factuais; **imagens Everkinetic CC BY-SA com atribuição no banco e na UI** — figura paramétrica descartada em 04/08/2026)
- **Arsenal de 18 argumentos versionado** (IDs INI/LAP/EFE/PLA/MAR/SAI) — a IA só cita daqui, por ID, nunca gera número
- ⚠️ **Nada é publicado sem CRN e CREF em `revisado_por`**

**Critério:** motor passa 100% da suíte · zero linha de catálogo sem procedência.

### Etapa 01 — O Loop: provar a tese (4–5 semanas)
É o experimento. Se o loop cru não retém, nenhum conceito visual salva.

- Onboarding: uma pergunta por tela — altura, peso, objetivo, relação com a caneta (pretende/usa/parou) e qual (semaglutida, tirzepatida, retatrutida), nível declarado (**colocação sempre um degrau abaixo**), triagem de segurança e alimentar (modo cuidado)
- Check-in da manhã (calibra o dia) e check-out da noite com Método ROTA (clique + **áudio** — mesma informação, duas formas; foto fica fora)
- Micro-tarefa de hidratação incremental (500ml por toque) com fallback no check-out
- Registro de sintomas (náusea, constipação, cansaço, dor) alimentando o recálculo; dor forte → pausa + encaminhamento (regra `SEG-01`)
- Home mínima, **propositalmente simples e funcional** — sem Linha, sem dial, sem IA
- PWA instalável + push OneSignal (manhã/noite) + identidade visual (`03-identidade-visual.md`)
- Analytics desde o 1º dia (PostHog): as 3 provas mensuráveis
- **Beta com 30–50 pessoas reais via cupom** (paywall desenhado e desabilitado)

**Critério:** D7 ≥ 45% · D30 ≥ 30% · recuperação pós-lapso ≥ 50% em 48h.

### Etapa 02 — A Linha: tornar a tese visível (3 semanas)
O momento em que o app deixa de parecer um tracker.

- **A Linha** substitui histórico/streak: dia na rota = segmento reto; dia recalculado = curva; dia sem registro = tracejado mais fino. **Não existe estado em que a linha se rompa** — nunca zera, todo mês adiciona comprimento. A curva vira assinatura visual única da pessoa (objeto compartilhável, sem rede social)
- **O Espelho**: única comparação é com você mesmo, datada ("4 semanas atrás 10 min era seu teto; hoje você fez 22 conversando"). Zero ranking, zero comparação social
- Invariante: **não existe estado vermelho no histórico** — só verde (na rota) e âmbar (recalculado)

**Critério:** retorno à home fora do horário de check-in · D30 sobe vs coorte da Etapa 01.

### Etapa 03 — O Dial e a Conversa: a camada de exigência (3 semanas)
Onde o produto para de ser gentil e passa a ser eficaz. O oposto de autoritário não é frouxo.

- **Dial do Possível**: quando a pessoa não vai cumprir, em vez de sim/não abre um dial do plano até o **piso com evidência** (VILPA: 3–4 min vigorosos têm base; 1–2 min isolados não — o app não inventa benefício). Ceder tempo cobra intensidade em troca. **O número escolhido vira compromisso cobrado amanhã**; piso rompido 2× → o dial some e entra a Conversa
- **Escada de exigência de 6 níveis** (0–5): do recálculo silencioso à pausa formal. Nomeia padrão sem eufemismo ("3 das últimas 4 quartas quebraram — vamos mudar a quarta, não você"). Confronto **só de manhã**, nunca à noite. Modo cuidado trava a escada no nível 2; zero penalidade mecânica
- **O Porquê em um toque**: cada item da rota tem "?" que revela número, fonte, amostra e ressalva — transparência como jogada de marca para um público enganado a vida inteira

**Critério:** % de "não consigo" que vira compromisso menor (não silêncio) · cumprimento do piso negociado ≥ 70%.

### Etapa 04 — A Voz: camada de IA (4 semanas)
Personalização com guarda-corpo. O LLM nunca decide conduta — escolhe palavras e interpreta linguagem.

- Interpretação de texto livre → **enum validado** ("acordei destruída" → estado do motor)
- Redação das mensagens a partir do **plano imutável** + **arsenal por ID** (validador descarta mensagem com número fora da lista → fallback determinístico)
- **Bandit contextual** de tom e diretividade (recompensa: check-in no dia seguinte +1, piso cumprido +0,5, silêncio/desinstalação −2). Experimento sugerido: randomizar dial inicial entre 2 e 4 e comparar D30
- Detecção de padrão longitudinal (motor calcula, LLM narra — nunca inventa correlação)

**Critério:** fallback < 5% · acurácia texto→enum ≥ 90% · lift do bandit sobre tom aleatório.

### Etapa 05 — Os dois humores e o acervo próprio (contínuo)
Acabamento — nada aqui move retenção sozinho.

- **Modo partida** (manhã: agir, 3 passos, âmbar, tipografia grande) vs **modo chegada** (noite: observar, Linha crescendo, azul profundo). Cobrança nunca aparece à noite
- Substituição do Everkinetic por biblioteca própria (remove share-alike) — backlog
- App Android (TWA na Play Store)

## Aquisição, storytelling e paywall

A pessoa chega ao REROUTE por caminhos diferentes — e **o storytelling da primeira sessão não pode ser o mesmo** para todos. A concepção segmenta por relação com a caneta (vai começar / usa / parou); esta camada segmenta por **origem**, e as duas se cruzam no onboarding.

| Origem | Contexto emocional de chegada | Storytelling da primeira sessão | Confiança inicial |
|---|---|---|---|
| **Indicação de profissional de saúde** (nutricionista/médico recomenda — futuro canal B2B) | Já está em acompanhamento; chega com "tarefa de casa" | "Seu profissional cuida da estratégia; o REROUTE te ajuda a executá-la no dia a dia" — o app como aliado de quem ela já confia | **Emprestada** do profissional — alta |
| **Orgânico / Instagram** (Reels do Ednei; hoje ~70 visitas/dia na landing) | Chega da dor (efeito colateral, medo do reganho, culpa do lapso) e desconfiada — já foi enganada por promessa de emagrecimento antes | A promessa da rota: "errar não zera nada" + **O Porquê em um toque** (fonte e número visíveis) como prova de que não é mais um app de dieta | **Zero** — precisa ser construída na primeira sessão |
| **Boca a boca / cupom** (beta) | Veio por confiança em quem indicou; expectativa de exclusividade | "Você está entrando antes de todo mundo — sua experiência define o produto" + canal direto de feedback | Média — herdada da indicação |

**Implicações práticas (entram na Etapa 01):**

1. **Capturar a origem desde o primeiro toque**: UTM na landing → parâmetro no link do app → campo `origem` no perfil (+ código do cupom identifica quem indicou). Sem isso, nunca saberemos qual narrativa converte e retém melhor.
2. **Primeira tela do onboarding variando por origem** (o restante do fluxo é o mesmo — muda a moldura, não o formulário).
3. **Medir por coorte de origem no PostHog**: D7/D30 e conversão de onboarding separados por `origem` — decisão de canal com dado, não opinião.

### Onde fica o paywall

Decisão do kick-off ainda de pé: **posição estratégica definida no design, cobrança desabilitada no beta** (entrada por cupom). A direção que a evidência sugere — a validar com as coortes:

- **Paywall depois do primeiro valor entregue, nunca antes do onboarding.** Para o lead orgânico frio, cobrar antes da primeira experiência mata a conversão (e este público já desconfia). O momento natural: **depois do primeiro recálculo** — quando a pessoa relata um dia ruim e vê o plano de amanhã se adaptar em vez de puni-la, ela viu a única coisa que nenhum concorrente faz.
- **Quem vem por indicação profissional tolera paywall mais cedo** (confiança emprestada) — hipótese a testar por coorte.
- **Empurrar o plano anual** quando a cobrança ligar: anual retém ~33% vs 17% do mensal (benchmark RevenueCat).
- Cuidado registrado no kick-off: quem não pagou usa menos — o beta por cupom precisa de acompanhamento próximo (contato direto do Ednei) para compensar a falta de "skin in the game".
- Mecânica: **feature flag no PostHog** controla paywall on/off e variação por coorte — sem deploy para ligar/desligar.

## Fora do MVP (registrado para não voltar toda semana)

| Item | Gatilho para entrar |
|---|---|
| Camada de exames (12 marcadores, travas) | Pós-MVP — conjunto mínimo já sugerido: TFG/creatinina, hemoglobina, ferritina, vit. D, B12, TSH, glicemia/HbA1c |
| Ingestão de exames (PDF/OCR/LOINC) | Junto com a camada de exames; carimbar **LOINC no schema desde a 1ª migration** custa uma coluna e prepara o futuro |
| Áudio da nutricionista (HITL duplo) | Jurídico (consentimento de duas partes) + camada de exames |
| Foto de refeição | Precisão de estimativa ainda insuficiente |
| Wearables / bioimpedância | Tração do beta (bioimpedância 8–12 semanas transformaria "massa magra protegida" de proxy em medida real) |
| WhatsApp recorrente | Nunca (R$ 0,35/msg inviabiliza assinatura de R$ 8) |

## Pendências fora do app

| Pendência | Responsável |
|---|---|
| Corrigir domínio canônico da landing (reroutehns.com.br → www.reroute.com.br) | Renato |
| Resolver conversão da landing (~70 visitas/dia, 0 leads) | Ednei (com apoio) |
| E-mail: apontar SMTP do Supabase para o Resend (resolve o limite) | Renato |
| Confirmar regras atuais da Apple (US$ 99/ano + 30% IAP) | Renato |
| Definir profissionais revisores **CRN e CREF** (bloqueia publicação de catálogo) | Ednei |
| ~~Verificar licença do Darebee~~ ✅ 04/08: All Rights Reserved — **descartado** como fonte | — |
| Validar perímetro regulatório do PEP com CRN | ambos |
| Acesso à Vercel (Hobby não permite colaborador) — fluxo via GitHub | ambos |

## Ritmo de trabalho

- **GitHub é a fonte da verdade** ("o nosso Drive"): todo trabalho termina com commit e push.
- Encontros semanais (quinta): revisão, desbloqueio, aula prática.
- Ednei desenvolve com o Codex usando `06-prompts-codex.md`; o CI segura a qualidade.
- Renato estrutura fundações (repo, CI, motor, segurança) e ensina o fluxo.
