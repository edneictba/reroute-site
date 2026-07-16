# REROUTE Portal - Roadmap de Desenvolvimento

## Fase 0 - Documentacao Oficial

Objetivo: registrar decisoes arquiteturais.  
Escopo: documentos tecnicos.  
Dependencias: auditoria aprovada.  
Criterio: documentacao criada.  
Riscos: ambiguidade futura.  

## Fase 1 - Fundacao de Banco, Organizacao, Usuarios, Papeis e RLS

Objetivo: criar base segura.  
Escopo: entidades centrais, RLS e policies.  
Dependencias: Fase 0.  
Criterio: policies testadas.  
Riscos: permissao ampla demais.

## Fase 2 - Autenticacao, Convite e Recuperacao de Senha

Objetivo: login privado.  
Escopo: Supabase Auth, convite, reset e logout.  
Dependencias: Fase 1.  
Criterio: usuario convidado acessa somente seu escopo.  
Riscos: fluxo de convite mal protegido.

## Fase 3 - Nucleo Visual do Portal

Objetivo: criar base visual e navegacao.  
Escopo: layouts, guards, componentes base.  
Dependencias: Fase 2.  
Criterio: rotas privadas protegidas.  
Riscos: duplicar estilos da landing sem padrao.

## Fase 4 - Investor Workspace

Objetivo: entregar area inicial dos cotistas.  
Escopo: dashboard, investimento, documentos, comunicados.  
Dependencias: Fase 3.  
Criterio: investidor ve apenas dados proprios.  
Riscos: vazamento entre cotistas.

## Fase 5 - Projetos, Marcos e Progresso

Objetivo: acompanhar projetos.  
Escopo: projetos, milestones, updates e progresso ponderado.  
Dependencias: Fase 4.  
Criterio: progresso calculado por pesos.  
Riscos: percentual manual inconsistente.

## Fase 6 - Financeiro

Objetivo: registrar e apresentar dados financeiros.  
Escopo: contas, transacoes, categorias, comprovantes.  
Dependencias: Fase 1 e Fase 3.  
Criterio: totais calculados.  
Riscos: saldos editados manualmente.

## Fase 7 - Arquivos e Documentos

Objetivo: Storage privado e versionamento.  
Escopo: files, versions, signed URLs, logs.  
Dependencias: Fase 1.  
Criterio: acesso privado validado.  
Riscos: bucket publico indevido.

## Fase 8 - Relatorios, Comunicados e Notificacoes

Objetivo: comunicacao oficial.  
Escopo: announcements, reports, reads e acknowledgements.  
Dependencias: Fase 3.  
Criterio: visibilidade correta por workspace.  
Riscos: comunicado privado exposto.

## Fase 9 - Admin Workspace

Objetivo: operacao administrativa.  
Escopo: usuarios, investidores, documentos, auditoria.  
Dependencias: Fases anteriores.  
Criterio: investor nao acessa admin por URL.  
Riscos: permissao administrativa excessiva.

## Fase 10 - Auditoria e Seguranca

Objetivo: validar seguranca e conformidade.  
Escopo: logs, testes RLS, revisao de segredos.  
Dependencias: todas as fases funcionais.  
Criterio: checklist aprovado.  
Riscos: logs incompletos.

## Fase 11 - Testes, Homologacao e Publicacao

Objetivo: publicar com seguranca.  
Escopo: testes E2E, responsividade, deploy controlado.  
Dependencias: Fase 10.  
Criterio: homologacao aprovada.  
Riscos: publicar sem validar policies.

## Fase 12 - Workspaces Futuros

Objetivo: expandir para Team, Advisor, Finance e Legal.  
Escopo: novos workspaces e permissoes.  
Dependencias: arquitetura validada.  
Criterio: novos modulos sem reescrita.  
Riscos: crescimento sem governanca.
