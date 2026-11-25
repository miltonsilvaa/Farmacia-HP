import { LembreteRecompraService } from './lembrete-recompra.service';

const candidato = {
  id: 'p1',
  clienteId: 'u1',
  familiarId: 'f1',
  criadoEm: new Date('2026-09-01'),
  usuario: { email: 'cliente@x.com' },
  familiar: { nome: 'Ana' },
};

function criar() {
  const prisma = {
    orcamento: {
      findMany: jest.fn().mockResolvedValue([candidato]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const notificacao = {
    lembrarRecompra: jest.fn().mockResolvedValue(undefined),
  };
  return {
    service: new LembreteRecompraService(prisma as any, notificacao as any),
    prisma,
    notificacao,
  };
}

describe('LembreteRecompraService', () => {
  const envOriginal = process.env;
  beforeEach(() => {
    process.env = {
      ...envOriginal,
      FRONTEND_URL: 'http://app',
      LEMBRETE_RECOMPRA_DIAS: '25',
    };
  });
  afterAll(() => {
    process.env = envOriginal;
  });

  it('envia o lembrete com link de renovação e marca o pedido', async () => {
    const { service, prisma, notificacao } = criar();

    const r = await service.enviarLembretes();

    expect(notificacao.lembrarRecompra).toHaveBeenCalledWith({
      email: 'cliente@x.com',
      pedidoId: 'p1',
      paciente: 'Ana',
      linkRenovar: 'http://app/meus-pedidos?renovar=p1',
    });
    expect(prisma.orcamento.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1' } }),
    );
    expect(r).toEqual({ candidatos: 1, enviados: 1 });
  });

  it('busca só pedidos aprovados, sem lembrete e dentro da janela de dias', async () => {
    const { service, prisma } = criar();
    const agora = Date.now();

    await service.enviarLembretes();

    const where = prisma.orcamento.findMany.mock.calls[0][0].where;
    expect(where.status).toEqual({
      in: ['PRODUCAO', 'FINALIZADO', 'ENTREGUE'],
    });
    expect(where.lembreteRecompraEm).toBeNull();
    const dias = (agora - where.criadoEm.lte.getTime()) / 86_400_000;
    expect(Math.round(dias)).toBe(25);
    expect(
      Math.round((where.criadoEm.lte - where.criadoEm.gte) / 86_400_000),
    ).toBe(15);
  });

  it('não envia se já existe pedido mais novo para o paciente, mas marca para não reavaliar', async () => {
    const { service, prisma, notificacao } = criar();
    prisma.orcamento.count.mockResolvedValue(1);

    const r = await service.enviarLembretes();

    expect(notificacao.lembrarRecompra).not.toHaveBeenCalled();
    expect(prisma.orcamento.update).toHaveBeenCalled();
    expect(r.enviados).toBe(0);
  });

  it('se o e-mail falhar, não marca (tenta de novo amanhã)', async () => {
    const { service, prisma, notificacao } = criar();
    notificacao.lembrarRecompra.mockRejectedValue(new Error('SMTP fora'));

    await service.enviarLembretes();

    expect(prisma.orcamento.update).not.toHaveBeenCalled();
  });
});
