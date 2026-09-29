import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NOTIFICACAO_PORT,
  NotificacaoPort,
} from './core/ports/out/notificacao.port';
import { STATUS_RENOVAVEIS } from './orcamento.service';

const DIA_MS = 24 * 60 * 60 * 1000;
// Pedidos mais antigos que isso não recebem lembrete (evita uma avalanche de
// e-mails de pedidos velhos no primeiro dia em que o job rodar)
const JANELA_DIAS = 15;

@Injectable()
export class LembreteRecompraService {
  private readonly logger = new Logger(LembreteRecompraService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(NOTIFICACAO_PORT)
    private readonly notificacao: NotificacaoPort,
  ) {}

  // Todo dia às 9h: avisa quem fez um pedido aprovado há LEMBRETE_RECOMPRA_DIAS
  // dias (padrão 25) e ainda não pediu de novo para o mesmo paciente
  @Cron('0 9 * * *', { timeZone: 'America/Sao_Paulo' })
  async enviarLembretes() {
    const dias = parseInt(process.env.LEMBRETE_RECOMPRA_DIAS || '25', 10);
    const limite = new Date(Date.now() - dias * DIA_MS);
    const inicioJanela = new Date(limite.getTime() - JANELA_DIAS * DIA_MS);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';

    const candidatos = await this.prisma.orcamento.findMany({
      where: {
        status: { in: STATUS_RENOVAVEIS },
        lembreteRecompraEm: null,
        criadoEm: { gte: inicioJanela, lte: limite },
      },
      include: {
        usuario: { select: { email: true } },
        familiar: { select: { nome: true } },
      },
    });

    let enviados = 0;
    for (const pedido of candidatos) {
      // Já existe pedido mais novo para o mesmo paciente: não precisa lembrar
      const pedidoMaisNovo = await this.prisma.orcamento.count({
        where: {
          familiarId: pedido.familiarId,
          ...(pedido.familiarId === null && { clienteId: pedido.clienteId }),
          criadoEm: { gt: pedido.criadoEm },
          status: { notIn: ['RECUSADO', 'CANCELADO'] },
        },
      });

      try {
        if (pedidoMaisNovo === 0) {
          await this.notificacao.lembrarRecompra({
            email: pedido.usuario.email,
            pedidoId: pedido.id,
            paciente: pedido.familiar?.nome ?? null,
            linkRenovar: `${frontend}/meus-pedidos?renovar=${pedido.id}`,
          });
          enviados++;
        }
        // Marca também os que já tinham pedido novo, para não reavaliar todo dia
        await this.prisma.orcamento.update({
          where: { id: pedido.id },
          data: { lembreteRecompraEm: new Date() },
        });
      } catch {
        // Falha no e-mail: deixa sem marcar para tentar de novo amanhã
      }
    }

    if (candidatos.length > 0) {
      this.logger.log(
        `Lembretes de recompra: ${enviados} enviado(s) de ${candidatos.length} candidato(s).`,
      );
    }
    return { candidatos: candidatos.length, enviados };
  }
}
