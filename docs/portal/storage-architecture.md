# REROUTE Portal - Storage

## Provedor

O armazenamento de arquivos sera feito com Supabase Storage.

## Buckets

Buckets iniciais recomendados:

- `portal-private`
- `portal-public`
- `portal-reports`
- `portal-finance`

## Arquivos Privados

Documentos pessoais, contratos, comprovantes, recibos e documentos societarios devem ficar em buckets privados.

## Arquivos Publicos

Somente arquivos deliberadamente publicos podem ficar em bucket publico. Arquivos privados nunca devem depender de obscuridade de URL.

## Organizacao de Caminhos

Padrao sugerido:

- `organizations/{organization_id}/investors/{investor_id}/...`
- `organizations/{organization_id}/projects/{project_id}/...`
- `organizations/{organization_id}/finance/{transaction_id}/...`
- `organizations/{organization_id}/reports/{report_id}/...`

## URLs Assinadas

Arquivos privados devem ser acessados por URLs assinadas temporarias. O tempo de expiracao deve ser curto e proporcional ao uso.

## Versionamento

Substituicoes devem criar nova versao em vez de sobrescrever sem historico.

## Controle de Download

Downloads sensiveis devem ser registrados em logs de acesso.

## Exclusao

Usar exclusao logica quando houver obrigacao de historico, auditoria ou retencao.
