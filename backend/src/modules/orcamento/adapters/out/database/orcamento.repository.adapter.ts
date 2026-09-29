import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { OrcamentoRepositoryPort } from '../../../core/ports/out/orcamento.repository.port';
import { Orcamento } from '../../../core/entities/orcamento.entity';

@Injectable()
export class OrcamentoRepositoryAdapter implements OrcamentoRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async salvar(orcamento: Orcamento): Promise<void> {
    await this.prisma.orcamento.upsert({
      where: { id: orcamento.id },
      update: {
        clienteId: orcamento.clienteId,
        familiarId: orcamento.familiarId ?? null,
        arquivoReceitaUrl: orcamento.arquivoReceitaUrl,
        status: orcamento.status,
        observacoes: orcamento.observacoes,
      },
      create: {
        id: orcamento.id,
        clienteId: orcamento.clienteId,
        familiarId: orcamento.familiarId ?? null,
        arquivoReceitaUrl: orcamento.arquivoReceitaUrl,
        status: orcamento.status,
        observacoes: orcamento.observacoes,
      },
    });
  }
}
