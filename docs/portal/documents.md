# REROUTE Portal - Documentos

## Modelo Geral

Usar uma arquitetura generica de arquivos para evitar duplicacao.

Entidades previstas:

- files
- folders
- file_versions
- file_permissions
- file_links
- document_types
- file_access_logs

## Tipos de Documento

O sistema deve suportar:

- contratos;
- recibos;
- comprovantes;
- notas fiscais;
- relatorios;
- atas;
- imagens;
- videos;
- planilhas;
- apresentacoes;
- memorandos;
- documentos societarios;
- documentos pessoais.

## Relacionamentos

Arquivos podem estar relacionados a:

- usuario;
- investidor;
- projeto;
- transacao;
- relatorio;
- comunicado;
- organizacao;
- workspace.

## Permissoes

Permissoes devem considerar proprietario, organizacao, workspace, papel e visibilidade.

## Versionamento

Cada substituicao deve preservar versao anterior quando houver necessidade de historico.

## Auditoria

Acesso, download, upload, substituicao e exclusao logica devem poder ser auditados.
