# REROUTE — Contexto e Visão do Produto

> Documento-base da consultoria. Consolida o kick-off de 30/07/2026 e a pesquisa/documentação de concepção (`referencias/sugestoes-iniciais/`). É o ponto de partida para qualquer pessoa (ou agente de IA) entender o projeto.

## O que é o REROUTE

O REROUTE é um **Human Navigation System (HNS)**: um "GPS para emagrecer". A pessoa define o destino (emagrecer com saúde) e o sistema traça uma rota personalizada — e, quando a vida sai do planejado (sono ruim, festa, viagem, efeito colateral da medicação), **recalcula a rota em vez de punir o erro**.

**Método ROTA**: recalcular em vez de recomeçar. O princípio-síntese do produto é: *"o erro não quebra nada — e a interface não pode ter um lugar onde algo quebre."*

## Público-alvo do MVP

Pessoas em processo de emagrecimento, **com ou sem medicação GLP-1** (semaglutida/Ozempic, tirzepatida/Mounjaro, retatrutida). O produto é **agnóstico de medicação**: acompanha quem usa, quem não usa e quem está saindo da medicação.

## Por que agora (síntese da pesquisa de mercado)

- Mercado brasileiro de canetas GLP-1: **R$ 11 bi (2025) → R$ 20 bi (2026)** com a perda de patente da semaglutida em março/2026 (preços devem cair 30–50%).
- **64,8%** descontinuam a medicação em 12 meses; **⅔ do peso perdido volta em 1 ano** após parar.
- Até **40% do peso perdido pode ser massa magra** sem proteína adequada e treino de força.
- O mercado está polarizado entre **trackers passivos baratos** (Shotsy) e **programas clínicos caros** (Noom, telehealth). Há um **vazio no meio**: comportamento adaptativo, agnóstico de medicação, a preço de assinatura de consumo.

### Os 4 gaps que formam a oportunidade

1. **Preservação de massa magra** — fosso mais defensável; nenhum app brasileiro cobre bem.
2. **A fase de saída da medicação** — ninguém acompanha; módulo de manutenção pós-medicação é diferencial genuíno.
3. **Adaptação, não registro** — efeito colateral é o motivo nº 1 de desistência (28,2%); recalcular o plano a partir do sintoma ataca a causa do abandono.
4. **Retenção pela não-punição** — 70% abandonam apps complexos em 2 semanas; autocompaixão pós-lapso reduz o lapso seguinte.

### Posicionamento

> *"Um GPS para emagrecer — usando ou não medicamentos — sem perder saúde, força e a capacidade de continuar."*

**Atenção competitiva:** a Liti (BR) já ocupa a narrativa de "companheiro diário de emagrecimento", mas é anti-medicação. O diferencial do REROUTE deve ser **recálculo sem punição + preservação de força + agnosticismo de medicação** — não "acompanhamento diário".

## Decisões do kick-off (30/07/2026)

| Decisão | Detalhe |
|---|---|
| **Escopo do MVP** | Foco único: emagrecimento. Básico de treino, alimentação e check-in diário. Evitar dispersão. |
| **Plataforma** | **Aplicação web (PWA)** primeiro — atalho na tela do celular, sem depender de aprovação em lojas. App Android depois (taxa única US$ 25); iOS via atalho web (Apple cobra US$ 99/ano). |
| **Check-ins** | Notificação no início do dia (planejamento) e no fim do dia (check-up). Formulários simples, possivelmente entrada por voz. |
| **UI** | Uma tarefa por vez (inspiração: app Fabulous). Progresso visual com percentuais claros. |
| **Relação com IA** | A IA como "amigo virtual": conexão, acompanhamento da jornada, sem substituir orientação médica. |
| **Fonte da verdade** | GitHub. Todo código versionado; `node_modules`/`.next` fora do repositório. |
| **Infra atual** | Vercel (hospedagem), Supabase (dados/auth/e-mail), Registro.br (domínio reroute.com.br), Resend (e-mail transacional). |
| **Repositórios** | Separar landing page, portal do investidor e aplicativo MVP. |
| **Qualidade** | Validação automática de código antes de produção (CI). Camada de segurança desde o início. |
| **Monetização** | Momento de pagamento dentro do MVP ainda a definir. Benchmark: assinatura anual retém ~33% vs 17% da mensal. |

## Limites éticos e regulatórios (inegociáveis)

1. O app **orienta e apoia execução; nunca prescreve** nem substitui aconselhamento médico/nutricional.
2. Catálogos de nutrição e exercício só vão ao ar com **revisão profissional registrada** (CRN para nutrição, CREF para exercício) no campo `revisado_por`.
3. Travas de segurança (ex.: por exame) **nunca são desativadas** por diretriz de usuário — funcionam como teto.
4. Diretrizes de suplementação, dose ou medicamento **nunca viram campo estruturado** — ficam como nota literal para a consulta.
5. Conflitos entre fontes legítimas (profissional × trava por exame) ficam **visíveis e pendentes**, nunca resolvidos silenciosamente por algoritmo.

## Métricas do MVP (decisão da pesquisa)

**Perda de peso NÃO é a métrica primária** (desfecho lento, confundido pela medicação, e otimizá-la leva às práticas que destroem retenção). As provas do produto são:

- **Retenção D7 / D30**
- **Recuperação pós-lapso em 48h**
- **Dias compostos** (proteína + movimento no mesmo dia)

## Estado atual dos ativos

| Ativo | Estado |
|---|---|
| Landing page | Em produção em https://www.reroute.com.br, refeita para o MVP de emagrecimento, com formulário de lista de espera (Supabase) + Turnstile |
| Portal do investidor | Em produção em portal.reroute.com.br (mesmo repositório) |
| Admin/analytics da landing | Dashboard próprio com API serverless na Vercel |
| App MVP | **Não iniciado** — objeto deste planejamento |
| Documentação de concepção | 22 artefatos HTML; os **7 vigentes** estão em `referencias/sugestoes-iniciais/` (9 arquivos no total) |

## Decisões posteriores ao kick-off

- **04/08/2026 — Arte de exercício:** o sistema de figura paramétrica ("bonecos" gerados por ângulos) foi **descartado** — não atingiu o padrão visual para produto de saúde. O MVP usa o acervo **Everkinetic (CC BY-SA)** com atribuição no banco e na UI; biblioteca própria fica no backlog.

## Pendências de contexto

- Os artefatos de **referência técnica** da concepção (camada de alimentação, imagem de exercício, framework de acompanhamento, camada de exigência, escada de movimento) ainda não estão na pasta local — pedir ao Ednei se forem necessários (os 7 vigentes já cobrem o planejamento).
- ⚠️ O domínio `reroutehns.com.br` referenciado no repositório como canônico **não resolve mais**; o oficial é `www.reroute.com.br` (corrigir SEO).
- Definir os profissionais responsáveis (CRN e CREF) antes de publicar catálogos.
- Validação jurídica do consentimento de duas partes para a feature de áudio profissional (bloqueante do HITL 2 — feature pós-MVP).
