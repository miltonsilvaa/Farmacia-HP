---
version: 1
slug: "frontend-src"
primary_target: "frontend/src"
related_targets: []
---

# Superfície: app do Grupo Farmácia HP (cliente + painel da farmácia)

Modo: Operate. Público: clientes idosos ou cuidadores no celular, equipe da farmácia no computador do balcão.
Tarefas: enviar receita, aprovar orçamento, acompanhar o pedido, renovar em 1 clique, gerenciar o Grupo Família; a equipe avalia, precifica e avança o status.
Restrições: shadcn/ui sobre Tailwind v4; toasts; sem endereço de entrega (renovação mostra preço, produtos, paciente e retirada/entrega a combinar); nada de dado inventado.

## Direction contract

THESIS: O padrão dos apps de saúde e farmácia (nível Drogasil/Raia) executado sem concessões para quem enxerga pouco e tem pouca prática com celular. Recusa o painel de SaaS genérico com cards iguais, emoji como ícone e texto cinza-claro miúdo.

OWN-WORLD: Fundo neutro frio claro, superfícies brancas, verde-farmácia profundo como única cor de ação, azul só para informação, laranja/verde/azul/cinza como vocabulário fixo de status, sempre com ícone e texto. Atkinson Hyperlegible Next (desenhada para baixa visão), corpo de 18 px, números tabulares nos preços. Ícones Lucide com traço 2. Cantos de 12 px, sombra suave com deslocamento, bordas de 1 px.

STORY: O cliente entende em um olhar o que fazer agora (enviar receita ou agir num orçamento), acha o status do remédio sem perguntar, renova com confirmação e nunca fica em dúvida se algo funcionou. A equipe vê a fila por status e age sem abrir cada pedido.

FIRST VIEWPORT: No celular, abaixo da barra do topo: saudação curta; o pedido que precisa de ação (ou o mais recente) com a linha do tempo; o botão verde de altura 56 px "Enviar receita" ocupando a largura; depois as ações secundárias em lista com ícone e rótulo (Meus pedidos, Minha família). Navegação inferior fixa com ícone + rótulo.

FORM: Padrão da categoria (saída canônica escolhida pelo usuário), fora da lista ordenada; seed f8c249c3.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
