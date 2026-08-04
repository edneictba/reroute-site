# REROUTE — O Protótipo Guiado

> Demo navegável em https://rnatto-gempe.github.io/reroute-app/ — arquivo único (`index.html` do repo `reroute-app`), publicado automaticamente a cada push.

## ⚠️ Antes de tudo: o que você está vendo

O protótipo **não é o produto** — é uma **simulação guiada**, feita para mostrar a visão completa do REROUTE funcionando antes de existir backend. Três coisas para saber antes de abrir:

1. **Tem uma persona.** Você navega o app pelos olhos do **Renato, 41 anos**, que usa **Mounjaro 5 mg** (caneta semanal), se cadastrou na landing `reroute.com.br` e entrou no beta por cupom. Todos os dados — peso, rota, histórico, sintomas — são **fictícios e coerentes com essa história**.
2. **Tem um storytelling para seguir.** Um roteiro de **17 capítulos** conduz a visita na ordem certa: cada capítulo abre a tela correspondente e explica o que ela prova. É assim que o protótipo deve ser apresentado — seguindo os capítulos, não clicando aleatoriamente.
3. **Nada é real.** Sem backend, sem autenticação, sem persistência: a navegação é simulada dentro do próprio HTML. Serve para validar fluxo e conceito — as decisões oficiais moram no planejamento (se algo divergir, **o planejamento manda**).

## Por que uma persona e um roteiro

Um protótipo de telas vazias não convence ninguém — e um app de acompanhamento só faz sentido **com semanas de história dentro**. A persona resolve isso: o Renato tem rota em andamento, ciclo de dose, lapsos no histórico e progresso visível, então cada conceito (a Linha, o Dial, o recálculo) aparece **funcionando sobre uma vida plausível**. E o roteiro garante que quem assiste entenda o *porquê* de cada tela, na ordem em que os conceitos se constroem.

## Os 17 capítulos do roteiro

| # | Capítulo | O que mostra |
|---|---|---|
| 01 | A chegada | Lista de espera → cupom → PWA (o único canal ativo hoje) |
| 02 | O consentimento | Antes do primeiro dado, a permissão (LGPD) |
| 03 | As perguntas | Onboarding: uma pergunta por tela, nenhuma sobre caloria |
| 04 | A primeira rota | A Linha como centro de tudo; destino em etapas de ~2 kg |
| 05 | O app fala primeiro | Duas notificações por dia: manhã e noite |
| 06 | O input diário | Três perguntas de manhã (~30 segundos) |
| 07 | O recálculo | A resposta vira outra rota, não uma cobrança |
| 08 | A negociação | O Dial: "quanto você consegue hoje?" — com piso científico |
| 09 | Treino | Recomendação, progressão e registro |
| 10 | Alimentação | Porções e âncoras, nunca macros |
| 11 | Exames | O que trava, ajusta e contextualiza (visão pós-MVP) |
| 12 | O profissional | Dois humanos no loop — áudio da nutricionista (pós-MVP) |
| 13 | A caneta | O ciclo de 7 dias da dose molda a semana inteira |
| 14 | O confronto | Quando o app deixa de ser gentil (escada de exigência) |
| 15 | Fechar o dia | Método ROTA: reconhecer, observar, traçar, agir |
| 16 | A prova | Uma linha que não sabe quebrar |
| 17 | Os limites | O que o app **nunca** faz |

> Dá para **sair do roteiro** a qualquer momento e explorar livremente (tabs Rota · Evolução · Insights · Perfil) — e voltar ao capítulo de onde parou.

## Como apresentar (dicas de demonstração)

- **Siga os capítulos na ordem** — eles constroem o argumento do produto do jeito certo.
- **O momento "uau"**: no check-in, responda **"Náusea"** em Corpo e veja a rota do dia mudar na hora — é o recálculo acontecendo, o coração do produto.
- **No Dial (cap. 08)**: arraste para baixo do plano e mostre que o número escolhido vira compromisso ("Renato disse 6, amanhã o app cobra 6 — não 15").
- Os capítulos 11 e 12 (exames, profissional) mostram **visão de futuro** — deixe claro que são pós-MVP.

## Relação com o resto da documentação

| O protótipo mostra | O documento que define |
|---|---|
| Os conceitos de UX (Linha, Dial, Espelho, humores) | `01-planejamento-mvp.md` (Etapas 02–05) |
| O escopo do que entra primeiro | `01-planejamento-mvp.md` (Etapas 00–01) |
| O visual | `03-identidade-visual.md` |
| O que vira código de verdade (motor, regras) | `02-arquitetura-tecnica.md` |

O protótipo evolui em paralelo (todo push na `main` republica a demo) — ele é a **vitrine da visão**, não a especificação. Especificação é o planejamento.
