# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Clientes da farmácia de manipulação**, muitos idosos ou cuidadores, pacientes de uso contínuo. Usam principalmente pelo celular, às vezes pelo tablet ou computador. O trabalho: mandar a receita, aprovar o orçamento, acompanhar o preparo e renovar o remédio sem precisar falar com ninguém.
- **Titulares de um Grupo Família**, que pedem por parentes e pets, e membros convidados (por exemplo o cônjuge), que acompanham os mesmos dependentes.
- **Equipe da farmácia (admin)**, no computador do balcão: avalia receitas, envia orçamentos, acompanha o preparo, marca pronto e entregue, cuida do catálogo e dos relatórios.

## Product Purpose

Tirar da farmácia o gargalo do WhatsApp: pedido de orçamento, status do remédio, dúvidas de dosagem e recompra passam a acontecer no app. Sucesso é o cliente conseguir pedir e renovar sozinho, e a equipe receber menos mensagens do tipo "meu remédio já está pronto?".

## Positioning

Autoatendimento de farmácia de manipulação pensado para quem tem pouca familiaridade com tecnologia: receita por foto, renovação em 1 clique com a mesma receita e os mesmos produtos, linha do tempo do pedido, posologia sempre à mão e um Grupo Família que inclui pets.

## Operating Context

- Fluxo do pedido: Solicitado (PENDENTE) → Orçamento disponível (AGUARDANDO_PAGAMENTO; o cliente aprova ou recusa) → Em manipulação (PRODUCAO) → Pronto para retirada/envio (FINALIZADO) → Entregue (ENTREGUE). Também existem RECUSADO (pela farmácia) e CANCELADO (pelo cliente).
- O cliente recebe e-mails padronizados a cada mudança de status e um lembrete de recompra 25 dias depois de um pedido aprovado.
- Os pedidos aprovados vão para o ERP legado da farmácia (JSON/XML).
- O botão de WhatsApp continua existindo como saída de apoio, já com o número do pedido na mensagem.

## Capabilities and Constraints

- Stack existente: React + Vite + Tailwind (frontend), NestJS + Prisma + PostgreSQL + MinIO (backend), Docker Compose.
- Base de componentes decidida: Tailwind + shadcn/ui.
- Não há endereço de entrega no sistema: a renovação mostra preço, produtos e paciente, com retirada na farmácia ou envio a combinar.
- Arquivos aceitos: imagem ou PDF, até 10 MB; até 5 anexos por pedido.
- Interface toda em português do Brasil.

## Brand Commitments

- Nome exibido: **Grupo Farmácia HP** (renomeado de "HomeoFórmula" a pedido do PO).
- Não há logo nem cores oficiais: a identidade visual pode ser proposta. A logo é apenas o nome escrito, sem símbolo inventado.
- Tom de voz: simples, acolhedor e direto, sem jargão técnico ("Tirar foto da receita" em vez de "Upload de documento").
- Direção visual escolhida pelo usuário (29/09/2026): o padrão da categoria de apps de saúde e farmácia, executado com capricho total, sem ironia nem invenção. Referência de nível: app Drogasil / Droga Raia. Não copiar a marca, as cores nem os elementos proprietários deles, só o nível de acabamento.

## Evidence on Hand

Nenhum depoimento, número, selo ou foto real da farmácia. Não inventar clientes, avaliações, estatísticas, endereço ou telefone.

## Product Principles

1. Quem tem pouca familiaridade com tecnologia precisa conseguir terminar sozinho: um objetivo por tela, poucos passos, nenhum beco sem saída.
2. A pessoa nunca fica na dúvida se algo funcionou: toda ação tem retorno visível.
3. Informação de saúde é clara e fácil de achar: status, posologia e valor sempre legíveis.
4. A família é parte do produto: pedir para outra pessoa ou para um pet é tão fácil quanto pedir para si.
5. O WhatsApp é a saída de apoio, não o caminho principal.

## Accessibility & Inclusion

Público idoso ou com a visão cansada: texto grande e com alto contraste, alvos de toque de no mínimo 48 px, ícones sempre acompanhados de texto, linguagem simples, funcionamento completo no celular. Meta: WCAG 2.2 AA.
