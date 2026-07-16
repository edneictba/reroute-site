# ADR-003 - Row Level Security

## Status

Accepted for review.

## Contexto

O Portal lidara com dados privados e sensiveis. Esconder menus no frontend nao protege dados. RLS deve limitar acesso por identidade, organizacao, workspace, role, capability e propriedade do recurso.

## Decisao

Ativar RLS em todas as tabelas do Portal. Criar funcoes auxiliares com `search_path` explicito para evitar duplicacao e reduzir risco de recursao de policies. Usuarios comuns acessam apenas dados proprios ou escopo permitido.

## Alternativas Consideradas

- Proteger apenas por APIs serverless: rejeitado porque consultas diretas via Supabase tambem precisam ser protegidas.
- Criar policies abertas e filtrar no frontend: rejeitado por inseguranca.
- Usar `service_role` no navegador: rejeitado por risco critico.

## Consequencias

As regras de seguranca ficam no banco. APIs futuras ainda devem validar sessao e permissao, mas nao substituem RLS.

## Riscos

- RLS complexa exige testes locais com usuarios ficticios.
- Funcoes `SECURITY DEFINER` precisam ser revisadas para garantir que nao aceitem parametros inseguros.
