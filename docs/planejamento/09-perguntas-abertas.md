# REROUTE — Perguntas Abertas

> Decisões cruciais para o projeto dar certo que **ainda não têm resposta definida** — são necessidades a resolver antes de seguir, não tarefas atribuídas. Cada uma tem contexto, o que já sabemos e a limitação atual. Este documento é vivo: pergunta respondida vira decisão registrada (ADR ou planejamento) e sai daqui.

## 1. Onde entra IA no MVP — e o que chamamos de "IA"? 🔴 a mais importante

### O que já está definido tecnicamente

O limiar técnico é claro e está na arquitetura ("o motor é o produto; o LLM é a voz"):

| Camada | É o quê | Exemplos no MVP |
|---|---|---|
| **Algoritmo / automação** (motor determinístico — testado, previsível, auditável) | **Não é IA.** É código com regras fixas e fonte citável | Recálculo da rota (regras SEG/CUI/SIN/NIV/REC/PRG) · metas de proteína (PEP) · escada de movimento e portões de progressão · travas de segurança · notificações agendadas · degradação por sintoma |
| **IA de verdade no MVP** (modelos de linguagem/voz) | Interpretação e comunicação | Transcrição do áudio do check-out (voz → texto) · interpretação de texto livre → estado estruturado ("acordei destruída" → energia baixa) · redação das mensagens no tom "amigo virtual" (Etapa 04, sobre o plano imutável) |
| **IA fora do MVP** | Fica para depois | Foto de refeição · leitura de exames (VLM) · detecção narrada de padrões longitudinais |

### A pergunta aberta

**Na comunicação do produto, o que apresentamos como "IA"?** O recálculo — o coração do produto — é algoritmo determinístico, de propósito (segurança, previsibilidade, auditoria). Mas o mercado compra "IA", e a experiência da pessoa (o app "entende" o que ela fala e responde como um amigo) parece IA de ponta a ponta.

- **Risco de inflar**: expectativa errada ("a IA decide meu plano"), fragilidade regulatória (IA decidindo saúde é exatamente o que NÃO fazemos — e é nossa defesa), e perda de confiança se a pessoa perceber o exagero.
- **Risco de esconder**: perder o apelo de mercado num nicho onde "IA" vende, e subvender o que de fato existe (a camada de linguagem é IA real).
- **Um caminho possível** (a discutir): comunicar como *"acompanhamento inteligente"* — a IA conversa com você; as regras de saúde são ciência revisada por profissionais, não palpite de robô. Isso transforma o limiar em argumento de venda em vez de constrangimento.

**Como se decide:** discussão de posicionamento na call, com a fronteira técnica validada. **Onde registrar:** ADR + guia de copy da landing.

---

## 2. De onde vêm os exercícios (e as animações) do treino? — necessário antes de fechar a Etapa 00

### O que já exploramos

| Fonte | Serve para | Limitação |
|---|---|---|
| free-exercise-db (GitHub) | Taxonomia (nomes, músculos, mecânica) | **Imagens com procedência quebrada** — não usar as imagens |
| Everkinetic (CC BY-SA) | **Imagens estáticas do MVP**, com atribuição | Estáticas (sem animação); adaptar obriga a compartilhar a arte derivada |
| wger | Conferência técnica de nomenclatura | Código AGPL + dados share-alike — não embarcar |
| Darebee | 2.700 treinos prontos, planos por nível | ❌ **Verificado em 04/08/2026: descartado.** "© All Rights Reserved — materiais únicos, com copyright e exclusivos do darebee.com". Sem licença aberta; uso vetado sem permissão expressa. É non-profit — um contato pedindo parceria é possível, mas não contamos com isso |
| Mixamo (Adobe) | Renderizar biblioteca própria (v2+) | Serviço em abandono — baixar e versionar antes de depender |
| Figura paramétrica ("bonecos") | — | **Descartada** (não atingiu padrão visual) |
| Guia de Atividade Física (Min. Saúde) + Compendium 2024 | Âncora normativa + intensidade (MET) | Nenhuma — são as referências citáveis |

### Limitação atual (honesta)

Temos taxonomia limpa e **imagens estáticas licenciadas** (Everkinetic) para ~20 movimentos. **Não temos animações/GIFs/vídeos com licença comercial clara.** E nenhum catálogo publica sem revisão CREF.

### O que precisa ser respondido antes de seguir

Existe fonte de exercícios com **animação** (GIF/vídeo/ilustração animada) e licença comercial clara — ou o MVP vai de imagem estática mesmo? Prompt de pesquisa pronto (ChatGPT/Codex, modo pesquisa):

```
Preciso de bancos de exercícios físicos com ANIMAÇÕES (GIF, vídeo ou ilustração
animada) para usar num aplicativo comercial de emagrecimento no Brasil.
Requisitos: licença que permita uso comercial sem obrigar a liberar nosso
material (evitar share-alike); exercícios de peso corporal e elástico para
iniciantes; ideal se tiver nomes de músculos e nível.
Para cada fonte encontrada me diga: nome, link, tipo de licença (com link da
licença), o que exatamente posso usar, o que é proibido, e se tem custo.
Não inclua o Darebee — já verificamos: é "All Rights Reserved", descartado.
Formato: tabela comparativa + sua recomendação final.
```

---

## 3. De onde vêm os dados de alimentação (alimentos, porções, calorias)? — necessário antes de fechar a Etapa 00

### O que já exploramos

| Fonte | Serve para | Limitação |
|---|---|---|
| **POF/IBGE** (Tabelas de Composição Nutricional) | **Fonte primária escolhida** — pública, preparações brasileiras reais | Precisa **baixar, estruturar e auditar** — ninguém fez ainda; o catálogo semente de 20 alimentos é protótipo não auditado |
| TBCA (USP) | A melhor base brasileira (5.700+ alimentos) | **Uso em ferramenta exige licença paga** — bloqueada; possível negociação comercial futura |
| USDA FoodData Central | Preencher lacunas (suplementos, importados) | Matriz alimentar americana (divergência de 5–10%) |
| Open Food Facts | Industrializados por código de barras | Licença ODbL — só isolada via API, nunca misturar na base própria |

### Limitação atual (honesta)

A decisão de produto é mostrar **porções (modelo PEP), nunca calorias** — mas a base por trás precisa dos dados por 100g de qualquer jeito. Hoje **não temos a POF estruturada** nem revisor CRN definido. Sem isso, a orientação alimentar do MVP fica no genérico (proteína/água/fibra sem catálogo).

### O que precisa ser respondido antes de seguir

Quantos alimentos o MVP precisa cobrir para as âncoras de proteína do público-alvo (50? 200?)? A POF estruturada cobre? Vale iniciar conversa comercial com a TBCA? Prompt de pesquisa pronto:

```
Quero montar a base de alimentos de um app de emagrecimento brasileiro.
Já sei que: a POF/IBGE tem tabelas públicas de composição nutricional
(inclusive versão "estruturada para banco de dados"), a TBCA da USP é a melhor
mas cobra licença para uso em ferramenta, e a USDA é domínio público mas
americana.
Me ajude a: (1) achar o link de download da POF estruturada e me explicar o
formato dos arquivos; (2) listar outras bases brasileiras públicas que eu não
citei, com licença de cada uma; (3) estimar quantos alimentos um app focado em
PROTEÍNA para quem usa caneta de emagrecimento precisa cobrir no mínimo.
Formato: passo a passo + tabela de fontes + recomendação.
```

---

## 4. Outras perguntas em aberto (curtas, mas bloqueiam)

| # | Pergunta | Por que importa | Bloqueia o quê |
|---|---|---|---|
| 4.1 | **Quem são os revisores CRN e CREF?** | Nenhum catálogo de saúde publica sem `revisado_por` | Etapa 00 (catálogos) |
| 4.2 | **Preço e cobrança** — R$ 8 se sustenta? Anual desde o início? | Define a conta de viabilidade inteira (inclusive custo de push/LLM por usuário) | Ligar o paywall |
| 4.3 | **Jurídico do dado de saúde** — quem redige a política de privacidade e o consentimento LGPD do app? | Dado de saúde é dado sensível; consentimento precisa ser específico e destacado | Abrir o beta |
| 4.4 | **Canal B2B (clínicas/nutricionistas)** — quando começa a conversa? | O storytelling de indicação profissional depende disso; cedo demais dispersa o MVP | Pós-beta |

---

## Como usar este documento

- Na call de quinta: escolher **uma pergunta por semana** para fechar — não todas de uma vez.
- Pergunta respondida → vira ADR (decisão estrutural) ou entrada no planejamento → **sai daqui**.
- Pesquisa rodada → o resultado entra como anexo em `referencias/` e a decisão volta para a call.
