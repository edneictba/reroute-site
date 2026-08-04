# REROUTE — Índice das Referências de Concepção

> Mapa dos artefatos em `referencias/sugestoes-iniciais/` (9 de 22 arquivos da concepção — todos os **7 vigentes** estão presentes). Cada um é um HTML autocontido, aberto direto no navegador. Este índice diz o que tem em cada um e o que ainda vale.

## Vigentes (base do planejamento)

| Arquivo | O que contém | Status |
|---|---|---|
| `reroute-00-indice.html` | Capa navegável dos 22 artefatos, classificação vigente/referência/iteração, mapa tema → arquivo | Vigente |
| `reroute-pesquisa-mercado.html` | Mercado BR (R$ 11→20 bi), 9 concorrentes com gap, 4 gaps de oportunidade, posicionamento validado pilar a pilar, decisão de métrica (perda de peso NÃO é métrica primária) | Vigente — fundação do `00-contexto-e-visao.md` |
| `reroute-documentacao.html` | **O documento central**: hipótese testável e 3 provas; catálogo de 11 fontes de dados com licenças; modelo PEP; escada de movimento N0–N4; matriz cruzada (estado do dia × 4 pilares); arsenal de 18 argumentos por ID; arquitetura estático vs IA com contrato de execução; limiar do piso (VILPA); camada de exigência (escada de 6 níveis); **5 simuladores executáveis do motor determinístico** | Vigente — base das Etapas 00–04 |
| `reroute-proposta-app.html` | Os 6 conceitos de UX (A Linha, Dial do Possível, O Porquê em um toque, dois humores, O Espelho, A Conversa) + **plano de construção em 5 etapas por risco de invalidação** (adotado no `01-planejamento-mvp.md`) | Vigente |
| `reroute-app-ui-v3.html` | Demo navegável final na identidade oficial: tabs Rota/Evolução/Insights/Perfil, check-in/check-out, registro de caneta, áudio da nutricionista, ingestão de exames; 35 ícones SVG, 5 gráficos SVG | Vigente — referência de UI |
| `reroute-camada-exames.html` | 12 marcadores classificados (trava/ajusta/contextualiza/sinaliza), gate crítico TFG→proteína (KDIGO), pipeline de 5 passos com confirmação humana, limites LGPD | Vigente — **pós-MVP** |
| `reroute-ingestao-exames.html` | Engenharia de entrada de exames: hierarquia PDF nativo > escaneado > foto, cascata de roteamento, templates por laboratório, **7 validações**, caminho LOINC/RNDS, **stack sugerida** (PyMuPDF/pdfplumber/pdf.js, OpenCV, VLM com saída validada por schema) | Vigente — **pós-MVP** |
| `reroute-spec-audio-hitl.html` | Spec do áudio da nutricionista com validação humana em duas camadas (HITL), 3 estados de confiança, resolução de conflito com trava, pendência jurídica bloqueante | Vigente — **pós-MVP** |

## Referência técnica (parcialmente superada)

| Arquivo | O que contém | Atenção |
|---|---|---|
| `reroute-camada-exercicio.html` | Fontes e licenças de dados de exercício, fato vs obra (PI), pipeline de ingestão, schema SQL do catálogo, 3 instrumentos de avaliação, regras E1–E6 do motor | ⚠️ **§03 e §04 (figura paramétrica/"bonecos") estão SUPERADAS e descartadas** (decisão reafirmada em 04/08/2026). Vale: §01, §02, §05, §06, §07. Arte do MVP: **Everkinetic (CC BY-SA)** com atribuição |

## Não presentes na pasta local

Referência técnica: camada de alimentação (nº 06), imagem de exercício (nº 08), framework de acompanhamento (nº 09), camada de exigência (nº 10), escada de movimento (nº 11) — o conteúdo essencial deles está resumido dentro do `reroute-documentacao.html`. As 9 iterações históricas (nº 14–21) também não estão — dispensáveis.

## Decisões transversais extraídas das referências

1. **Testes antes do código, em tudo**: suíte do motor a partir da matriz cruzada; validações de ingestão antes do parser; gates de exame como casos de teste antes do OCR.
2. **Nada publica sem revisor**: CRN (nutrição/arsenal), CREF (exercício), médico (regras de exame).
3. **Licenças auditadas**: POF/IBGE primária (TBCA paga — bloqueada; Open Food Facts isolada por ODbL); taxonomia do free-exercise-db sem imagens; Everkinetic com atribuição em banco e UI; wger só conferência (AGPL); Mixamo baixar e versionar antes de depender.
4. **A faixa do laudo é a verdade operacional** (exames): nunca tabela própria de normalidade, nunca diagnóstico.
5. **Extrair, confirmar, descartar o arquivo** (áudio e laudo): dado sensível não fica armazenado além das diretrizes estruturadas confirmadas.
6. **Fragilidade conhecida**: o estudo "13% peso / 3% músculo" é o número mais frágil do arsenal — verificar na fonte antes de usar em marketing.
