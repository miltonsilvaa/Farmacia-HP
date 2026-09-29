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
