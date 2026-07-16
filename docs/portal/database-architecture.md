# REROUTE Portal - Arquitetura de Banco de Dados

## Diretriz

Este documento descreve entidades e relacionamentos. Nao contem SQL.

## Entidades Base

### organizations

Representa organizacoes. A primeira sera REROUTE. Permite crescimento para empresas do grupo, parceiros ou clientes.

### profiles

Perfil interno ligado ao usuario do Supabase Auth. Armazena nome, status e dados de exibicao.

### organization_members

Relaciona profiles a organizations.

### workspaces

Define areas como investor, admin, team, advisor, finance e legal.

### workspace_members

Define quais usuarios acessam quais workspaces.

### roles

Catalogo de papeis.

### permissions

Catalogo de permissoes granulares.

### role_permissions

Relaciona papeis a permissoes.

### user_roles

Permite atribuir papeis a usuarios por organizacao ou workspace.

## Investidores

### investors

Especializacao de profile para cotistas. Contem numero do cotista, dados cadastrais e status.

### investments

Representa investimento, valor, status, datas e participacao.

### quotas ou equity_holdings

Representa cotas, quantidade e percentual societario.

## Projetos

### projects

Representa iniciativas como MVP, Engine, Web App, iOS, Android, marketing ou juridico.

### project_modules

Agrupa partes de um projeto.

### project_milestones

Marcos com peso e progresso.

### project_updates

Historico de atualizacoes.

### project_metrics

Indicadores.

### project_risks

Riscos acompanhados.

### project_evidences

Evidencias vinculadas a arquivos ou atualizacoes.

## Arquivos

Usar `files` como entidade generica para documentos, imagens, videos, planilhas e comprovantes.

## Financeiro

Contas, transacoes, categorias, centros de custo, fornecedores, compromissos e recibos devem ser modelados para evitar saldos manuais inconsistentes.

## Auditoria

Toda alteracao administrativa relevante deve gerar log.
