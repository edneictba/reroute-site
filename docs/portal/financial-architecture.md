# REROUTE Portal - Arquitetura Financeira

## Objetivo

O modulo financeiro deve permitir transparencia, controle e auditoria sem se tornar um ERP completo no inicio.

## Entidades

### accounts

Representa conta bancaria, caixa, PIX, cartao ou outras origens de recursos.

### transactions

Registra entradas, saidas, ajustes e estornos.

### transaction_categories

Classifica transacoes.

### cost_centers

Permite separar custos por area, projeto ou iniciativa.

### vendors

Fornecedores e prestadores.

### commitments

Compromissos futuros.

### payment_receipts

Comprovantes vinculados a transacoes.

### budgets e budget_items

Planejamento financeiro e comparacao realizado versus planejado. Pode ficar para fase posterior.

## Indicadores

Indicadores calculados:

- capital previsto;
- capital captado;
- total recebido;
- total utilizado;
- saldo disponivel;
- burn rate;
- runway;
- compromissos futuros;
- realizado versus planejado.

## Regras de Negocio

- Saldos devem ser calculados, nao editados manualmente.
- Correcoes devem ser registradas por estorno ou ajuste.
- Transacoes sensiveis devem gerar auditoria.
- Comprovantes devem ficar em Storage privado.
- Relatorios financeiros publicados devem ter status e historico.
