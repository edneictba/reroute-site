# Sprint 11 - Investor Intelligence Center

## Objetivo

Criar o primeiro módulo financeiro executivo para investidores. O módulo não é um ERP; é um painel demonstrativo de inteligência financeira para leitura estratégica.

## Rota

- `/portal/financeiro/`

A rota segue o padrão protegido do Portal:

- sessão autenticada;
- contexto obrigatório;
- capabilities `portal.access` e `workspace.access`.

## Provider

O módulo usa exclusivamente:

- `src/portal/providers/demo-finance.js`

O provider centraliza:

- visão geral financeira;
- indicadores executivos;
- dados de gráficos;
- categorias demonstrativas;
- widgets;
- timeline financeira;
- alertas demonstrativos;
- dados do card de dashboard.

## Estrutura do Módulo

A página contém:

- visão geral;
- alertas demonstrativos;
- gráfico de fluxo de caixa;
- gráfico de distribuição de custos;
- gráfico de progresso do orçamento;
- widgets executivos;
- timeline financeira.

## Dashboard

O dashboard recebeu o card `Saúde Financeira`, exibindo:

- runway;
- percentual utilizado;
- caixa atual;
- saldo disponível.

## Dados Demonstrativos

Categorias:

- Desenvolvimento;
- Infraestrutura;
- Marketing;
- Jurídico;
- Operacional;
- Administrativo;
- Design;
- IA;
- Consultorias;
- Reserva Estratégica.

Nenhum dado financeiro real foi conectado.

## Como Conectar Futuramente ao Banco

1. Criar tabelas para métricas financeiras executivas.
2. Separar dados agregados de dados transacionais.
3. Criar views seguras para investidores.
4. Aplicar RLS por workspace, role e capability.
5. Criar serviços de leitura protegidos.
6. Substituir `getDemoFinanceData()` por consulta real mantendo o mesmo contrato.
7. Manter dados sensíveis fora do front-end quando não forem agregados.

## Limitações

- Nenhum dado financeiro real conectado.
- Nenhuma alteração em Supabase.
- Nenhuma alteração em Storage.
- Nenhuma alteração em RLS.
- Nenhuma alteração em autenticação.
- Valores, alertas e gráficos são demonstrativos.

## Próxima Sprint Recomendada

Sprint 12: módulo administrativo demonstrativo para governança interna, preparando permissões futuras para publicação de atualizações, documentos e indicadores.
