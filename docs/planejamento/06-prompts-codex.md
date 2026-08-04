# REROUTE — Prompts prontos para o Codex

> Prompts para o Ednei copiar e colar no Codex (funcionam igual em Claude, Gemini ou qualquer agente — a documentação do projeto é o contexto, não a ferramenta). Ambiente: **Windows**. Regra de ouro em todos: **terminar com commit e push — o GitHub é o nosso Drive.**

## Como usar

1. Abra o Codex **na pasta do projeto** (ex.: `reroute-app`).
2. Copie o prompt, ajuste o que está `[entre colchetes]` e cole.
3. Ao final de qualquer sessão de trabalho, use o Prompt 8 (commit e push).
4. Se o Codex travar num erro por mais de 2 tentativas, pare, anote e traga para a call semanal — não force merge de coisa quebrada.

---

## 1. Entender o projeto (primeiro prompt de qualquer sessão)

```
Leia o arquivo AGENTS.md na raiz deste repositório e os documentos da pasta docs/.
Depois me explique, em português simples:
1. O que é este projeto e em que fase estamos
2. Quais são os princípios que nunca podemos violar
3. O que está planejado para a fase atual (docs/ROADMAP.md)
4. Que comandos eu uso para rodar o projeto e os testes aqui no meu Windows
Não mude nenhum arquivo ainda — só me explique.
```

## 2. Explorar a documentação da consultoria

```
Leia a pasta docs/ deste repositório. Quero entender [o planejamento do MVP /
a arquitetura / as boas práticas / o que falta configurar de infraestrutura].
Me dê um resumo em tópicos e depois me diga: qual é a menor próxima ação
que eu consigo fazer hoje, sozinho, em menos de 1 hora?
```

## 2.5 Trabalhar numa missão (O FLUXO PRINCIPAL do dia a dia)

```
Abra docs/missoes.json e me mostre as missões com status "todo" que são minhas
(dono Ednei). Vou trabalhar na missão [M-XX].
Siga o protocolo de missões do AGENTS.md À RISCA:
1. Mude o status dela para "doing", adicione uma nota datada com o plano,
   atualize o campo atualizado_em, commit e push AGORA (antes de trabalhar)
2. Execute a missão
3. Ao terminar: status "done", nota datada do que foi feito, commit e push
Se travar, mantenha "doing" com uma nota do bloqueio e me avise.
```

> É assim que o Renato acompanha o projeto pela página de documentação — a
> missão movida ANTES do trabalho é o que mantém o painel dizendo a verdade.

## 3. Trabalhar num item do roadmap (o fluxo padrão)

```
Abra docs/ROADMAP.md e localize o item [nome do item, ex.: "check-out da noite"].
Siga o fluxo do projeto descrito no AGENTS.md:
1. Crie uma branch com o prefixo certo (feat/, fix/, chore/)
2. Escreva PRIMEIRO o teste que prova que a funcionalidade funciona
3. Implemente até o teste passar
4. Rode lint, testes e build localmente e me mostre o resultado
5. Faça commit no padrão do projeto e suba a branch para o GitHub
6. Abra um Pull Request descrevendo o que muda e qual teste cobre
Se algo falhar duas vezes seguidas, pare e me explique o problema em
português simples antes de continuar.
```

## 4. Corrigir um bug

```
Encontrei um problema: [descreva o que aconteceu, onde e o que era esperado.
Cole a mensagem de erro ou print se tiver].
Siga a regra do projeto para bugs (AGENTS.md):
1. Escreva primeiro um teste que reproduz o erro (ele deve falhar)
2. Corrija o código até o teste passar
3. Rode toda a suíte de testes para garantir que nada mais quebrou
4. Commit + push + Pull Request citando o teste de regressão
```

## 5. Entender o que mudou (depois que o Renato trabalhou)

```
Rode git pull para atualizar o projeto. Depois me mostre o que mudou desde
[ontem / a última semana]: liste os commits novos e me explique em português
simples o que cada um fez e por quê. Se algum documento em docs/ mudou,
me resuma a mudança.
```

## 6. Verificar qualidade antes de subir

```
Antes de subir qualquer coisa, rode a validação completa do projeto:
lint, formatação, typecheck, testes e build — os comandos estão no AGENTS.md.
Me mostre o resultado de cada um. Se algo estiver vermelho, explique o que é
e proponha a correção antes de commitar.
```

## 7. Registrar uma decisão (ADR)

```
Decidimos hoje que [descreva a decisão, ex.: "as notificações serão via
OneSignal e não WhatsApp, porque o custo por mensagem inviabiliza a assinatura"].
Crie um ADR em docs/adr/ seguindo o formato dos existentes
(Status, Data, Contexto, Decisão, Consequências), com o próximo número
da sequência. Depois commit e push.
```

## 8. Encerrar a sessão (sempre!)

```
Terminamos por hoje. Verifique com git status se há alguma alteração pendente.
Se houver, me explique o que está pendente, faça commit no padrão do projeto
e suba para o GitHub. Me confirme que o repositório remoto está atualizado.
```

## 9. Aprender (aula particular com o Codex)

```
Me explique como funciona [o service worker do PWA / a RLS do Supabase /
o motor de recálculo / o CI no GitHub Actions] NESTE projeto.
Sou iniciante em programação: use analogias simples, aponte os arquivos
envolvidos e me mostre o caminho que o dado percorre. Não mude nada.
```

## 10. Landing page: melhorar conversão (repo reroute-site)

```
Leia o AGENTS.md e o README.md deste repositório (reroute-site).
Hoje temos ~70 visitas/dia e quase nenhuma conversão em lead.
Analise a página [index.html / conheca] e me proponha 3 hipóteses de melhoria
de conversão, ordenadas por esforço. Para cada uma: o que muda, por que deve
funcionar e como vamos medir. Só implemente depois que eu escolher uma.
```

---

## Conectar o Codex às ferramentas (os "pluguinhos" / MCPs)

Rode uma vez no terminal (cada comando abre um login no navegador na primeira vez que usar):

```
codex mcp add posthog --url https://mcp.posthog.com/mcp
codex mcp add sentry --url https://mcp.sentry.dev/mcp
```

Com isso o Codex passa a ver os dados reais do projeto, e prompts assim funcionam:

```
Consulte o PostHog: quantas pessoas concluíram o onboarding nos últimos 7 dias,
e em qual tela estamos perdendo mais gente? Me explique em português simples.
```

```
Consulte o Sentry: qual é o erro mais frequente em produção desde o último deploy?
Investigue a causa no código e proponha a correção seguindo a regra de bugs
do AGENTS.md (teste de regressão primeiro).
```

> Dica: para configurações que o plugin não alcança, peça ao Codex para usar o **CLI**
> da ferramenta (`posthog-cli` / `sentry-cli`) — os detalhes estão em
> `05-setup-infraestrutura.md`, seções 7.1 e 8.1. Regra de ouro: revise o que o
> Codex vai executar antes de aprovar, e nenhuma chave/token entra no repositório.

## Vocabulário rápido (cola)

| Termo | Tradução |
|---|---|
| Repositório (repo) | A pasta do projeto no GitHub — o nosso "Drive" |
| Commit | Salvar uma versão com uma mensagem do que mudou |
| Push | Enviar os commits para o GitHub |
| Branch | Cópia de trabalho para mexer sem afetar o oficial (`main`) |
| Pull Request (PR) | Pedido para juntar sua branch na `main`, com revisão |
| CI | Robô do GitHub que valida o código a cada subida — se estiver errado, nem sobe |
| Lint | Verificador de erros e padrão de escrita do código |
| Deploy | Publicar — no nosso caso, automático quando entra na `main` |
| MCP | Os "pluguinhos" que conectam o Codex a ferramentas (GitHub etc.) |
| PWA | Site que se instala como app (atalho na tela inicial + notificações) |
