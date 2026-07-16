# REROUTE Portal - Sprint 4 Authentication

## Escopo

Implementacao da autenticacao real do Portal com Supabase Auth: login, logout, persistencia de sessao, recuperacao de senha, redefinicao de senha, protecao de rotas e estados de erro/carregamento.

Nao foram implementados: cadastro publico, convite administrativo, MFA, roles/capabilities na interface, profiles, investors, financeiro, documentos, relatorios, auditoria completa ou dashboard conectado.

## Estrutura Encontrada

Antes desta sprint ja existiam:

- `/portal/login/` com login real basico.
- `/portal/dashboard/` protegido por guard.
- `src/portal/lib/supabase-client.js` com cliente Supabase unico.
- `src/portal/services/auth-service.js` com login/logout/sessao.
- `src/portal/providers/auth-provider.js` com estado central de sessao.
- `src/portal/guards/route-guard.js` com protecao basica.

## Arquitetura Implementada

Camadas:

- `src/portal/lib/supabase-client.js`: cria uma unica instancia Supabase com anon key publica.
- `src/portal/services/auth-service.js`: centraliza login, logout, sessao, recovery e update de senha.
- `src/portal/providers/auth-provider.js`: estado global de sessao e listener de auth.
- `src/portal/guards/route-guard.js`: rotas privadas, redirect seguro e retorno interno validado.
- `src/portal/core/portal.js`: controlador visual das paginas do Portal.

## Fluxo de Login

1. Usuario acessa `/portal/login/`.
2. O formulario normaliza e-mail com `trim()` e lowercase.
3. Valida formato de e-mail e senha obrigatoria.
4. Chama `signInWithPassword`.
5. Em sucesso, redireciona para `returnTo` interno seguro ou `/portal/dashboard/`.
6. Em erro, mostra mensagem sanitizada sem revelar se e-mail existe.

## Fluxo de Sessao

1. `initAuth()` chama `getSession()`.
2. O provider restaura `session` e `user`.
3. `onAuthStateChange()` acompanha mudancas.
4. Conteudo privado permanece oculto ate a sessao ser resolvida.
5. Sem sessao, o guard redireciona para `/portal/login/?returnTo=...`.

## Fluxo de Logout

1. Botao `Sair` chama `signOut()`.
2. Estado local e limpo pelo provider.
3. Usuario e enviado para `/portal/login/`.
4. Voltar pelo navegador reexecuta o guard e bloqueia conteudo privado sem sessao.

## Fluxo de Recuperacao

Rota: `/portal/recuperar-senha/`

1. Usuario informa e-mail.
2. A interface nunca confirma se o e-mail existe.
3. Chama `resetPasswordForEmail(email, { redirectTo })`.
4. `redirectTo` aponta para `/portal/redefinir-senha/`.
5. Mensagem neutra exibida:
   "Se existir uma conta vinculada a este e-mail, enviaremos as instrucoes para redefinir sua senha."

## Fluxo de Redefinicao

Rota: `/portal/redefinir-senha/`

1. Supabase abre a pagina com token/session de recovery.
2. Usuario informa nova senha e confirmacao.
3. A senha precisa ter pelo menos 8 caracteres.
4. Confirmacao precisa ser identica.
5. Chama `updateUser({ password })`.
6. Em sucesso, redireciona para `/portal/login/`.
7. Links expirados ou invalidos exibem mensagem segura.

## Rotas Protegidas

- `/portal/dashboard/`
- `/portal/acesso-negado/`

Roles e capabilities nao foram integradas nesta sprint. A pagina de acesso negado e apenas estado visual preparado para Sprint 5.

## Variaveis Necessarias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Somente valores publicos devem ser usados no frontend. `SUPABASE_SERVICE_ROLE_KEY` nao deve ser exposta.

## Configuracao Manual no Supabase

No Supabase Auth, configurar:

- Site URL local: `http://127.0.0.1:4174`
- Site URL producao: `https://www.reroute.com.br`
- Redirect URL local: `http://127.0.0.1:4174/portal/redefinir-senha/`
- Redirect URL producao: `https://www.reroute.com.br/portal/redefinir-senha/`

Usar HTTPS em producao.

## Testes Executados

| Teste | Resultado | Observacao |
| --- | --- | --- |
| Lint | PASS | `npm run lint`. |
| Build | PASS | `npm run build`. |
| Sintaxe JS | PASS | `node --check` nos modulos do Portal. |
| Rotas estaticas no dist | PASS | `/portal/login/`, `/portal/dashboard/`, `/portal/acesso-negado/`, `/portal/recuperar-senha/`, `/portal/redefinir-senha/` retornaram HTTP 200 em servidor local. |
| Variaveis ausentes | REVIEW | Tratamento implementado; teste real depende de navegador/Supabase. |
| Campos vazios/e-mail invalido/senha vazia | REVIEW | Validacao implementada no JS. |
| Recovery e reset sem Supabase real | REVIEW | Fluxos implementados; chamadas reais dependem de ambiente configurado. |

## Testes Pendentes

- Login valido com usuario ficticio local/staging.
- Credenciais invalidas contra Supabase real.
- Conta nao confirmada.
- Excesso de tentativas.
- Falha de rede simulada em browser.
- Restauracao real de sessao.
- Logout real.
- Link expirado real.
- Link invalido real.
- Redefinicao valida real.

## Riscos e Limitacoes

- Sem Supabase local/staging configurado, os fluxos reais permanecem pendentes de validacao E2E.
- A pagina `/portal/redefinir-senha/` depende de Redirect URLs corretas no Supabase.
- Roles e capabilities ficam para Sprint 5; autenticação ainda nao e autorizacao.
- O dashboard continua demonstrativo.

## Como Testar Localmente

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_anon_key_publica"
npm run build
python -m http.server 4174 --directory dist
```

Abrir:

- `http://127.0.0.1:4174/portal/login/`
- `http://127.0.0.1:4174/portal/recuperar-senha/`
- `http://127.0.0.1:4174/portal/redefinir-senha/`
- `http://127.0.0.1:4174/portal/dashboard/`

## Proximo Passo

Sprint 5: integrar profiles, roles e capabilities ao guard do Portal, mantendo RLS como fonte de verdade e dashboard ainda sem dados sensiveis.
