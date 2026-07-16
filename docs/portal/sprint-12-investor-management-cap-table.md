# Sprint 12 - Gestão de Investidores e Cap Table

## Objetivo

Criar a primeira versão demonstrativa do módulo de Gestão de Investidores e Cap Table, sem conectar dados reais, tabelas reais, documentos reais ou usuários reais.

## Rota

- `/portal/investidores/`

A rota é protegida por:

- sessão autenticada;
- contexto obrigatório;
- `portal.access`;
- `workspace.access`;
- `investor.manage`.

O item de navegação também exige `investor.manage`, evitando exibição para o role `investor` comum.

## Provider

O módulo usa exclusivamente:

- `src/portal/providers/demo-investors.js`

O provider centraliza:

- resumo geral;
- 20 posições numeradas de `01` a `20`;
- cap table;
- aportes demonstrativos;
- documentos demonstrativos;
- status;
- alertas;
- dados para gráficos;
- labels de exibição.

## Regras das 20 Posições

- Cada posição representa uma cota demonstrativa.
- Cada cota representa 5% de participação.
- O valor demonstrativo por cota é R$ 50.000.
- Posições disponíveis possuem valores zerados.
- Posições ocupadas possuem `committedAmount = paidAmount + pendingAmount`.

## Cálculos

São calculados pelo provider:

- total de cotas;
- cotas ocupadas;
- cotas disponíveis;
- capital previsto;
- capital comprometido;
- capital integralizado;
- saldo a integralizar;
- participação distribuída.

## Cap Table

A tabela exibe:

- número;
- cotista;
- cotas;
- participação;
- capital comprometido;
- integralizado;
- pendente;
- status;
- documentação;
- acesso;
- detalhe.

Recursos:

- filtros;
- pesquisa;
- badges;
- barra de participação;
- estado vazio;
- estrutura preparada para paginação futura.

## Histórico de Aportes

Cada posição com capital comprometido possui histórico demonstrativo com:

- compromisso;
- integralização;
- complemento pendente quando aplicável;
- referência fictícia;
- comprovante placeholder.

## Gráficos

Foram preparados quatro gráficos demonstrativos:

1. Capital comprometido versus integralizado.
2. Distribuição de participação por cotista.
3. Ocupação das 20 cotas.
4. Evolução demonstrativa das integralizações.

## Alertas

Os alertas são calculados pelo provider:

- cotas disponíveis;
- integralizações pendentes;
- documentos aguardando revisão;
- convites não enviados;
- participação distribuída dentro do limite previsto.

## Dashboard

O dashboard recebeu o card `Cap Table`, exibido apenas quando o contexto possui `investor.manage`.

## Integração Futura com Supabase

Para substituir o provider por dados reais:

1. Criar serviços protegidos para `investors`, `profiles`, `investments`, `quotas`, `user_roles`, `documents` e `financial_transactions`.
2. Manter dados pessoais fora do front-end quando não forem necessários.
3. Usar views agregadas para o cap table.
4. Aplicar RLS por organização, workspace, role e ownership.
5. Usar APIs serverless para ações administrativas sensíveis.
6. Registrar auditoria em alterações de cotas, aportes e documentos.

## Limitações

- Nenhum investidor real.
- Nenhum usuário real.
- Nenhum dado pessoal real.
- Nenhum valor financeiro real.
- Nenhum Supabase conectado.
- Nenhum Storage conectado.
- Nenhuma migration aplicada.
- Sem funcionalidade administrativa real de cadastro.

## Testes

Devem ser validados:

- total de 20 posições;
- unicidade dos números `01` a `20`;
- soma de cotas;
- soma de participação;
- consistência `committed = paid + pending`;
- lint;
- build;
- rota `/portal/investidores/`;
- dashboard;
- provider no `dist`.

## Próximos Passos

Sprint 13: preparar módulo administrativo demonstrativo para convites, status de documentação e auditoria visual, ainda sem dados reais.
