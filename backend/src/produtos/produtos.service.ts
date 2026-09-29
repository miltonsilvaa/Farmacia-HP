import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

// Copia só os campos conhecidos (campo extra no corpo virava erro 500 no Prisma)
// e barra valores inválidos com 400
function validarProduto(entrada: Partial<DadosProduto>, criando: boolean) {
  const dados: Partial<Omit<DadosProduto, 'relacionadosIds'>> = {};
  const { nome, descricao, preco, estoque, imagemUrl, ativo } = entrada ?? {};

  if (criando || nome !== undefined) {
    if (typeof nome !== 'string' || !nome.trim()) {
      throw new BadRequestException('Informe o nome do produto.');
    }
    dados.nome = nome.trim();
  }
  if (criando || preco !== undefined) {
    if (typeof preco !== 'number' || !Number.isFinite(preco) || preco < 0) {
      throw new BadRequestException('Informe um preço válido (zero ou mais).');
    }
    dados.preco = preco;
  }
  if (estoque !== undefined) {
    if (!Number.isInteger(estoque) || estoque < 0) {
      throw new BadRequestException(
        'O estoque deve ser um número inteiro, zero ou mais.',
      );
    }
    dados.estoque = estoque;
  }
  if (descricao !== undefined) dados.descricao = descricao || undefined;
  if (imagemUrl !== undefined) dados.imagemUrl = imagemUrl || undefined;
  if (ativo !== undefined) dados.ativo = Boolean(ativo);

  const relacionadosIds = entrada?.relacionadosIds;
  if (
    relacionadosIds !== undefined &&
    (!Array.isArray(relacionadosIds) ||
      relacionadosIds.some((id) => typeof id !== 'string'))
  ) {
    throw new BadRequestException('Produtos complementares inválidos.');
  }
  return { dados, relacionadosIds };
}

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(entrada: DadosProduto) {
    const { dados, relacionadosIds } = validarProduto(entrada, true);
    return await this.prisma.produto.create({
      data: {
        ...(dados as DadosProduto),
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

  async atualizar(id: string, entrada: Partial<DadosProduto>) {
    const { dados, relacionadosIds } = validarProduto(entrada, false);
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
