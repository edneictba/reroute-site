# REROUTE Portal - Padroes de Codigo

## Estrutura de Pastas

Estrutura prevista:

```text
src/portal/
  core/
  auth/
  layouts/
  components/
  services/
  guards/
  workspaces/
    investor/
    admin/
    team/
    advisor/
    finance/
    legal/
```

## Separacao de Responsabilidades

- Landing Page permanece separada do Portal.
- Auth fica em `src/portal/auth`.
- Regras de rota ficam em `src/portal/guards`.
- Acesso a dados fica em `src/portal/services`.
- Componentes compartilhados ficam em `src/portal/components`.
- Layouts compartilhados ficam em `src/portal/layouts`.

## Nomenclatura

- Arquivos em kebab-case.
- Funcoes com verbos claros.
- Services nomeados pelo dominio.
- Guards nomeados pela regra que aplicam.

## Convencoes

- Nao duplicar logica de permissao em cada tela.
- Nao usar service role no frontend.
- Nao misturar codigo da Landing Page com codigo privado do Portal.
- Validar dados no frontend para UX e no backend/RLS para seguranca.
- Toda acao sensivel deve prever auditoria.

## Componentizacao

Componentes devem ser reutilizaveis, pequenos e sem regra de negocio sensivel embutida.

## Estados

Toda tela privada deve prever:

- loading;
- vazio;
- erro;
- sem permissao;
- sucesso.

## Acessibilidade

Manter foco visivel, labels, estados ARIA e navegacao por teclado.
