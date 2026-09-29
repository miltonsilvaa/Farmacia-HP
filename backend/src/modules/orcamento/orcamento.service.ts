import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { STORAGE_PORT, StoragePort } from './core/ports/out/storage.port';
import { NOTIFICACAO_PORT, NotificacaoPort } from './core/ports/out/notificacao.port';

@Injectable()
export class OrcamentoService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PORT)
    private readonly storagePort: StoragePort,
    @Inject(NOTIFICACAO_PORT)
    private readonly notificacao: NotificacaoPort,
  ) {}

  private async notificar(clienteId: string, pedidoId: string, status: string, preco?: unknown, mensagem?: string | null) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: clienteId }, select: { email: true } });
    if (!usuario) return;
    void this.notificacao.notificarStatus({ email: usuario.email, pedidoId, status, preco: preco as any, mensagem });
  }

  private async assinarUrl(arquivoReceitaUrl: string): Promise<string> {
    try {
      return await this.storagePort.gerarUrlAssinada(arquivoReceitaUrl);
    } catch {
      return arquivoReceitaUrl; // fallback: devolve o que estava (evita quebrar a listagem)
    }
  }

  async listarTodos() {
    const rows = await this.prisma.orcamento.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        usuario: { select: { email: true } },
        itens: { include: { produto: true } },
        familiar: { select: { id: true, nome: true, parentesco: true } },
      },
    });

    return Promise.all(
      rows.map(async (o) => ({
        ...o,
        arquivoReceitaUrl: await this.assinarUrl(o.arquivoReceitaUrl),
      })),
    );
  }

  async avaliarOrcamento(
    id: string,
    status: string,
    preco?: number,
    respostaAdmin?: string,
  ) {
    const orcamento = await this.prisma.orcamento.findUnique({ where: { id } });
    if (!orcamento) throw new NotFoundException('Orçamento não encontrado.');

    const atualizado = await this.prisma.orcamento.update({
      where: { id },
      data: {
        status,
        ...(preco !== undefined && { preco }),
        ...(respostaAdmin !== undefined && { respostaAdmin }),
      },
    });
    await this.notificar(atualizado.clienteId, id, status, atualizado.preco, respostaAdmin);
    return atualizado;
  }

  async listarPorUsuario(usuarioId: string) {
    const rows = await this.prisma.orcamento.findMany({
      where: { clienteId: usuarioId },
      orderBy: { criadoEm: 'desc' },
      include: {
        itens: { include: { produto: true } },
        familiar: { select: { id: true, nome: true, parentesco: true } },
      },
    });

    return Promise.all(
      rows.map(async (o) => ({
        ...o,
        arquivoReceitaUrl: await this.assinarUrl(o.arquivoReceitaUrl),
      })),
    );
  }

  async responderCliente(id: string, acao: string, usuarioId: string) {
    const orcamento = await this.prisma.orcamento.findUnique({ where: { id } });

    if (!orcamento) throw new NotFoundException('Orçamento não encontrado.');
    if (orcamento.clienteId !== usuarioId) throw new ForbiddenException('Este orçamento não pertence ao usuário.');
    if (orcamento.status !== 'AGUARDANDO_PAGAMENTO') {
      throw new BadRequestException('Só é possível responder orçamentos com status AGUARDANDO_PAGAMENTO.');
    }

    const novoStatus = acao === 'APROVAR' ? 'PRODUCAO' : 'CANCELADO';

    const atualizado = await this.prisma.orcamento.update({
      where: { id },
      data: { status: novoStatus },
    });
    await this.notificar(usuarioId, id, novoStatus);
    return atualizado;
  }

  async renovarPedido(pedidoAntigoId: string, usuarioId: string) {
    const pedidoOriginal = await this.prisma.orcamento.findFirst({
      where: { id: pedidoAntigoId, clienteId: usuarioId },
    });

    if (!pedidoOriginal) {
      throw new NotFoundException('Pedido não encontrado ou não pertence ao usuário.');
    }

    const novoPedido = await this.prisma.orcamento.create({
      data: {
        clienteId: pedidoOriginal.clienteId,
        familiarId: pedidoOriginal.familiarId ?? null,
        arquivoReceitaUrl: pedidoOriginal.arquivoReceitaUrl,
        status: 'PENDENTE',
        observacoes: pedidoOriginal.observacoes
          ? `[Renovação] ${pedidoOriginal.observacoes}`
          : '[Renovação automática]',
      },
    });

    await this.notificar(usuarioId, novoPedido.id, 'PENDENTE');
    return { sucesso: true, novoId: novoPedido.id };
  }
}
