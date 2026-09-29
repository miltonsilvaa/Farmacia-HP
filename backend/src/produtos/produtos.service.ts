import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface DadosProduto {
  nome: string;
  descricao?: string;
  preco: number;
  estoque?: number;
  imagemUrl?: string;
  ativo?: boolean;
  relacionadosIds?: string[];
}

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  criar({ relacionadosIds, ...dados }: DadosProduto) {
    return this.prisma.produto.create({
      data: {
        ...dados,
        ...(relacionadosIds && {
          relacionados: { connect: relacionadosIds.map((id) => ({ id })) },
        }),
      },
    });
  }

  async listarAdmin() {
    const produtos = await this.prisma.produto.findMany({
      orderBy: { nome: 'asc' },
      include: {
        relacionados: { select: { id: true } },
        relacionadoPor: { select: { id: true } },
      },
    });
    // A relação vale nos dois sentidos: junta os dois lados num só campo
    return produtos.map(({ relacionados, relacionadoPor, ...p }) => ({
      ...p,
      relacionadosIds: [
        ...new Set([...relacionados, ...relacionadoPor].map((r) => r.id)),
      ],
    }));
  }

  // Complementares dos produtos informados, sem repetir os que já estão no pedido
  async sugestoes(ids: string[]) {
    if (ids.length === 0) return [];
    return this.prisma.produto.findMany({
      where: {
        ativo: true,
        id: { notIn: ids },
        OR: [
          { relacionados: { some: { id: { in: ids } } } },
          { relacionadoPor: { some: { id: { in: ids } } } },
        ],
      },
      orderBy: { nome: 'asc' },
      take: 6,
    });
  }

  listarAtivos() {
    return this.prisma.produto.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async buscarUm(id: string) {
    const produto = await this.prisma.produto.findUnique({ where: { id } });
    if (!produto) throw new NotFoundException('Produto não encontrado.');
    return produto;
  }

  async atualizar(
    id: string,
    { relacionadosIds, ...dados }: Partial<DadosProduto>,
  ) {
    await this.buscarUm(id);
    if (relacionadosIds) {
      // Limpa os dois lados antes de gravar a nova lista
      await this.prisma.produto.update({
        where: { id },
        data: { relacionados: { set: [] }, relacionadoPor: { set: [] } },
      });
    }
    return this.prisma.produto.update({
      where: { id },
      data: {
        ...dados,
        ...(relacionadosIds && {
          relacionados: {
            connect: relacionadosIds
              .filter((r) => r !== id)
              .map((r) => ({ id: r })),
          },
        }),
      },
    });
  }

  async inativar(id: string) {
    await this.buscarUm(id);
    return this.prisma.produto.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
