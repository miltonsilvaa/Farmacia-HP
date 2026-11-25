# Testes — Plataforma HomeoFormula (Grupo Farmácia HP)

Este documento registra os testes automatizados criados para o frontend e um
roteiro de testes manuais para validar o fluxo de usuário de ponta a ponta no
navegador.

## Como rodar os testes automatizados

```bash
cd frontend
npm run test            # roda uma vez (modo CI)
npm run test:watch      # fica rodando a cada alteração
npm run test:coverage   # roda e gera relatório de cobertura em frontend/coverage/
```

Stack de teste: **Vitest** + **@testing-library/react** + **jsdom**, configurada
em `frontend/vite.config.ts` (chave `test`). Setup global em
`frontend/src/test/setup.ts`.

> O backend (NestJS) já tinha sua própria suíte, em Jest, com a convenção
> `*.spec.ts` — não é o alvo deste documento. Para rodar: `cd backend && npm test`.

## Testes unitários criados

Convenção adotada: um arquivo `<nome>.test.ts(x)` ao lado de cada função ou
componente testado, dentro de `frontend/src/`.

### `src/components/ui/button.test.tsx`

Componente `Button` (base de praticamente todo botão da interface, incluindo o
botão principal de cada tela do fluxo do cliente).

| Teste | O que valida |
|---|---|
| renderiza o texto recebido e responde a clique | O botão aparece no DOM com o texto certo e pode ser localizado por `role="button"` + nome acessível — ou seja, funciona com leitor de tela, requisito de acessibilidade do produto. |
| aplica a variante "destructive" quando indicada | A prop `variant` chega até o atributo `data-variant`, usado para estilizar ações destrutivas (ex.: cancelar pedido) de forma diferente das ações normais. |

### `src/lib/format.test.ts`

Funções de formatação usadas em toda tela que mostra preço, data de pedido ou
data de nascimento de paciente/pet.

| Teste | O que valida |
|---|---|
| `formatarMoeda` formata um número em real (BRL) | `19.9` → `"R$ 19,90"`. |
| `formatarMoeda` aceita o valor como string | `"19.90"` → `"R$ 19,90"` (o backend às vezes manda número como string). |
| `formatarMoeda` formata valor negativo | `-5` → `"-R$ 5,00"`. |
| `formatarMoeda` trata zero como valor válido | `0` → `"R$ 0,00"`, não o placeholder de "sem valor" — bug comum ao confundir `0` com falsy. |
| `formatarMoeda` mostra "—" para `null`/`undefined`/string vazia | Pedido ainda sem orçamento não deve exibir `"R$ NaN"` ou `"R$ 0,00"`. |
| `formatarData` formata no padrão `dd de mês de aaaa` | `2026-03-05` → `"05 de mar. de 2026"`. |
| `formatarDataUTC` mostra o dia gravado, sem voltar um dia | **Regressão específica:** data de nascimento sem horário (`"1990-05-15"`) tem que continuar mostrando `15/05/1990` mesmo em fusos horários atrás de UTC (como o do Brasil). Sem o `timeZone: 'UTC'` na implementação, esse teste quebraria. |
| `formatarDataUTC` funciona com data e hora completas | Mesmo resultado passando um ISO completo (`"...T00:00:00.000Z"`). |
| `numeroPedido` usa os 8 primeiros caracteres do id, em maiúsculas | É o número que aparece pro cliente, no e-mail e na mensagem de WhatsApp — os três lugares precisam mostrar o mesmo valor. |
| `numeroPedido` é determinístico | O mesmo id sempre gera o mesmo número exibido. |

### `src/lib/status.test.ts`

Vocabulário único de status do pedido (rótulo, cor, ícone) e a regra de quais
pedidos podem ser renovados.

| Teste | O que valida |
|---|---|
| `infoStatus` retorna rótulo/cor/ícone certos para um status conhecido | Ex.: `PRODUCAO` → rótulo `"Em manipulação"`, cor `azul`. |
| `infoStatus` cai num padrão seguro para status desconhecido | Um status que a API venha a mandar e a UI não reconheça não quebra a tela — vira cinza, com o próprio nome como rótulo. |
| `STATUS_RENOVAVEIS` só permite renovar pedido já aprovado | Lista exata esperada: `['PRODUCAO', 'FINALIZADO', 'ENTREGUE']`. |
| `STATUS_RENOVAVEIS` nunca inclui pedido pendente, recusado ou cancelado | Essa regra existe **também no backend** (`orcamento.service`); o teste pega o caso de alguém mudar um lado e esquecer o outro, o que faria o botão "renovar" aparecer onde o backend recusaria a ação. |
| Toda cor usada em `STATUS` tem classe correspondente em `CLASSES_COR` e `PONTO_COR` | Evita status com cor "fantasma" sem estilo Tailwind — apareceria sem cor na tela. |

### `src/lib/utils.test.ts`

Função `cn`, usada em todo componente para combinar classes do Tailwind.

| Teste | O que valida |
|---|---|
| junta várias classes em uma string só | Uso básico. |
| ignora valores falsy | Classes condicionais (`condicao && 'classe'`) que não se aplicam não aparecem como `"undefined"` ou `"null"` na string final. |
| resolve conflito entre classes do Tailwind mantendo a última | `cn('px-2 py-1', 'px-4')` → `"py-1 px-4"`, não as duas juntas. É o que permite um componente shadcn/ui aceitar `className` de fora e sobrescrever o padding padrão, por exemplo. |

### `src/lib/api.test.ts`

Função `getUsuario`, que lê o usuário logado do `localStorage`.

| Teste | O que valida |
|---|---|
| retorna `null` quando não há usuário salvo | Estado inicial, antes do login. |
| retorna o usuário salvo no `localStorage` | Caminho feliz. |
| retorna `null` em vez de lançar erro quando o valor salvo está corrompido | Protege a tela de login contra um `JSON.parse` que quebraria a aplicação inteira se o `localStorage` tiver lixo (ex.: versão antiga do app, extensão de navegador alterando o storage). |

**Resumo:** 5 arquivos de teste, 25 casos, todos passando (`npm run test`).

---

## Roteiro de testes manuais (ponta a ponta)

Pré-requisito: projeto rodando com `docker-compose up -d` (veja instruções
anteriores). App em `http://localhost:5173`, e-mails de teste em
`http://localhost:8025` (Mailpit), banco em `http://localhost:8081` (Adminer).

### 1. Cadastro (`/cadastro`)

1. Acesse `http://localhost:5173/cadastro`.
2. Preencha e-mail e senha com **menos de 6 caracteres** → deve aparecer o erro
   "A senha precisa ter pelo menos 6 letras ou números." e **não** enviar o formulário.
3. Preencha senha válida mas com a confirmação **diferente** → erro "As duas
   senhas estão diferentes. Digite de novo."
4. Preencha tudo corretamente e envie → deve redirecionar para a área logada
   do cliente (`/`).
5. Tente cadastrar o **mesmo e-mail de novo** → deve mostrar erro de e-mail já
   cadastrado, sem travar a tela.

### 2. Login (`/login`)

1. Tente logar com e-mail inexistente ou senha errada → mensagem de erro
   genérica (não deve revelar se o e-mail existe ou não).
2. Logue com as credenciais criadas no passo 1 → redireciona para a Home do
   cliente, token salvo (confira no DevTools → Application → Local Storage →
   chave `token_farmacia`).

### 3. Novo orçamento (`/novo-orcamento`)

1. Tente enviar **sem anexar nenhuma receita** → o formulário deve bloquear ou
   avisar.
2. Anexe um arquivo **maior que 10 MB** → toast "Esse arquivo é maior que 10
   MB. Tente uma foto com menos qualidade." e o arquivo não deve entrar na lista.
3. Anexe **mais de 5 arquivos** → toast "Você pode enviar até 5 arquivos
   extras." e o 6º não deve ser aceito.
4. Anexe uma foto ou PDF válido (≤10 MB) → aparece na lista de anexos com
   opção de remover.
5. Verifique se aparecem **sugestões de produtos complementares** (conforme
   descrito no PRODUCT.md).
6. Envie o pedido → deve navegar para "Meus pedidos" com o novo pedido no
   status **"Aguardando orçamento"**.
7. Confira em `http://localhost:8025` se chegou um e-mail de confirmação do
   pedido.

### 4. Acompanhar e responder o pedido (`/meus-pedidos`)

1. Como **admin** (login com usuário de equipe, se houver seed, ou crie um
   usuário admin direto no banco via Adminer), acesse `/admin/pedidos`,
   encontre o pedido criado no passo 3 e envie um orçamento.
2. Volte para o usuário cliente em `/meus-pedidos` → o status deve ter mudado
   para **"Orçamento pronto: responda"**.
3. Confira o e-mail correspondente no Mailpit.
4. Clique para **aprovar** o orçamento → status muda para **"Em manipulação"**.
5. Repita o fluxo com outro pedido e **recuse** o orçamento → status final deve
   ser **"Não aprovado pela farmácia"**, sem possibilidade de renovar.
6. Confirme que o botão **"Renovar"** só aparece em pedidos com status "Em
   manipulação", "Pronto para retirada" ou "Entregue" — nunca em pendente,
   aguardando pagamento, recusado ou cancelado (é a regra coberta pelo teste
   `STATUS_RENOVAVEIS`).

### 5. Renovação "1 clique"

1. Em um pedido já aprovado (status elegível, ver passo 4.6), clique em
   **"Renovar"**.
2. Confirme que o novo pedido vem **pré-preenchido** com os mesmos produtos e
   o mesmo paciente do pedido original, sem precisar reanexar a receita.
3. Confirme o novo pedido e verifique que ele entra na lista como um pedido
   novo e independente, em "Aguardando orçamento".

### 6. Grupo Família (`/grupo-familia`)

1. Cadastre um **parente** (ex.: "mãe") e um **pet**.
2. Faça um novo orçamento (passo 3) escolhendo esse parente/pet como paciente
   → confira que o histórico de pedidos desse dependente aparece separado do
   do titular.
3. **Convide** outro e-mail para o Grupo Família.
4. Faça login com o e-mail convidado (ele precisa aceitar o convite) e
   confirme que ele vê os mesmos dependentes, mas não vê dados de contas que
   não fazem parte do grupo.
5. Remova um dependente ou um membro convidado → confirme que o acesso dele
   aos pedidos antigos continua consistente (não deve conseguir ver/alterar
   pedidos de fora do grupo em nenhum momento).

### 7. Acessibilidade (público idoso, meta WCAG 2.2 AA)

1. Aumente o zoom do navegador para 150–200% → nenhum texto deve cortar ou
   sobrepor.
2. Navegue pelo cadastro e pelo novo orçamento **só com o teclado** (Tab /
   Enter) → todo campo e botão precisa ser alcançável e ter foco visível.
3. Confirme visualmente que os alvos de toque (botões) parecem ter pelo menos
   48px de altura, especialmente em tela de celular.

### 8. WhatsApp de apoio

1. Confirme que o botão de WhatsApp aparece com o **número do pedido** já na
   mensagem pré-formatada (se `VITE_WHATSAPP_FARMACIA` estiver configurado no
   `.env`; se estiver vazio, o botão deve ficar escondido — confirme também
   esse caso).

---

## O que ainda não está automatizado

- Formulários (`Cadastro.tsx`, `Login.tsx`, `NovoOrcamento.tsx`): a validação
  hoje vive dentro do componente React, não em função isolada — por isso não
  tem teste unitário próprio ainda (está coberta pelo roteiro manual acima,
  seções 1 e 3).
- Nenhum teste de integração/E2E real (ex.: Playwright/Cypress) existe ainda;
  o roteiro manual desta seção cobre esse papel por enquanto.
- Controllers HTTP do backend (`orcamento.controller`, `familiar.controller`,
  `auth.controller`, etc.) não têm `*.spec.ts` — só os services têm.
