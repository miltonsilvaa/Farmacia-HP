import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrcamentoService } from './orcamento.service';

// Prisma falso: cada teste define o que as consultas devolvem
function criarPrisma() {
  return {
    orcamento: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(({ where, data }) =>
        Promise.resolve({ id: where.id, clienteId: 'u1', ...data }),
      ),
      create: jest.fn(({ data }) => Promise.resolve({ id: 'novo', ...data })),
    },
    produto: { findMany: jest.fn().mockResolvedValue([]) },
    usuario: {
      findUnique: jest.fn().mockResolvedValue({ email: 'cliente@exemplo.com' }),
    },
  };
}

function criarServico(titulares: string[] = []) {
  const prisma = criarPrisma();
  const storage = {
    gerarUrlAssinada: jest.fn((k: string) => Promise.resolve(`url:${k}`)),
    uploadArquivo: jest.fn((nome: string) => Promise.resolve(`key-${nome}`)),
  };
  const familiarPodeAcessar = jest.fn().mockResolvedValue(true);
  const notificacao = {
    notificarStatus: jest.fn().mockResolvedValue(undefined),
  };
  const familiarService = {
    titularesAcessiveis: jest.fn().mockResolvedValue(titulares),
    podeAcessarFamiliar: familiarPodeAcessar,
  };
  const erpService = { sincronizar: jest.fn().mockResolvedValue(undefined) };
  const service = new OrcamentoService(
    prisma as any,
    storage as any,
    notificacao as any,
    familiarService as any,
    erpService as any,
  );
  return {
    service,
    prisma,
    notificacao,
    erpService,
    storage,
    familiarPodeAcessar,
  };
}

describe('OrcamentoService', () => {
  describe('avaliarOrcamento (transições do admin)', () => {
    it.each([
      ['PENDENTE', 'AGUARDANDO_PAGAMENTO'],
      ['PENDENTE', 'RECUSADO'],
      ['PRODUCAO', 'FINALIZADO'],
      ['FINALIZADO', 'ENTREGUE'],
    ])('permite %s → %s e avisa o cliente', async (de, para) => {
      const { service, prisma, notificacao } = criarServico();
      prisma.orcamento.findUnique.mockResolvedValue({ id: 'p1', status: de });

      await service.avaliarOrcamento('p1', para, 50);

      expect(prisma.orcamento.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: para }),
        }),
      );
      expect(notificacao.notificarStatus).toHaveBeenCalled();
    });

    it.each([
      ['PENDENTE', 'FINALIZADO'],
      ['PENDENTE', 'ENTREGUE'],
      ['PRODUCAO', 'RECUSADO'],
      ['CANCELADO', 'AGUARDANDO_PAGAMENTO'],
    ])('bloqueia %s → %s', async (de, para) => {
      const { service, prisma } = criarServico();
      prisma.orcamento.findUnique.mockResolvedValue({ id: 'p1', status: de });

      await expect(service.avaliarOrcamento('p1', para)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.orcamento.update).not.toHaveBeenCalled();
    });

    it.each([undefined, 0, -5, NaN])(
      'enviar orçamento exige preço maior que zero (%s)',
      async (preco) => {
        const { service, prisma } = criarServico();
        prisma.orcamento.findUnique.mockResolvedValue({
          id: 'p1',
          status: 'PENDENTE',
        });
        await expect(
          service.avaliarOrcamento('p1', 'AGUARDANDO_PAGAMENTO', preco),
        ).rejects.toThrow('preço');
        expect(prisma.orcamento.update).not.toHaveBeenCalled();
      },
    );

    it('recusa status desconhecido', async () => {
      const { service, prisma } = criarServico();
      prisma.orcamento.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'PENDENTE',
      });
      await expect(service.avaliarOrcamento('p1', 'QUALQUER')).rejects.toThrow(
        'Status inválido',
      );
    });

    it('grava a posologia sem espaços e trata texto vazio como remoção', async () => {
      const { service, prisma } = criarServico();
      prisma.orcamento.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'PENDENTE',
      });

      await service.avaliarOrcamento(
        'p1',
        'AGUARDANDO_PAGAMENTO',
        50,
        undefined,
        '  10 gotas  ',
      );
      expect(prisma.orcamento.update.mock.calls[0][0].data.posologia).toBe(
        '10 gotas',
      );

      await service.avaliarOrcamento(
        'p1',
        'AGUARDANDO_PAGAMENTO',
        50,
        undefined,
        '   ',
      );
      expect(
        prisma.orcamento.update.mock.calls[1][0].data.posologia,
      ).toBeNull();
    });
  });

  describe('responderCliente', () => {
    it('aprovar leva para PRODUCAO e envia ao ERP', async () => {
      const { service, prisma, erpService } = criarServico();
      prisma.orcamento.findFirst.mockResolvedValue({
        id: 'p1',
        clienteId: 'u1',
        status: 'AGUARDANDO_PAGAMENTO',
      });

      const r = await service.responderCliente('p1', 'APROVAR', 'u1');

      expect(r.status).toBe('PRODUCAO');
      expect(erpService.sincronizar).toHaveBeenCalledWith('p1');
    });

    it('recusar leva para CANCELADO e não envia ao ERP', async () => {
      const { service, prisma, erpService } = criarServico();
      prisma.orcamento.findFirst.mockResolvedValue({
        id: 'p1',
        clienteId: 'u1',
        status: 'AGUARDANDO_PAGAMENTO',
      });

      const r = await service.responderCliente('p1', 'RECUSAR', 'u1');

      expect(r.status).toBe('CANCELADO');
      expect(erpService.sincronizar).not.toHaveBeenCalled();
    });

    it('ação diferente de APROVAR/RECUSAR não cancela o pedido', async () => {
      const { service, prisma } = criarServico();
      prisma.orcamento.findFirst.mockResolvedValue({
        id: 'p1',
        clienteId: 'u1',
        status: 'AGUARDANDO_PAGAMENTO',
      });
      await expect(service.responderCliente('p1', 'xyz', 'u1')).rejects.toThrow(
        'Ação inválida',
      );
      expect(prisma.orcamento.update).not.toHaveBeenCalled();
    });

    it('só responde orçamento aguardando pagamento', async () => {
      const { service, prisma } = criarServico();
      prisma.orcamento.findFirst.mockResolvedValue({
        id: 'p1',
        clienteId: 'u1',
        status: 'PENDENTE',
      });
      await expect(
        service.responderCliente('p1', 'APROVAR', 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('pedido fora do alcance do usuário vira 404', async () => {
      const { service, prisma } = criarServico();
      prisma.orcamento.findFirst.mockResolvedValue(null);
      await expect(
        service.responderCliente('p1', 'APROVAR', 'intruso'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('controle de acesso do Grupo Família', () => {
    it('lista pedidos próprios e dos dependentes dos titulares que compartilharam', async () => {
      const { service, prisma } = criarServico(['titular-A']);

      await service.listarPorUsuario('u1');

      expect(prisma.orcamento.findMany.mock.calls[0][0].where).toEqual({
        OR: [
          { clienteId: 'u1' },
          { familiar: { usuarioId: { in: ['u1', 'titular-A'] } } },
        ],
      });
    });

    it('não expõe o e-mail de quem pediu quando foi o próprio usuário', async () => {
      const { service, prisma } = criarServico(['titular-A']);
      prisma.orcamento.findMany.mockResolvedValue([
        {
          id: 'p1',
          clienteId: 'u1',
          arquivoReceitaUrl: 'r1',
          anexos: [],
          usuario: { email: 'eu@x.com' },
        },
        {
          id: 'p2',
          clienteId: 'outro',
          arquivoReceitaUrl: 'r2',
          anexos: [],
          usuario: { email: 'conjuge@x.com' },
        },
      ]);

      const [meu, daFamilia] = await service.listarPorUsuario('u1');

      expect(meu.solicitadoPor).toBeNull();
      expect(daFamilia.solicitadoPor).toBe('conjuge@x.com');
      expect(meu.arquivoReceitaUrl).toBe('url:r1');
    });
  });

  describe('renovarPedido', () => {
    const original = {
      id: 'p1',
      clienteId: 'u1',
      familiarId: 'f1',
      status: 'ENTREGUE',
      arquivoReceitaUrl: 'receita.pdf',
      posologia: '10 gotas 2x ao dia',
      observacoes: '[Renovação] Sem lactose',
      itens: [
        { produtoId: 'ativo', quantidade: 2 },
        { produtoId: 'inativo', quantidade: 1 },
      ],
      anexos: [{ arquivoUrl: 'exame.pdf', nomeArquivo: 'exame.pdf' }],
    };

    it('copia receita, paciente, posologia, anexos e só os produtos ativos com preço atual', async () => {
      const { service, prisma } = criarServico();
      prisma.orcamento.findFirst.mockResolvedValue(original);
      prisma.produto.findMany.mockResolvedValue([{ id: 'ativo', preco: 12.5 }]);

      const r = await service.renovarPedido('p1', 'u1');
      const data = prisma.orcamento.create.mock.calls[0][0].data;

      expect(data).toMatchObject({
        clienteId: 'u1',
        familiarId: 'f1',
        arquivoReceitaUrl: 'receita.pdf',
        posologia: '10 gotas 2x ao dia',
        status: 'PENDENTE',
        observacoes: '[Renovação] Sem lactose', // não acumula "[Renovação] [Renovação]"
      });
      expect(data.itens.create).toEqual([
        { produtoId: 'ativo', quantidade: 2, precoUnitario: 12.5 },
      ]);
      expect(data.anexos.create).toEqual([
        { arquivoUrl: 'exame.pdf', nomeArquivo: 'exame.pdf' },
      ]);
      expect(r.itensIndisponiveis).toBe(1);
    });

    it.each(['PRODUCAO', 'FINALIZADO', 'ENTREGUE'])(
      'renova pedido %s (aprovado pelo cliente)',
      async (status) => {
        const { service, prisma } = criarServico();
        prisma.orcamento.findFirst.mockResolvedValue({ ...original, status });
        await expect(service.renovarPedido('p1', 'u1')).resolves.toMatchObject({
          sucesso: true,
          novoId: 'novo',
        });
      },
    );

    it('membro da família renova pedido de dependente compartilhado, em nome próprio', async () => {
      const { service, prisma } = criarServico(['titular-A']);
      prisma.orcamento.findFirst.mockResolvedValue({
        ...original,
        clienteId: 'titular-A',
      });

      await service.renovarPedido('p1', 'membro');

      expect(prisma.orcamento.findFirst.mock.calls[0][0].where).toEqual({
        id: 'p1',
        OR: [
          { clienteId: 'membro' },
          { familiar: { usuarioId: { in: ['membro', 'titular-A'] } } },
        ],
      });
      // O novo pedido é de quem clicou; o paciente continua o mesmo
      expect(prisma.orcamento.create.mock.calls[0][0].data).toMatchObject({
        clienteId: 'membro',
        familiarId: 'f1',
      });
    });

    it('quem não tem acesso ao pedido não renova (404, nada é criado)', async () => {
      const { service, prisma } = criarServico();
      prisma.orcamento.findFirst.mockResolvedValue(null);
      await expect(service.renovarPedido('p1', 'estranho')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.orcamento.create).not.toHaveBeenCalled();
    });

    it('pedido sem produtos nem anexos renova só com a receita', async () => {
      const { service, prisma } = criarServico();
      prisma.orcamento.findFirst.mockResolvedValue({
        ...original,
        observacoes: null,
        itens: [],
        anexos: [],
      });

      const r = await service.renovarPedido('p1', 'u1');

      const data = prisma.orcamento.create.mock.calls[0][0].data;
      expect(data.itens.create).toEqual([]);
      expect(data.anexos.create).toEqual([]);
      expect(data.observacoes).toBe('[Renovação automática]');
      expect(r.itensIndisponiveis).toBe(0);
    });

    it.each(['PENDENTE', 'AGUARDANDO_PAGAMENTO', 'RECUSADO', 'CANCELADO'])(
      'não renova pedido %s',
      async (status) => {
        const { service, prisma } = criarServico();
        prisma.orcamento.findFirst.mockResolvedValue({ ...original, status });
        await expect(service.renovarPedido('p1', 'u1')).rejects.toThrow(
          BadRequestException,
        );
        expect(prisma.orcamento.create).not.toHaveBeenCalled();
      },
    );
  });

  describe('criarPedido', () => {
    const arquivo = (nome: string) => ({
      nomeArquivo: nome,
      buffer: Buffer.from('x'),
      mimetype: 'application/pdf',
    });

    it('sobe receita e anexos e grava tudo num único create, com preço do catálogo', async () => {
      const { service, prisma, storage, notificacao } = criarServico();
      prisma.produto.findMany.mockResolvedValue([{ id: 'ativo', preco: 20 }]);

      const r = await service.criarPedido({
        clienteId: 'u1',
        receita: arquivo('receita.pdf'),
        anexos: [arquivo('exame.pdf')],
        observacoes: 'Sem lactose',
        itens: [
          { produtoId: 'ativo', quantidade: 2 },
          { produtoId: 'inativo', quantidade: 1 },
        ],
      });

      expect(storage.uploadArquivo).toHaveBeenCalledTimes(2);
      expect(prisma.orcamento.create).toHaveBeenCalledTimes(1);
      expect(prisma.orcamento.create.mock.calls[0][0].data).toMatchObject({
        clienteId: 'u1',
        familiarId: null,
        arquivoReceitaUrl: 'key-receita.pdf',
        observacoes: 'Sem lactose',
        status: 'PENDENTE',
        anexos: {
          create: [{ nomeArquivo: 'exame.pdf', arquivoUrl: 'key-exame.pdf' }],
        },
        itens: {
          create: [{ produtoId: 'ativo', quantidade: 2, precoUnitario: 20 }],
        },
      });
      expect(r).toEqual({ id: 'novo' });
      expect(notificacao.notificarStatus).toHaveBeenCalled();
    });

    it.each([
      [[{ produtoId: 'p', quantidade: 0 }]],
      [[{ produtoId: 'p', quantidade: 1.5 }]],
      [[{ produtoId: 'p', quantidade: 100 }]],
      [[{ quantidade: 1 }]],
    ])('recusa itens inválidos antes de subir arquivos (%j)', async (itens) => {
      const { service, storage } = criarServico();
      await expect(
        service.criarPedido({
          clienteId: 'u1',
          receita: arquivo('r.pdf'),
          anexos: [],
          itens: itens as any,
        }),
      ).rejects.toThrow('Itens inválidos');
      expect(storage.uploadArquivo).not.toHaveBeenCalled();
    });

    it('dependente de fora do Grupo Família é proibido', async () => {
      const { service, storage, familiarPodeAcessar } = criarServico();
      familiarPodeAcessar.mockResolvedValue(false);
      await expect(
        service.criarPedido({
          clienteId: 'u1',
          familiarId: 'f-alheio',
          receita: arquivo('r.pdf'),
          anexos: [],
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(storage.uploadArquivo).not.toHaveBeenCalled();
    });
  });

  describe('definirPosologia (admin ou ERP)', () => {
    it('grava o texto sem espaços nas pontas e sem mudar o status', async () => {
      const { service, prisma, notificacao } = criarServico();
      prisma.orcamento.findUnique.mockResolvedValue({
        id: 'p1',
        status: 'PRODUCAO',
      });

      await service.definirPosologia('p1', '  10 gotas 2x ao dia ');

      expect(prisma.orcamento.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { posologia: '10 gotas 2x ao dia' },
        select: { id: true, posologia: true },
      });
      expect(notificacao.notificarStatus).not.toHaveBeenCalled();
    });

    it.each(['', '   ', null])(
      'texto vazio (%p) remove a posologia',
      async (texto) => {
        const { service, prisma } = criarServico();
        prisma.orcamento.findUnique.mockResolvedValue({ id: 'p1' });
        await service.definirPosologia('p1', texto);
        expect(prisma.orcamento.update.mock.calls[0][0].data).toEqual({
          posologia: null,
        });
      },
    );

    it('pedido inexistente vira 404', async () => {
      const { service, prisma } = criarServico();
      prisma.orcamento.findUnique.mockResolvedValue(null);
      await expect(service.definirPosologia('x', 'a')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
