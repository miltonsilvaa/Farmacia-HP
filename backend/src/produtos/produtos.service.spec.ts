import { NotFoundException } from '@nestjs/common';
import { ProdutosService } from './produtos.service';

function criarPrisma() {
  return {
    produto: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ id: 'p1' }),
      create: jest.fn(({ data }) => Promise.resolve({ id: 'novo', ...data })),
      update: jest.fn(({ data }) => Promise.resolve(data)),
    },
  };
}

describe('ProdutosService', () => {
  let prisma: ReturnType<typeof criarPrisma>;
  let service: ProdutosService;

  beforeEach(() => {
    prisma = criarPrisma();
    service = new ProdutosService(prisma as any);
  });

  describe('produtos complementares', () => {
    it('sem produtos no pedido não consulta nada', async () => {
      await expect(service.sugestoes([])).resolves.toEqual([]);
      expect(prisma.produto.findMany).not.toHaveBeenCalled();
    });

    it('sugere ativos ligados nos dois sentidos, sem repetir os do pedido', async () => {
      await service.sugestoes(['a', 'b']);
      expect(prisma.produto.findMany.mock.calls[0][0].where).toEqual({
        ativo: true,
        id: { notIn: ['a', 'b'] },
        OR: [
          { relacionados: { some: { id: { in: ['a', 'b'] } } } },
          { relacionadoPor: { some: { id: { in: ['a', 'b'] } } } },
        ],
      });
    });

    it('a listagem do admin junta os dois lados da relação sem duplicar', async () => {
      prisma.produto.findMany.mockResolvedValue([
        {
          id: 'p1',
          nome: 'A',
          relacionados: [{ id: 'x' }, { id: 'y' }],
          relacionadoPor: [{ id: 'y' }, { id: 'z' }],
        },
      ]);
      const [p] = await service.listarAdmin();
      expect(p.relacionadosIds.sort()).toEqual(['x', 'y', 'z']);
      expect(p).not.toHaveProperty('relacionadoPor');
    });

    it('ao atualizar, limpa a relação antiga e não liga o produto a ele mesmo', async () => {
      await service.atualizar('p1', {
        nome: 'Novo',
        relacionadosIds: ['p1', 'p2'],
      });

      expect(prisma.produto.update.mock.calls[0][0].data).toEqual({
        relacionados: { set: [] },
        relacionadoPor: { set: [] },
      });
      expect(prisma.produto.update.mock.calls[1][0].data).toEqual({
        nome: 'Novo',
        relacionados: { connect: [{ id: 'p2' }] },
      });
    });

    it('atualizar sem relacionadosIds mantém a relação como está', async () => {
      await service.atualizar('p1', { preco: 10 });
      expect(prisma.produto.update).toHaveBeenCalledTimes(1);
      expect(prisma.produto.update.mock.calls[0][0].data).toEqual({
        preco: 10,
      });
    });
  });

  describe('validação dos dados', () => {
    it('grava só os campos conhecidos', async () => {
      await service.criar({
        nome: ' Arnica ',
        preco: 10,
        id: 'forjado',
        criadoEm: 'x',
      } as any);
      expect(prisma.produto.create.mock.calls[0][0].data).toEqual({
        nome: 'Arnica',
        preco: 10,
      });
    });

    it.each([
      [{ nome: '', preco: 10 }, 'nome'],
      [{ nome: 'A', preco: -1 }, 'preço'],
      [{ nome: 'A', preco: 'dez' }, 'preço'],
      [{ nome: 'A', preco: 1, estoque: 1.5 }, 'estoque'],
      [{ nome: 'A', preco: 1, relacionadosIds: 'p2' }, 'complementares'],
    ])('recusa %j', async (dados, trecho) => {
      await expect(service.criar(dados as any)).rejects.toThrow(trecho);
      expect(prisma.produto.create).not.toHaveBeenCalled();
    });

    it('na edição só valida o que foi enviado', async () => {
      await expect(
        service.atualizar('p1', { estoque: 5 }),
      ).resolves.toBeDefined();
      await expect(service.atualizar('p1', { preco: -3 })).rejects.toThrow(
        'preço',
      );
    });
  });

  it('produto inexistente vira 404', async () => {
    prisma.produto.findUnique.mockResolvedValue(null);
    await expect(service.inativar('nao-existe')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('inativar não apaga, só marca como inativo', async () => {
    await service.inativar('p1');
    expect(prisma.produto.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { ativo: false },
    });
  });
});
