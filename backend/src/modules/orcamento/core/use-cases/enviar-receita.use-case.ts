import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  EnviarReceitaUseCasePort,
  EnviarReceitaCommand,
} from '../ports/in/enviar-receita.use-case.port';
import { ORCAMENTO_REPOSITORY } from '../ports/out/orcamento.repository.port';
import { STORAGE_PORT } from '../ports/out/storage.port';
import {
  NOTIFICACAO_PORT,
  NotificacaoPort,
} from '../ports/out/notificacao.port';
import { Orcamento } from '../entities/orcamento.entity';
import { PrismaService } from '../../../../prisma/prisma.service';
import { FamiliarService } from '../../../familiar/familiar.service';

@Injectable()
export class EnviarReceitaUseCase implements EnviarReceitaUseCasePort {
  constructor(
    @Inject(ORCAMENTO_REPOSITORY)
    private readonly orcamentoRepository: any,

    @Inject(STORAGE_PORT)
    private readonly storagePort: any,

    private readonly prisma: PrismaService,

    @Inject(NOTIFICACAO_PORT)
    private readonly notificacao: NotificacaoPort,

    private readonly familiarService: FamiliarService,
  ) {}

  async executar(command: EnviarReceitaCommand): Promise<{ id: string }> {
    if (command.familiarId) {
      const permitido = await this.familiarService.podeAcessarFamiliar(
        command.clienteId,
        command.familiarId,
      );
      if (!permitido) {
        throw new ForbiddenException(
          'Este dependente não pertence ao seu Grupo Família.',
        );
      }
    }

    const arquivoUrl = await this.storagePort.uploadArquivo(
      command.nomeArquivo,
      command.buffer,
      command.mimetype,
    );

    const novoOrcamento = new Orcamento(
      randomUUID(),
      command.clienteId,
      arquivoUrl,
      'PENDENTE',
      command.observacoes,
      command.familiarId,
    );

    await this.orcamentoRepository.salvar(novoOrcamento);

    for (const anexo of command.anexos ?? []) {
      const anexoUrl = await this.storagePort.uploadArquivo(
        anexo.nomeArquivo,
        anexo.buffer,
        anexo.mimetype,
      );
      await this.prisma.orcamentoAnexo.create({
        data: {
          orcamentoId: novoOrcamento.id,
          arquivoUrl: anexoUrl,
          nomeArquivo: anexo.nomeArquivo,
        },
      });
    }

    if (command.itens && command.itens.length > 0) {
      for (const item of command.itens) {
        const produto = await this.prisma.produto.findUnique({
          where: { id: item.produtoId },
        });
        if (!produto || !produto.ativo) continue;

        await this.prisma.orcamentoItem.create({
          data: {
            orcamentoId: novoOrcamento.id,
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: produto.preco,
          },
        });
      }
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: command.clienteId },
      select: { email: true },
    });
    if (usuario) {
      void this.notificacao.notificarStatus({
        email: usuario.email,
        pedidoId: novoOrcamento.id,
        status: 'PENDENTE',
      });
    }

    return { id: novoOrcamento.id };
  }
}
