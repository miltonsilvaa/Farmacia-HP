import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MinioService } from './minio.service';
import { EmailService } from './email.service';
import { FamiliarService } from '../familiar/familiar.service';
import { ErpService } from './erp.service';

// Status em que o pedido já foi concluído e pode ser refeito com 1 clique
export const STATUS_RENOVAVEIS = ['PRODUCAO', 'FINALIZADO', 'ENTREGUE'];

export interface ArquivoEnviado {
  nomeArquivo: string;
  buffer: Buffer;
  mimetype: string;
}

export interface NovoPedido {
  clienteId: string;
  receita: ArquivoEnviado;
  anexos: ArquivoEnviado[];
  observacoes?: string;
  itens?: { produtoId: string; quantidade: number }[];
  familiarId?: string;
}

// Transições que a equipe da farmácia pode fazer: status novo → status de origem aceitos
const TRANSICOES_ADMIN: Record<string, string[]> = {
  AGUARDANDO_PAGAMENTO: ['PENDENTE', 'AGUARDANDO_PAGAMENTO'],
  RECUSADO: ['PENDENTE', 'AGUARDANDO_PAGAMENTO'],
  FINALIZADO: ['PRODUCAO'], // pronto para retirada/envio
  ENTREGUE: ['FINALIZADO'],
};

@Injectable()
export class OrcamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly email: EmailService,
    private readonly familiarService: FamiliarService,
    private readonly erpService: ErpService,
  ) {}

  private async notificar(
    clienteId: string,
    pedidoId: string,
    status: string,
    preco?: unknown,
    mensagem?: string | null,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: clienteId },
      select: { email: true },
    });
    if (!usuario) return;
    void this.email.notificarStatus({
      email: usuario.email,
      pedidoId,
      status,
      preco: preco as any,
      mensagem,
    });
  }

  private async assinarUrl(arquivoReceitaUrl: string): Promise<string> {
    try {
      return await this.minio.gerarUrlAssinada(arquivoReceitaUrl);
    } catch {
      return arquivoReceitaUrl; // fallback: devolve o que estava (evita quebrar a listagem)
    }
  }

  private async assinarArquivos<
    T extends { arquivoReceitaUrl: string; anexos: { arquivoUrl: string }[] },
  >(o: T): Promise<T> {
    return {
      ...o,
      arquivoReceitaUrl: await this.assinarUrl(o.arquivoReceitaUrl),
      anexos: await Promise.all(
        o.anexos.map(async (a) => ({
          ...a,
          arquivoUrl: await this.assinarUrl(a.arquivoUrl),
        })),
      ),
    };
  }

  // Pedidos que o usuário pode ver: os que ele fez e os dos dependentes do seu
  // Grupo Família (próprio ou compartilhado com ele por convite)
  private async filtroAcesso(
    usuarioId: string,
  ): Promise<Prisma.OrcamentoWhereInput> {
    const titulares = await this.familiarService.titularesAcessiveis(usuarioId);
    return {
      OR: [
        { clienteId: usuarioId },
        { familiar: { usuarioId: { in: [usuarioId, ...titulares] } } },
      ],
    };
  }

  private async buscarComAcesso(id: string, usuarioId: string) {
    const orcamento = await this.prisma.orcamento.findFirst({
      where: { id, ...(await this.filtroAcesso(usuarioId)) },
      include: { itens: true, anexos: true },
    });
    if (!orcamento) {
      throw new NotFoundException(
        'Pedido não encontrado ou não pertence ao seu Grupo Família.',
      );
    }
    return orcamento;
  }

  // Novo pedido: sobe os arquivos e grava pedido, anexos e produtos numa só
  // operação (se o banco falhar, não fica pedido pela metade)
  async criarPedido(novo: NovoPedido) {
    if (novo.familiarId) {
      const permitido = await this.familiarService.podeAcessarFamiliar(
        novo.clienteId,
        novo.familiarId,
      );
      if (!permitido) {
        throw new ForbiddenException(
          'Este dependente não pertence ao seu Grupo Família.',
        );
      }
    }

    const itens = novo.itens ?? [];
    if (
      !Array.isArray(itens) ||
      itens.some(
        (i) =>
          typeof i?.produtoId !== 'string' ||
          !Number.isInteger(i.quantidade) ||
          i.quantidade < 1 ||
          i.quantidade > 99,
      )
    ) {
      throw new BadRequestException(
        'Itens inválidos: informe o produto e uma quantidade entre 1 e 99.',
      );
    }

    // Produtos inativos ou inexistentes são ignorados; o preço vem do catálogo
    const produtos = await this.prisma.produto.findMany({
      where: { id: { in: itens.map((i) => i.produtoId) }, ativo: true },
    });
    const preco = new Map(produtos.map((p) => [p.id, p.preco]));

    const receitaUrl = await this.minio.uploadArquivo(
      novo.receita.nomeArquivo,
      novo.receita.buffer,
      novo.receita.mimetype,
    );
    const anexos = await Promise.all(
      novo.anexos.map(async (a) => ({
        nomeArquivo: a.nomeArquivo,
        arquivoUrl: await this.minio.uploadArquivo(
          a.nomeArquivo,
          a.buffer,
          a.mimetype,
        ),
      })),
    );

    const pedido = await this.prisma.orcamento.create({
      data: {
        clienteId: novo.clienteId,
        familiarId: novo.familiarId ?? null,
        arquivoReceitaUrl: receitaUrl,
        observacoes: novo.observacoes || null,
        status: 'PENDENTE',
        anexos: { create: anexos },
        itens: {
          create: itens
            .filter((i) => preco.has(i.produtoId))
            .map((i) => ({
              produtoId: i.produtoId,
              quantidade: i.quantidade,
              precoUnitario: preco.get(i.produtoId),
            })),
        },
      },
    });

    await this.notificar(novo.clienteId, pedido.id, 'PENDENTE');
    return { id: pedido.id };
  }

  async listarTodos() {
    const rows = await this.prisma.orcamento.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        usuario: { select: { email: true } },
        itens: { include: { produto: true } },
        anexos: true,
        familiar: {
          select: {
            id: true,
            nome: true,
            parentesco: true,
            tipo: true,
            especie: true,
          },
        },
      },
    });

    return Promise.all(rows.map((o) => this.assinarArquivos(o)));
  }

  async avaliarOrcamento(
    id: string,
    status: string,
    preco?: number,
    respostaAdmin?: string,
    posologia?: string,
  ) {
    const orcamento = await this.prisma.orcamento.findUnique({ where: { id } });
    if (!orcamento) throw new NotFoundException('Orçamento não encontrado.');

    if (
      status === 'AGUARDANDO_PAGAMENTO' &&
      (typeof preco !== 'number' || !Number.isFinite(preco) || preco <= 0)
    ) {
      throw new BadRequestException('Informe um preço maior que zero.');
    }

    const origensPermitidas = TRANSICOES_ADMIN[status];
    if (!origensPermitidas)
      throw new BadRequestException(`Status inválido: ${status}.`);
    if (!origensPermitidas.includes(orcamento.status)) {
      throw new BadRequestException(
        `Não é possível mudar um pedido de ${orcamento.status} para ${status}.`,
      );
    }

    const atualizado = await this.prisma.orcamento.update({
      where: { id },
      data: {
        status,
        ...(preco !== undefined && { preco }),
        ...(respostaAdmin !== undefined && { respostaAdmin }),
        ...(posologia !== undefined && { posologia: posologia.trim() || null }),
      },
    });
    await this.notificar(
      atualizado.clienteId,
      id,
      status,
      atualizado.preco,
      respostaAdmin,
    );
    return atualizado;
  }

  async listarPorUsuario(usuarioId: string) {
    const rows = await this.prisma.orcamento.findMany({
      where: await this.filtroAcesso(usuarioId),
      orderBy: { criadoEm: 'desc' },
      include: {
        usuario: { select: { email: true } },
        itens: { include: { produto: true } },
        anexos: true,
        familiar: {
          select: {
            id: true,
            nome: true,
            parentesco: true,
            tipo: true,
            especie: true,
            usuarioId: true,
          },
        },
      },
    });

    return Promise.all(
      rows.map(async ({ usuario, ...o }) => ({
        ...(await this.assinarArquivos(o)),
        // Só expõe quem fez o pedido quando foi outro membro da família
        solicitadoPor: o.clienteId === usuarioId ? null : usuario.email,
      })),
    );
  }

  async responderCliente(id: string, acao: string, usuarioId: string) {
    // Sem esta checagem, qualquer valor diferente de APROVAR cancelava o pedido
    if (acao !== 'APROVAR' && acao !== 'RECUSAR') {
      throw new BadRequestException('Ação inválida: use APROVAR ou RECUSAR.');
    }
    const orcamento = await this.buscarComAcesso(id, usuarioId);

    if (orcamento.status !== 'AGUARDANDO_PAGAMENTO') {
      throw new BadRequestException(
        'Só é possível responder orçamentos com status AGUARDANDO_PAGAMENTO.',
      );
    }

    const novoStatus = acao === 'APROVAR' ? 'PRODUCAO' : 'CANCELADO';

    const atualizado = await this.prisma.orcamento.update({
      where: { id },
      data: { status: novoStatus },
    });
    await this.notificar(orcamento.clienteId, id, novoStatus);
    // Pedido aprovado segue para o ERP em segundo plano (falha fica registrada no pedido)
    if (novoStatus === 'PRODUCAO') void this.erpService.sincronizar(id);
    return atualizado;
  }

  // Renovação em 1 clique: repete receita, anexos, paciente e produtos do pedido original
  async renovarPedido(pedidoAntigoId: string, usuarioId: string) {
    const pedidoOriginal = await this.buscarComAcesso(
      pedidoAntigoId,
      usuarioId,
    );

    if (!STATUS_RENOVAVEIS.includes(pedidoOriginal.status)) {
      throw new BadRequestException(
        'Só é possível renovar pedidos aprovados pelo cliente.',
      );
    }

    const produtosAtivos = await this.prisma.produto.findMany({
      where: {
        id: { in: pedidoOriginal.itens.map((i) => i.produtoId) },
        ativo: true,
      },
    });
    const precoAtual = new Map(produtosAtivos.map((p) => [p.id, p.preco]));

    const novoPedido = await this.prisma.orcamento.create({
      data: {
        clienteId: usuarioId,
        familiarId: pedidoOriginal.familiarId ?? null,
        arquivoReceitaUrl: pedidoOriginal.arquivoReceitaUrl,
        posologia: pedidoOriginal.posologia,
        status: 'PENDENTE',
        observacoes: pedidoOriginal.observacoes
          ? `[Renovação] ${pedidoOriginal.observacoes.replace(/^\[Renovação\]\s*/, '')}`
          : '[Renovação automática]',
        itens: {
          create: pedidoOriginal.itens
            .filter((i) => precoAtual.has(i.produtoId))
            .map((i) => ({
              produtoId: i.produtoId,
              quantidade: i.quantidade,
              precoUnitario: precoAtual.get(i.produtoId),
            })),
        },
        anexos: {
          create: pedidoOriginal.anexos.map((a) => ({
            arquivoUrl: a.arquivoUrl,
            nomeArquivo: a.nomeArquivo,
          })),
        },
      },
    });

    const itensIndisponiveis = pedidoOriginal.itens.filter(
      (i) => !precoAtual.has(i.produtoId),
    ).length;

    await this.notificar(usuarioId, novoPedido.id, 'PENDENTE');
    return { sucesso: true, novoId: novoPedido.id, itensIndisponiveis };
  }

  // Modo de uso pode ser ajustado a qualquer momento (pelo admin ou pelo ERP),
  // sem mudar o status nem disparar e-mail
  async definirPosologia(id: string, posologia: string | null) {
    const orcamento = await this.prisma.orcamento.findUnique({ where: { id } });
    if (!orcamento) throw new NotFoundException('Pedido não encontrado.');
    return this.prisma.orcamento.update({
      where: { id },
      data: { posologia: posologia?.trim() || null },
      select: { id: true, posologia: true },
    });
  }
}
