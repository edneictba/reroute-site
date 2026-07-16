# REROUTE Portal - Auditoria

## Objetivo

Garantir rastreabilidade de acessos, alteracoes administrativas, documentos e eventos sensiveis.

## Entidades

### audit_logs

Registro geral de acoes sensiveis.

### login_events

Historico de login, logout, falhas e recuperacao.

### file_access_logs

Acessos, downloads e visualizacoes de arquivos.

### administrative_actions

Acoes administrativas importantes, como convite, suspensao, publicacao ou alteracao financeira.

### change_history

Historico de alteracoes com antes e depois quando aplicavel.

## Eventos a Registrar

- convite de usuario;
- suspensao;
- alteracao de permissao;
- upload de documento;
- download de documento sensivel;
- lancamento financeiro;
- estorno;
- publicacao de relatorio;
- publicacao de comunicado;
- alteracao de projeto;
- acesso administrativo.

## Boas Praticas

- Nao registrar senhas, tokens ou URLs assinadas.
- Evitar CPF completo em logs quando nao necessario.
- Proteger logs contra alteracao por usuarios comuns.
- Definir politica de retencao.
- Permitir consulta por administradores autorizados.
