# REROUTE HNS Landing Page

Landing page oficial do REROUTE, apresentada como "The First Human Navigation System".

O projeto e um site estatico simples, sem framework e sem etapa de build obrigatoria. A estrutura favorece deploy rapido, manutencao clara, performance e crescimento gradual.

## Visao Geral

A pagina comunica a proposta do REROUTE como um sistema de navegacao humana com IA, memoria persistente e recalculo continuo de rota.

Fluxo principal da landing:

1. Hero com posicionamento e chamadas para lista de espera.
2. Problema que a solucao resolve.
3. Explicacao da solucao.
4. Metodo ROTA.
5. Bloco de tecnologia.
6. Posicionamento de categoria.
7. Formulario de lista de espera.
8. Rodape institucional.

## Estrutura De Pastas

```text
.
|-- index.html
|-- README.md
|-- robots.txt
|-- sitemap.xml
|-- site.webmanifest
|-- assets
|   |-- icons
|   |   |-- apple-touch-icon.png
|   |   |-- favicon.ico
|   |   |-- favicon-16x16.png
|   |   |-- favicon-32x32.png
|   |   |-- favicon-48x48.png
|   |   |-- favicon-192x192.png
|   |   `-- favicon-512x512.png
|   `-- images
|       |-- logo-reroute-hns.png
|       |-- logo-reroute-hns-320.png
|       |-- logo-reroute-hns-320.webp
|       |-- logo-reroute-hns-640.png
|       |-- logo-reroute-hns-640.webp
|       |-- og-reroute-hns.png
|       `-- og-reroute-hns.webp
`-- src
    |-- scripts
    |   `-- script.js
    `-- styles
        `-- style.css
```

## Arquitetura

### HTML

Arquivo principal:

```text
index.html
```

Responsabilidades:

- estrutura semantica da landing;
- metatags principais;
- navegacao;
- secoes de conteudo;
- formulario da lista de espera;
- imagens responsivas;
- carregamento de estilos e scripts.

### CSS

Arquivo principal:

```text
src/styles/style.css
```

Responsabilidades:

- tokens visuais em `:root`;
- layout global;
- header e navegacao;
- hero;
- cards e grids;
- secoes institucionais;
- formulario;
- responsividade;
- animacoes de entrada;
- suporte a movimento reduzido.

### JavaScript

Arquivo principal:

```text
src/scripts/script.js
```

Responsabilidades:

- estado visual do header ao rolar a pagina;
- abertura e fechamento do menu mobile;
- animacoes de revelacao com `IntersectionObserver`;
- fallback para navegadores sem `IntersectionObserver`;
- envio do formulario para Supabase via REST.

### Assets

Imagens publicas ficam em:

```text
assets/images
```

Arquivo original preservado como matriz:

```text
assets/images/logo-reroute-hns.png
```

Versoes otimizadas usadas pela landing:

```text
assets/images/logo-reroute-hns-320.png
assets/images/logo-reroute-hns-320.webp
assets/images/logo-reroute-hns-640.png
assets/images/logo-reroute-hns-640.webp
```

O HTML usa `picture`, `srcset` e `sizes` para permitir que o navegador escolha o menor arquivo adequado ao dispositivo.

## Performance

Otimizacoes aplicadas:

- imagens responsivas em WebP com PNG como fallback;
- preload da versao WebP principal do logo;
- `width` e `height` declarados nas imagens para reduzir CLS;
- `decoding="async"` nas imagens;
- `loading="lazy"` no logo do rodape;
- remocao do CDN `@supabase/supabase-js`, que nao era usado pelo codigo atual;
- script local carregado com `defer`;
- listener de scroll marcado como passivo;
- fallback para `IntersectionObserver`;
- suporte a `prefers-reduced-motion`.

Ao adicionar novas imagens, gere sempre versoes menores e formatos modernos antes de referencia-las no HTML.

## SEO

Arquivos e recursos de SEO:

- `robots.txt`;
- `sitemap.xml`;
- `site.webmanifest`;
- favicon em `assets/icons`;
- Open Graph e Twitter Cards no `index.html`;
- JSON-LD Schema no `index.html`.

URL canonica usada:

```text
https://reroutehns.com.br/
```

Se o dominio oficial for diferente, substitua essa URL em:

- `index.html`;
- `robots.txt`;
- `sitemap.xml`.

## Como Rodar Localmente

Como o projeto e estatico, voce pode abrir diretamente o `index.html` no navegador.

Para simular um servidor local, rode a partir da raiz do projeto:

```bash
python -m http.server 4173
```

Depois acesse:

```text
http://localhost:4173
```

## Deploy

Este projeto pode ser publicado em qualquer hospedagem de site estatico, como:

- Vercel;
- Netlify;
- Cloudflare Pages;
- GitHub Pages;
- servidor proprio com Nginx/Apache.

Diretorio de publicacao:

```text
dist
```

Comando de build:

```bash
npm run build
```

Configuracao da Vercel:

```text
vercel.json
```

Preview na Vercel:

```bash
vercel
```

Producao na Vercel:

```bash
vercel --prod
```

Se a CLI informar token invalido, execute:

```bash
vercel login
```

## Integracao Com Supabase

O formulario envia os dados para Supabase no arquivo:

```text
src/scripts/script.js
```

Campos enviados:

- `name`;
- `email`;
- `whatsapp`.

Tabela esperada:

```text
public.leads
```

O SQL de criacao/validacao da tabela e da politica RLS esta em:

```text
supabase/leads.sql
```

Politica esperada:

- permite `INSERT` publico para novos leads;
- nao cria politica de `SELECT` publico;
- impede duplicidade pelo `unique` em `email`.

Antes de publicar em producao, revise:

- URL do projeto Supabase;
- chave publica;
- nome da tabela;
- politicas de RLS;
- validacao anti-spam;
- politica de privacidade/LGPD.

## Convencoes Para Crescimento

Recomendacoes para evoluir o projeto sem perder organizacao:

- manter HTML estrutural em `index.html`;
- manter estilos globais em `src/styles`;
- criar novos arquivos CSS por contexto apenas quando o arquivo principal ficar dificil de manter;
- manter scripts em `src/scripts`;
- manter imagens em `assets/images`;
- criar `assets/icons` se houver favicon, icones SVG ou imagens pequenas de interface;
- documentar novas integracoes neste README;
- evitar inserir scripts externos sem necessidade clara;
- validar visualmente desktop e mobile antes de publicar.

## Checklist Antes De Publicar

- conferir se o visual permanece identico ao layout aprovado;
- testar menu mobile;
- testar envio do formulario;
- validar links de ancora;
- conferir metatags de SEO e compartilhamento;
- otimizar imagens;
- revisar acessibilidade de formulario e foco;
- testar em mobile real ou emulador.

## Observacao Sobre A Otimizacao

A otimizacao preservou o design existente. As mudancas foram focadas em reduzir bytes, evitar carregamento de codigo morto, melhorar estabilidade visual e preparar o projeto para crescimento.
