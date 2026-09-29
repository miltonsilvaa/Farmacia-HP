# Alterações pós-feedback do PO (04/06/2026)

1. Nomenclatura: "HomeoFórmula"/"Homeofórmula" → "Grupo Farmácia HP" (index.html <title>, AdminLayout, Layout, Login, Cadastro)
2. Filtro por status no AdminPedidos (Todos/Pendente/Aguardando pagamento/Recusado/Finalizado, com contagem e aria-pressed)
3. Vendas: alert() → toast (erro de carrinho vazio e sucesso da venda)
4. E-mail padronizado de status (backend):
   - Nova porta `NotificacaoPort` + adapter `EmailNotificacaoAdapter` (nodemailer), registrados no OrcamentoModule
   - Disparos: receita enviada / renovação (PENDENTE), avaliação do admin (AGUARDANDO_PAGAMENTO ou RECUSADO, com preço e mensagem), resposta do cliente (PRODUCAO ou CANCELADO)
   - Template HTML com marca Grupo Farmácia HP, nº do pedido, status, valor e mensagem
   - Falha no envio só gera log, não quebra a operação
   - docker-compose: serviço Mailpit (SMTP 1025, caixa em http://localhost:8025); backend recebe SMTP_HOST/SMTP_PORT
   - .env-example: SMTP_HOST, SMTP_PORT, SMTP_FROM
   - Dependências: nodemailer, @types/nodemailer
5. Relatório simplificado (admin):
   - Nova página `AdminRelatorios` em /admin/relatorios + link "Relatórios" no menu admin
   - Cards: total de pedidos, pendentes, faturamento aprovado (PRODUCAO/FINALIZADO), ticket médio
   - Pedidos por status e tabela dos últimos 6 meses (quantidade e faturamento)
   - Botão Exportar CSV (separador ;, compatível com Excel)
   - Calculado no front a partir do /orcamentos/admin, sem endpoint novo
6. Acessibilidade e responsividade básicas:
   - index.html: lang="en" → lang="pt-BR"
   - Labels ligadas aos campos (htmlFor/id) em Login, Cadastro, GrupoFamilia, AdminProdutos, DashboardAdmin e Produtos (19 campos)
   - NovoOrcamento: select de paciente e observações ligados aos títulos via aria-labelledby
   - Vendas: busca com aria-label; layout empilha no celular (flex-col → lg:flex-row) e altura fixa só no desktop
   - Produtos: tabela com rolagem horizontal (overflow-x-auto) no celular
   - index.css: foco visível global (focus-visible) para navegação por teclado
7. Segurança dos dados sensíveis (receitas e dependentes):
   - POST /orcamentos/receita agora exige login (JwtAuthGuard); antes aceitava envio anônimo
   - clienteId vem do token (req.user.id), não mais do body — impede enviar receita em nome de outro cliente
   - familiarId validado: só aceita dependente da própria conta (403 caso contrário)
   - Upload restrito a imagem/PDF, limite de 10 MB
   - Front (NovoOrcamento): removido envio de clienteId no FormData
8. Documento `integracao-erp.md` (para o repo homeoformula-docs): dados a sincronizar, opções de integração (API / JSON-XML / réplica), requisitos não funcionais (segurança, LGPD, resiliência, idempotência), encaixe hexagonal (ErpPort + adapters + mock) e 6 perguntas pendentes para o PO

# Checklist do MVP — Área do Cliente (28/09/2026)

> **Banco:** o schema mudou (novas tabelas `orcamento_anexos` e `familia_acessos`, campos `tipo`/`especie` em `familiares`, relação de produtos complementares). Rodar `npx prisma db push` no backend antes de subir.

1. Upload de receita **e anexos**: até 5 anexos extras (imagem/PDF, 10 MB cada) por pedido; aparecem em Meus Pedidos e no AdminPedidos
2. Sugestões de produtos complementares: admin marca os complementares no cadastro do produto (relação vale nos dois sentidos); no Novo Orçamento aparece "Combina com o seu pedido" conforme o carrinho (`GET /produtos/sugestoes?ids=`)
3. Renovação em 1 clique: copia receita, anexos, paciente e produtos (com preço atual; produtos inativos ficam de fora e o cliente é avisado); disponível para pedidos Em Produção e Finalizados; a lista atualiza na hora
4. Grupo Família com pets: tipo Parente/Pet, espécie do pet, edição de dependentes; dependente com pedidos não pode ser removido (preserva o histórico)
5. Compartilhamento seguro no Grupo Família: titular convida outro usuário pelo e-mail; quem aceita pode pedir orçamentos e acompanhar os pedidos dos dependentes compartilhados. Os pedidos pessoais do titular continuam privados. O titular pode revogar e o convidado pode sair a qualquer momento. Backend valida o acesso em envio, listagem, resposta e renovação
6. Feedback visual: `confirm()` nativo trocado por modal acessível (`ConfirmDialog`); mensagens de erro do backend exibidas no toast
7. Acessibilidade: `aria-label` nos botões −/+ e de remover, emojis decorativos com `aria-hidden`, `role="status"` nos carregamentos
8. Rotas do cliente agora exigem login (`ClienteRoute`)

# Checklist do MVP — Painel de Gestão e Sistema (28/09/2026)

> **Banco:** novos campos `erpStatus`, `erpEnviadoEm` e `erpErro` em `orcamentos`. Rodar `npx prisma db push` de novo.

1. Pedidos no admin: filtros para todos os status (inclui Em produção e Cancelado) com nomes legíveis; botão "Marcar finalizado" para pedidos em produção (antes nenhum pedido chegava a Finalizado); backend valida as transições de status do admin
2. Relatórios: sem mudança (já atendido)
3. E-mails: novo e-mail de "Pedido pronto" (Finalizado); mensagem do admin escapada no HTML
4. Integração com o ERP legado (`ErpPort`):
   - Pedido aprovado pelo cliente é enviado automaticamente, com dados do cliente, paciente, itens, valores, receita e anexos (em base64)
   - Formato JSON ou XML (`ERP_FORMATO`)
   - Com `ERP_URL`: POST HTTP com `Idempotency-Key` = id do pedido e token opcional (`ERP_TOKEN`)
   - Sem `ERP_URL`: grava `pedido-XXXX.json|xml` em `backend/erp-saida` (troca por arquivo)
   - Resultado fica no pedido (Enviado/Falhou + motivo); admin pode reenviar e baixar o JSON/XML de qualquer pedido
   - Falha no ERP não desfaz a aprovação do cliente
5. MinIO: links assinados agora usam o host público (`MINIO_PUBLIC_ENDPOINT`, padrão `localhost`). Dentro do Docker eles eram gerados com `minio:9000`, que o navegador não abre

# Extras para reduzir o WhatsApp (28/09/2026)

> **Banco:** novo campo `lembreteRecompraEm` em `orcamentos` (`npx prisma db push`). **Dependência nova:** `@nestjs/schedule`. Rebuildar o backend: `docker compose up --build`.

1. Linha do tempo do pedido ("Onde está meu remédio?"): barra de 4 etapas em Meus Pedidos — Solicitado → Em manipulação → Pronto para retirada/envio → Entregue
   - Novo status `ENTREGUE`; admin tem "Marcar pronto" (Em produção → Pronto) e "Marcar entregue" (Pronto → Entregue), cada um com e-mail ao cliente
   - Acessível: lista ordenada com `aria-current="step"` e texto para leitor de tela em cada etapa
2. Lembrete automático de recompra: job diário às 9h (horário de Brasília) envia "Seu medicamento está acabando?" `LEMBRETE_RECOMPRA_DIAS` (padrão 25) dias após um pedido aprovado
   - Não envia se já existe pedido mais novo para o mesmo paciente; cada pedido gera no máximo um lembrete
   - Só considera pedidos de até 15 dias além do prazo (evita avalanche de e-mails no primeiro dia)
   - O botão do e-mail abre Meus Pedidos com um aviso "Renovar agora" (nada é renovado só por clicar no link)
   - Admin pode rodar na hora: `POST /orcamentos/admin/lembretes/executar`
3. Suporte via WhatsApp com contexto: link discreto em cada pedido abre `wa.me` com "Olá, preciso de ajuda com o Pedido #XXXX". Número em `WHATSAPP_FARMACIA` (vazio esconde o botão)

# Posologia no histórico — "Como tomar" (28/09/2026)

> **Banco:** novo campo `posologia` em `orcamentos` (`npx prisma db push`).

- Cliente: quadro "Como tomar" em destaque (letra grande) em cada pedido de Meus Pedidos
- Farmacêutico: campo "Modo de Uso / Posologia" ao avaliar a receita (renovações já vêm preenchidas com a do pedido anterior) e botão "Adicionar/Editar modo de uso" em Pedidos, a qualquer momento
- Renovação em 1 clique copia a posologia
- ERP: a posologia vai no JSON/XML de saída e o ERP pode enviá-la de volta:
  `PUT /erp/pedidos/:id/posologia` com `Authorization: Bearer <ERP_TOKEN>` e corpo `{ "posologia": "..." }`
  (sem `ERP_TOKEN` configurado essa rota fica desligada)
