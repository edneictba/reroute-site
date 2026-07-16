# REROUTE Portal | Sprint 18 - Dados Financeiros de Staging

Data: 2026-07-15

## Objetivo

Popular o schema financeiro da Sprint 17 exclusivamente com dados ficticios e idempotentes para staging, e validar os limites de leitura impostos por RLS.

## Fixtures

O seed `supabase/seeds/staging/finance.sql` cria para a Organization `reroute` e o Investor Workspace:

- 10 contas ficticias referenciadas nas descricoes das transacoes;
- 8 categorias financeiras;
- 40 transacoes, incluindo receitas e despesas;
- 12 periodos de fluxo de caixa, usados como timeline financeira;
- 3 orcamentos;
- 1 resumo com indicadores executivos.

O schema da Sprint 17 nao possui tabelas normalizadas para contas, categorias ou eventos. Para manter esta sprint limitada a fixtures, contas e categorias usam os campos textuais das transacoes e a timeline usa `financial_cash_flows`. Nenhuma tabela ou tela foi criada.

## Idempotencia e Ambiente

- IDs UUID fixos e reservados para staging;
- `ON CONFLICT ... DO UPDATE` em todos os conjuntos;
- falha explicita se Organization REROUTE ou Investor Workspace nao existirem;
- nenhum usuario, dado pessoal ou dado financeiro real no seed;
- arquivo fora de `supabase/migrations`, evitando aplicacao automatica em producao.

## Testes RLS

O teste `test_finance_staging_read_rls.sql` cobre:

- usuario com `finance.read`;
- usuario com `finance.manage`;
- usuario sem capability financeira;
- usuario autorizado em outro Workspace;
- usuario autorizado em outra Organization;
- ownership dos registros pela Organization REROUTE e Investor Workspace.

O teste abre transacao e executa `ROLLBACK`, usando apenas usuarios ficticios `example.test`.

## Fora do Escopo Confirmado

- escrita financeira pelo Portal;
- upload ou Storage;
- API publica;
- service role;
- producao;
- dados reais;
- alteracoes de layout, Landing Page, Leads, Resend ou autenticacao.

## Proxima Sprint Recomendada

Executar o seed e a suite RLS em um Supabase staging isolado. Apos homologacao, conectar os graficos existentes ao fluxo de caixa real, sem criar novas telas.

