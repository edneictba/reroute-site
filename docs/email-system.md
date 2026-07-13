# Sistema de E-mails Transacionais do REROUTE

## Arquitetura

O projeto continua sendo uma landing estática em HTML, CSS e JavaScript. O envio de e-mail fica em uma Vercel Function server-side:

- `api/send-welcome-email.js`
- `src/emails/templates/welcome-email.js`
- `src/emails/components/*`
- `src/emails/utils/*`

O navegador nunca recebe a `RESEND_API_KEY`.

## Fluxo do cadastro

1. O visitante envia o formulário da lista de espera.
2. `src/scripts/script.js` valida nome e e-mail.
3. O cadastro é salvo no Supabase.
4. Somente depois do sucesso no Supabase, o frontend chama `/api/send-welcome-email`.
5. Se o e-mail for enviado, a interface informa que uma confirmação foi enviada.
6. Se o e-mail falhar, o cadastro continua confirmado e a falha é registrada de forma discreta.

## Fluxo do envio

1. `/api/send-welcome-email` aceita apenas `POST` com `application/json`.
2. O endpoint valida nome, e-mail, origem, tamanho do corpo e caracteres de controle.
3. O primeiro nome é extraído no servidor e escapado no template.
4. O HTML fixo do e-mail é renderizado no servidor.
5. A chamada ao Resend usa chave de idempotência determinística baseada no hash do e-mail normalizado.

## Arquivos envolvidos

- `api/send-welcome-email.js`
- `src/scripts/script.js`
- `src/emails/templates/welcome-email.js`
- `src/emails/components/email-layout.js`
- `src/emails/components/email-header.js`
- `src/emails/components/email-button.js`
- `src/emails/components/email-footer.js`
- `src/emails/utils/escape-html.js`
- `src/emails/utils/email-validation.js`
- `.env.example`

## Variáveis de ambiente

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=REROUTE <boasvindas@email.reroute.com.br>
REROUTE_SITE_URL=https://www.reroute.com.br
```

Nunca versionar a API Key real.

## Remetente

Remetente:

`REROUTE <boasvindas@email.reroute.com.br>`

Reply-To:

`contato@reroute.com.br`

Domínio verificado no Resend:

`email.reroute.com.br`

## Como visualizar o template localmente

Importe `renderWelcomeEmail` em um script local e grave o HTML em um arquivo temporário. Não envie e-mail real sem autorização explícita.

## Como fazer teste controlado

Use `node scripts/email-system-smoke-test.js`. O teste simula o Resend com `fetch` mockado e não envia e-mails reais.

## Como publicar

1. Configure as variáveis de ambiente na Vercel.
2. Execute o build.
3. Publique o projeto.
4. Confirme que `/api/send-welcome-email` está disponível em produção.

## Como diagnosticar falhas

- Verificar logs da Vercel Function.
- Confirmar `RESEND_API_KEY`.
- Confirmar `RESEND_FROM_EMAIL`.
- Confirmar domínio verificado no Resend.
- Confirmar que o cadastro foi salvo no Supabase antes da chamada ao endpoint.

## Como criar um futuro template

Reutilize:

- `email-layout.js`
- `email-header.js`
- `email-button.js`
- `email-footer.js`
- `escape-html.js`
- `email-validation.js`

Crie apenas templates realmente necessários.

## Unsubscribe

Este e-mail é transacional e confirma o cadastro na lista de espera. Um mecanismo real de unsubscribe será obrigatório antes do envio de campanhas recorrentes de marketing.
