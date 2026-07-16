# REROUTE Portal - Seguranca

## LGPD

O Portal lidara com dados pessoais e documentos sensiveis. Deve aplicar minimizacao, finalidade, controle de acesso, retencao e auditoria.

## RLS

Row Level Security deve ser habilitado em todas as tabelas privadas. Acesso deve considerar usuario autenticado, organizacao, workspace, papel e propriedade do recurso.

## Service Role

`SUPABASE_SERVICE_ROLE_KEY` nunca deve ir para o frontend. Ela so pode ser usada em Vercel Functions e apenas quando necessario.

## Segredos

Segredos devem ficar em variaveis de ambiente da Vercel ou do provedor apropriado.

## Sessoes

Sessoes devem ser monitoradas no frontend e invalidadas em logout. Usuarios suspensos devem ser bloqueados por regras server-side.

## Uploads

Uploads devem validar:

- tipo;
- tamanho;
- destino;
- permissao;
- vinculo com entidade.

## APIs

APIs serverless devem:

- validar sessao;
- validar permissao;
- nunca confiar somente em IDs enviados pelo navegador;
- registrar auditoria em acoes sensiveis.

## Riscos Principais

- acesso entre usuarios;
- documentos publicos por engano;
- vazamento de chaves;
- manipulacao de IDs;
- edicao financeira destrutiva;
- escalada de privilegios;
- logs com dados pessoais.

Cada risco deve ser mitigado por RLS, policies, validacao server-side e auditoria.
