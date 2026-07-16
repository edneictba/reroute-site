# Sprint 8 - Investor Data Room

## Objetivo

Criar o primeiro módulo de Documentos do Investidor no Portal, com uma Data Room demonstrativa para organizar documentos estratégicos do REROUTE.

## Rota

- `/portal/documentos/`

A rota segue o padrão protegido do Portal:

- sessão autenticada;
- contexto obrigatório;
- capabilities `portal.access` e `workspace.access`.

## Provider

O módulo usa exclusivamente:

- `src/portal/providers/demo-documents.js`

O provider centraliza:

- título;
- categoria;
- descrição;
- data;
- versão;
- autor;
- tamanho;
- formato;
- status;
- nível de acesso;
- dados de página;
- dados do card de dashboard.

Nenhum documento real foi conectado nesta sprint.

## Estrutura da Data Room

A página contém:

- cabeçalho institucional da Data Room;
- filtros por categoria;
- filtros por status;
- filtros por ano;
- pesquisa textual;
- resumo quantitativo;
- tabela moderna responsiva;
- botões placeholder de visualização;
- botões placeholder de download.

## Documentos Demonstrativos

Foram adicionados 15 documentos demonstrativos:

- Pitch Deck 4.0;
- Investment Memorandum;
- Roadmap 2026-2030;
- Arquitetura do Portal;
- Arquitetura do HNS;
- Estrutura Societária;
- Plano Financeiro;
- Projeções;
- Cronograma MVP;
- Cronograma Portal;
- LGPD;
- Plano Tecnológico;
- Estratégia GTM;
- Plano Comercial;
- FAQ do Investidor.

## Dashboard

O dashboard exibe o card `Documentos Recentes`, com os cinco últimos documentos adicionados, usando o mesmo provider `demo-documents.js`.

## Como Conectar Futuramente ao Supabase Storage

1. Criar tabela `portal_documents` para metadados dos documentos.
2. Criar bucket privado no Supabase Storage.
3. Armazenar somente metadados no banco e arquivos no Storage.
4. Gerar URLs assinadas temporárias para visualização e download.
5. Aplicar RLS por workspace, role e capability.
6. Substituir `getDemoDocumentsData()` por um serviço protegido que retorne o mesmo contrato de dados.
7. Manter botões de visualização/download desabilitados até existir autorização real.

## Limitações

- Nenhum documento real conectado.
- Nenhum Supabase Storage conectado.
- Nenhuma URL assinada gerada.
- Nenhum módulo administrativo de upload habilitado.
- Dados financeiros citados são apenas nomes demonstrativos de documentos.
- RLS e autenticação não foram alterados.

## Próxima Sprint Recomendada

Sprint 9: modelar documentos reais com Supabase Storage privado, tabela de metadados, URLs assinadas, policies RLS e permissões específicas para investidores e administradores.
