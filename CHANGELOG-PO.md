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
