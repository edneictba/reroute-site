# Modulo do Investidor

## Rotas

- `/portal/investidor/`
- `/portal/investidor/dashboard/`
- `/portal/investidor/participacao/`
- `/portal/investidor/aportes/`
- `/portal/investidor/documentos/`
- `/portal/investidor/atualizacoes/`
- `/portal/investidor/notificacoes/`
- `/portal/investidor/perfil/`

`/portal/investidores/` permanece como modulo administrativo separado.

## Dados

O modulo usa `src/portal/providers/demo-investor-workspace.js`.

Os dados sao demonstrativos, centralizados e anonimizados. O cotista visualiza uma posicao individual, aportes, documentos, atualizacoes, notificacoes, aceites e perfil protegido. Dados sensiveis aparecem apenas como campos protegidos, sem valores ficticios realistas.

## Permissoes

As paginas exigem sessao, contexto, `portal.access` e `workspace.access`. A seguranca definitiva continua dependendo de RLS, ownership e capabilities no Supabase.

O workspace individual nao exibe Admin Center nem gestao administrativa. Dados de outros cotistas aparecem apenas agregados como `Cotista XX`.

## Integracao Futura

Substituir o provider por services/repositories reais quando existirem tabelas e policies para:

- investidor individual;
- aportes;
- documentos privados;
- notificacoes;
- aceites;
- relacao profile/investor.

## Pendencias

- RLS especifica para ownership do investidor.
- Storage privado para documentos reais.
- Aceites persistentes.
- Notificacoes reais.
- Testes E2E com usuario ficticio em staging.
