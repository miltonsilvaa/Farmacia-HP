import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { STORAGE_PORT, StoragePort } from './core/ports/out/storage.port';
import {
  ERP_PORT,
  ErpPort,
  FormatoErp,
  PedidoErp,
} from './core/ports/out/erp.port';
import { serializarPedido } from './core/erp/erp-serializador';

@Injectable()
export class ErpService {
  private readonly logger = new Logger(ErpService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PORT)
    private readonly storagePort: StoragePort,
    @Inject(ERP_PORT)
    private readonly erpPort: ErpPort,
  ) {}

  private async montarPedido(id: string): Promise<PedidoErp> {
    const o = await this.prisma.orcamento.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, email: true } },
        familiar: true,
        itens: { include: { produto: { select: { nome: true } } } },
        anexos: true,
      },
    });
    if (!o) throw new NotFoundException('Pedido não encontrado.');

    const arquivos = [
      {
        tipo: 'RECEITA' as const,
        url: o.arquivoReceitaUrl,
        nome: o.arquivoReceitaUrl.split('/').pop(),
      },
      ...o.anexos.map((a) => ({
        tipo: 'ANEXO' as const,
        url: a.arquivoUrl,
        nome: a.nomeArquivo,
      })),
    ];

    return {
      pedido: {
        id: o.id,
        numero: o.id.substring(0, 8).toUpperCase(),
        criadoEm: o.criadoEm.toISOString(),
        status: o.status,
        observacoes: o.observacoes,
        respostaFarmacia: o.respostaAdmin,
        posologia: o.posologia,
        valorTotal: o.preco?.toFixed(2) ?? null,
      },
      cliente: { id: o.usuario.id, email: o.usuario.email },
      paciente: o.familiar
        ? {
            tipo: o.familiar.tipo === 'PET' ? 'PET' : 'DEPENDENTE',
            nome: o.familiar.nome,
            parentesco: o.familiar.parentesco,
            especie: o.familiar.especie,
            dataNascimento:
              o.familiar.dataNascimento?.toISOString().slice(0, 10) ?? null,
          }
        : {
            tipo: 'TITULAR',
            nome: null,
            parentesco: null,
            especie: null,
            dataNascimento: null,
          },
      itens: o.itens.map((i) => ({
        produtoId: i.produtoId,
        nome: i.produto.nome,
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario.toFixed(2),
        subtotal: i.precoUnitario.mul(i.quantidade).toFixed(2),
      })),
      arquivos: await Promise.all(
        arquivos.map(async (a) => {
          const { buffer, mimetype } = await this.storagePort.baixarArquivo(
            a.url,
          );
          return {
            tipo: a.tipo,
            nomeArquivo: a.nome,
            mimetype,
            conteudoBase64: buffer.toString('base64'),
          };
        }),
      ),
    };
  }

  // Envia ao ERP e registra o resultado no pedido. Não lança erro: uma falha no
  // ERP não pode desfazer a aprovação do cliente; o admin pode reenviar depois.
  async sincronizar(id: string) {
    try {
      await this.erpPort.enviarPedido(await this.montarPedido(id));
      return await this.prisma.orcamento.update({
        where: { id },
        data: { erpStatus: 'ENVIADO', erpEnviadoEm: new Date(), erpErro: null },
        select: {
          id: true,
          erpStatus: true,
          erpEnviadoEm: true,
          erpErro: true,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const mensagem =
        error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`Falha ao enviar pedido ${id} ao ERP: ${mensagem}`);
      return this.prisma.orcamento.update({
        where: { id },
        data: { erpStatus: 'ERRO', erpErro: mensagem.slice(0, 500) },
        select: {
          id: true,
          erpStatus: true,
          erpEnviadoEm: true,
          erpErro: true,
        },
      });
    }
  }

  async exportar(id: string, formato: FormatoErp) {
    const pedido = await this.montarPedido(id);
    return {
      conteudo: serializarPedido(pedido, formato),
      nomeArquivo: `pedido-${pedido.pedido.numero}.${formato}`,
    };
  }
}
