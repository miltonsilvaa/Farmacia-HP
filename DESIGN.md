---
name: Grupo Farmácia HP
description: Autoatendimento de farmácia de manipulação, legível para quem enxerga pouco.
colors:
  pharmacy-green: "#0b7250"
  pharmacy-green-deep: "#095c41"
  green-ink: "#07513a"
  mint-wash: "#e3f2eb"
  cool-mist: "#f3f6f5"
  clinical-white: "#ffffff"
  deep-ink: "#0f1f19"
  sage-slate: "#4b5c55"
  quiet-sage: "#e9efec"
  hairline: "#d3ddd9"
  field-stroke: "#7c8f87"
  alert-red: "#b42318"
  alert-red-wash: "#fdecea"
  status-laranja: "#9a4a05"
  status-laranja-soft: "#fff1e0"
  status-amarelo: "#6b4a00"
  status-amarelo-soft: "#ffe9a8"
  status-azul: "#1d5fb0"
  status-azul-soft: "#e6effa"
  status-verde: "#07603f"
  status-verde-soft: "#dcf1e6"
  ponto-laranja: "#d9620b"
  ponto-amarelo: "#b98300"
  ponto-cinza: "#6b7c75"
  ponto-vermelho: "#c42b1c"
typography:
  headline:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  title-small:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.55
  body:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.43
  price-display:
    fontFamily: "Atkinson Hyperlegible Next Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    fontFeature: "tnum"
rounded:
  sm: "calc(0.75rem - 4px)"
  md: "calc(0.75rem - 2px)"
  lg: "0.75rem"
  xl: "calc(0.75rem + 4px)"
  2xl: "1rem"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
components:
  button-primary:
    backgroundColor: "{colors.pharmacy-green}"
    textColor: "{colors.clinical-white}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1.25rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.pharmacy-green-deep}"
  button-primary-lg:
    backgroundColor: "{colors.pharmacy-green}"
    textColor: "{colors.clinical-white}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1.75rem"
    height: "3.5rem"
  button-outline:
    backgroundColor: "{colors.clinical-white}"
    textColor: "{colors.green-ink}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1.25rem"
    height: "3rem"
  button-outline-hover:
    backgroundColor: "{colors.mint-wash}"
  button-ghost:
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.lg}"
    height: "3rem"
  button-ghost-hover:
    backgroundColor: "{colors.quiet-sage}"
  button-destructive:
    backgroundColor: "{colors.alert-red}"
    textColor: "{colors.clinical-white}"
    rounded: "{rounded.lg}"
    height: "3rem"
  input:
    backgroundColor: "{colors.clinical-white}"
    textColor: "{colors.deep-ink}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
    height: "3.25rem"
  status-badge:
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0.25rem 0.75rem"
  card:
    backgroundColor: "{colors.clinical-white}"
    rounded: "{rounded.2xl}"
    padding: "1.25rem"
  card-awaiting-reply:
    backgroundColor: "{colors.status-amarelo-soft}"
    textColor: "{colors.status-amarelo}"
    rounded: "{rounded.2xl}"
    padding: "1.25rem"
  nav-item-active:
    backgroundColor: "{colors.mint-wash}"
    textColor: "{colors.green-ink}"
    rounded: "{rounded.lg}"
    height: "3rem"
---

# Design System: Grupo Farmácia HP

## Overview

**Creative North Star: "O Balcão Bem Iluminado"**

O padrão da categoria de apps de saúde e farmácia, no nível de acabamento de Drogasil e Droga Raia, executado sem concessão para quem enxerga pouco e tem pouca prática com celular. Não há invenção de linguagem: fundo neutro frio, superfícies brancas, um verde-farmácia profundo que só aparece onde há ação, e um vocabulário fixo de status que o cliente aprende uma vez e reconhece em todas as telas. A personalidade vem do capricho e da legibilidade, não de ornamento.

A densidade é baixa e generosa. A raiz da página é 18 px (`html { font-size: 112.5% }`), então todo `rem` da interface (texto, espaçamento, raio, alvos de toque) cresce junto. Cada tela tem um objetivo; o botão verde principal ocupa a largura no celular e fica ao alcance do polegar. O painel da farmácia usa o mesmo sistema com uma barra lateral e tabelas, mais denso só onde a equipe precisa comparar linhas.

Rejeições confirmadas pela direção: o painel de SaaS genérico com cards iguais, emoji como ícone e texto cinza-claro miúdo.

**Key Characteristics:**
- Uma única face tipográfica, Atkinson Hyperlegible Next, com hierarquia feita por tamanho e negrito (700).
- Verde-farmácia como única cor de ação; azul só para informação.
- Status sempre em cor + ícone Lucide + texto, nunca só cor.
- Cartões brancos sem borda, levantados por sombra suave; bordas de 1 px só em estrutura (topo, divisores, tabelas).
- Alvos de toque de no mínimo 48 px; ação principal com 56 px.
- Foco de teclado grosso (contorno de 3 px verde, deslocado 2 px).

## Colors

Paleta clínica e fria, com um verde de alta confiança fazendo todo o trabalho de ação e uma família de pares suave/forte para status.

### Primary
- **Verde-Farmácia** (pharmacy-green): botões primários, links, ícones de atalho, linha do tempo concluída, anel de foco, `accent-color` e cursor de texto. É a cor que diz "toque aqui".
- **Verde-Farmácia Fundo** (pharmacy-green-deep): somente o hover do verde-farmácia.
- **Tinta Verde** (green-ink): texto sobre fundos verdes suaves: nome da marca no topo, item de navegação ativo, rótulo do botão contornado, etapa atual da linha do tempo.
- **Lavado de Menta** (mint-wash): fundo do item de navegação ativo, hover do botão contornado, caixas de destaque positivo.

### Neutral
- **Névoa Fria** (cool-mist): o chão de todas as telas.
- **Branco Clínico** (clinical-white): cartões, barra do topo, navegação inferior, campos, diálogos.
- **Tinta Profunda** (deep-ink): todo texto principal. Nunca preto puro.
- **Ardósia Sálvia** (sage-slate): texto secundário e ícones inativos; contraste AA sobre branco e sobre a névoa.
- **Sálvia Quieta** (quiet-sage): botão secundário, hover de fantasma, campos desabilitados, fundo de código de retirada.
- **Fio** (hairline): bordas de 1 px de estrutura e divisores de lista.
- **Traço de Campo** (field-stroke): contorno de 2 px dos campos de formulário, escuro o bastante para o campo ser achado (3:1).

### Status (vocabulário fixo)
Cada status é um par: fundo suave + texto forte, contraste mínimo 4.5:1. A equivalência está em `lib/status.ts` e é a mesma em todas as telas.
- **Laranja** (status-laranja / status-laranja-soft): aguardando orçamento. Ícone relógio.
- **Amarelo** (status-amarelo / status-amarelo-soft): orçamento pronto, o cliente precisa responder. Ícone sino.
- **Azul** (status-azul / status-azul-soft): em manipulação; também etiquetas informativas como "Renovação". Ícone frasco.
- **Verde** (status-verde / status-verde-soft): pronto para retirada. Ícone pacote.
- **Cinza** (sage-slate / quiet-sage): entregue ou cancelado.
- **Vermelho** (alert-red / alert-red-wash): recusado pela farmácia, erros e ações destrutivas.

Para preenchimentos sólidos (pontos de legenda, barras de relatório) existe uma série "ponto" de matizes mais claros, com no mínimo 3:1 sobre branco: ponto-laranja, ponto-amarelo, ponto-cinza, ponto-vermelho; azul e verde reutilizam status-azul e pharmacy-green.

### Named Rules
**A Regra da Voz Única.** Verde-farmácia é a única cor de ação. Se algo verde não é tocável, deve ser status "pronto" ou progresso concluído, nunca decoração.

**A Regra do Status Triplo.** Status nunca é só cor: sempre fundo suave + ícone Lucide + rótulo escrito, com a mesma cor, ícone e nome em toda tela.

**A Regra do Azul Informativo.** Azul não é ação. Ele marca "em manipulação" e etiquetas de informação; link e botão são sempre verdes.

## Typography

**Display Font:** Atkinson Hyperlegible Next Variable (com ui-sans-serif, system-ui)
**Body Font:** a mesma
**Label/Mono Font:** a mesma, com números tabulares (`tabular-nums`) em preços, códigos e contagens

**Character:** Uma face desenhada para baixa visão, com letras de formas inconfundíveis (I, l, 1, 0, O). Uma família só, dois pesos: regular para ler, negrito para mandar.

### Hierarchy
- **Headline** (700, 1.875rem ≈ 34 px, 1.2): título de cada tela. Na tela inicial do celular cai para 1.5rem.
- **Title** (700, 1.25rem ≈ 22,5 px, 1.4): títulos de seção e de cartão.
- **Title Small** (700, 1.125rem ≈ 20 px): nome de item em listas de atalho, subtítulos dentro de cartões.
- **Body** (400, 1rem = 18 px, 1.55): todo texto corrido e rótulos de botão (estes em 700).
- **Label** (700, 0.875rem ≈ 15,75 px): selos de status, legendas da linha do tempo, cabeçalhos de tabela (estes em 400, ardósia). É o menor tamanho do sistema.
- **Price Display** (700, 2.25rem, tabular): o valor do orçamento que o cliente precisa aprovar.

### Named Rules
**A Regra dos Dois Pesos.** Só 400 e 700. Hierarquia vem de tamanho e negrito, nunca de pesos intermediários ou de cinza claro.

**A Regra do Piso de 15 px.** Nada abaixo de 0.875rem (≈ 15,75 px). `text-xs` não existe nas telas.

**A Regra do Número Parado.** Preço, número de pedido e contagem usam números tabulares, para não "dançarem" entre linhas.

Títulos (h1 a h3) usam `text-wrap: balance` e `letter-spacing: -0.01em`.

## Layout

Coluna única no celular, centrada e limitada a `max-w-5xl` (64rem, ≈ 1152 px a 18 px de raiz) no app do cliente, com margem lateral de 1rem. O painel da farmácia usa uma grade com barra lateral fixa de 16rem a partir de `lg` e conteúdo até `max-w-7xl` (80rem), margem de 2rem. Formulários e telas de acesso estreitam para `max-w-md`/`max-w-lg`.

Ritmo: a escala do Tailwind com base 0.25rem (4,5 px na raiz de 18 px). Seções de uma tela se separam por 2rem (`gap-8`); dentro de cartões, 1.25rem de preenchimento (1.5rem a partir de `sm`); itens em linha, 0.5 a 0.75rem. No celular o `main` reserva 8rem embaixo para a navegação fixa.

Responsivo: abaixo de `md` (48rem; em media query o rem vale 16 px, então 768 px) a navegação do cliente vai para uma barra inferior fixa de 4 colunas; acima, fica na barra do topo. Ações de largura total no celular (`w-full`) viram largura automática a partir de `sm`. A lista de pedidos do painel é uma lista com divisores abaixo de `lg` (1024 px) e vira tabela a partir dele.

## Elevation & Depth

Híbrido: superfícies brancas sobre a névoa fria, separadas por uma sombra suave de duas camadas, em vez de bordas. A sombra é ambiente, com matiz da tinta profunda (nunca preto puro), e nunca dura ou deslocada sem desfoque.

### Shadow Vocabulary
- **Cartão** (`box-shadow: 0 1px 2px rgb(15 31 25 / 0.06), 0 6px 16px -4px rgb(15 31 25 / 0.1)`): todo cartão e lista agrupada, e o botão primário.
- **Flutuante** (`box-shadow: 0 8px 28px -6px rgb(15 31 25 / 0.22)`): diálogos, avisos (toasts), cartão de acesso e o link "Pular para o conteúdo".
- **Barra inferior** (`box-shadow: 0 -4px 16px -6px rgb(15 31 25 / 0.12)`): só a navegação fixa do celular.

### Named Rules
**A Regra Sombra-no-Lugar-de-Borda.** Cartões não têm borda; a sombra de cartão faz a separação. Bordas de 1 px ficam para estrutura: topo, barra lateral, divisores de lista, linhas de tabela.

## Shapes

Cantos arredondados e amigáveis, escalados com a raiz: controles (botões, campos, itens de navegação) usam o raio base de 0.75rem (≈ 13,5 px); cartões, listas agrupadas e diálogos usam 1rem (18 px); avisos usam 0.75rem + 4px. Selos de status, pontos, contadores e o realce do ícone ativo na barra inferior são pílulas (raio total). Controles interativos têm contorno de 2 px (campos, botão contornado); estrutura tem fio de 1 px.

## Components

### Buttons
Sólidos, grandes e sem ambiguidade: sempre negrito, com ícone Lucide de 20 px quando ajuda.
- **Shape:** raio base (0.75rem).
- **Primary:** verde-farmácia com texto branco e sombra de cartão; altura mínima 3rem (48 px), preenchimento lateral 1.25rem. A ação principal da tela usa o tamanho grande: 3.5rem (56 px), 1.125rem de texto, ícone de 24 px, largura total no celular.
- **Hover / Focus:** hover escurece para verde-farmácia fundo; ao pressionar, desce 1 px; foco com contorno verde de 3 px deslocado 2 px. Transição de 150 ms em cor e sombra. Desabilitado com 55% de opacidade.
- **Contornado:** fundo branco, contorno de 2 px em verde a 30%, texto tinta verde; no hover o contorno fica verde cheio e o fundo menta. É a ação secundária ("Renovar", "Ver e responder").
- **Secundário / Fantasma:** sálvia quieta ou transparente com texto tinta; para ações de navegação como "Sair".
- **Destrutivo:** vermelho sólido, ou contornado em vermelho a 40% sobre branco para destruição menos definitiva.
- **Link:** verde sublinhado, deslocamento de 3 a 4 px.

### Chips (selos de status)
- **Style:** pílula, fundo suave do status, texto forte do status, ícone de 16 px com traço 2.25, rótulo em label (700, 0.875rem), preenchimento 0.25rem × 0.75rem.
- **State:** o cliente lê o rótulo amigável ("Orçamento pronto: responda"); a equipe lê o rótulo curto ("Orçamento enviado"). Etiquetas informativas (como "Renovação") seguem a mesma forma em azul.

### Cards / Containers
- **Corner Style:** 1rem.
- **Background:** branco clínico. O cartão do pedido que espera resposta do cliente vira inteiro amarelo-suave, com texto amarelo forte e ícone de sino.
- **Shadow Strategy:** sombra de cartão (ver Elevation & Depth).
- **Border:** nenhuma. Listas agrupadas usam divisores de 1 px entre itens e `overflow: hidden` no raio.
- **Internal Padding:** 1.25rem, 1.5rem a partir de `sm`.

### Inputs / Fields
- **Style:** fundo branco, contorno de 2 px em traço de campo, raio base, altura 3.25rem, preenchimento lateral 1rem, texto 1rem. Área de texto com altura mínima de 6rem e crescimento automático.
- **Focus:** o contorno fica verde-farmácia e ganha um halo de 4 px em verde a 25%.
- **Error / Disabled:** erro troca o contorno para vermelho; desabilitado usa fundo sálvia quieta e 70% de opacidade.

### Navigation
- **Cliente, celular:** barra inferior fixa branca, 4 destinos, cada um com ícone de 24 px sobre rótulo em 0.85rem negrito, altura mínima 4.25rem. O ativo ganha a pílula menta (3.5rem × 2rem) atrás do ícone e texto tinta verde; inativos em ardósia.
- **Cliente, desktop:** itens na barra do topo (4rem de altura, fio embaixo), ícone de 20 px + rótulo negrito, altura 3rem; ativo em menta com tinta verde, hover em sálvia quieta.
- **Painel:** barra lateral branca de 16rem com a marca escrita e "Painel da farmácia" embaixo; mesmos itens de navegação empilhados; no celular vira faixa rolável no topo.
- **Marca:** só o nome "Grupo Farmácia HP" em negrito, tinta verde, sem símbolo.

### Linha do tempo do pedido (assinatura)
Quatro etapas (Solicitado, Em manipulação, Pronto para retirada, Entregue) em grade de 4 colunas: círculos de 2.25rem com contorno de 2 px ligados por uma barra de 4 px arredondada. Feitas: verde cheio com visto branco. Atual: branco, contorno verde, número verde, halo de 4 px em verde a 15%, legenda em negrito tinta verde. Futuras: contorno fio, número ardósia. Recusados e cancelados não mostram a linha.

### Avisos (toasts)
Topo centralizado, cores ricas (verde sucesso, vermelho erro), texto 1rem, título negrito, raio 0.75rem + 4px, sombra flutuante, botão de fechar, 5 s de duração.

## Do's and Don'ts

### Do:
- **Do** usar verde-farmácia para toda ação e nada mais (A Regra da Voz Única).
- **Do** mostrar status sempre com fundo suave, ícone Lucide e texto, puxando de `lib/status.ts` (A Regra do Status Triplo).
- **Do** manter todo alvo de toque com no mínimo 3rem (48 px) e a ação principal da tela com 3.5rem (56 px), largura total no celular.
- **Do** separar cartões por sombra de cartão, sem borda, com raio de 1rem.
- **Do** acompanhar todo ícone de um rótulo escrito; ícones decorativos com `aria-hidden`.
- **Do** usar números tabulares em preços, números de pedido e contagens.
- **Do** manter o foco de teclado com contorno verde de 3 px deslocado 2 px.

### Don't:
- **Don't** usar emoji como ícone; os ícones são Lucide, traço 2.
- **Don't** usar texto menor que 0.875rem nem cinza mais claro que ardósia sálvia para texto.
- **Don't** usar azul, laranja ou amarelo como cor de botão ou link.
- **Don't** comunicar status só com cor.
- **Don't** usar pesos intermediários (500, 600); só 400 e 700.
- **Don't** usar sombra com preto puro ou sombra dura deslocada sem desfoque.
- **Don't** encher telas do cliente com cartões iguais de enfeite; cada tela tem um objetivo, um cartão em destaque e a ação principal. (Os contadores de status do painel são filtros tocáveis, cada um com cor e ícone do seu status, e não contam como enfeite.)
