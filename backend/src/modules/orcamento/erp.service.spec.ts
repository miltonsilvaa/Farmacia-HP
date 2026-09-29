import { Prisma } from '@prisma/client';
import { ErpService } from './erp.service';
import { ErpMockAdapter } from './adapters/out/erp/erp-mock.adapter';

const pedidoBanco = {
  id: 'abcdef12-0000',
  criadoEm: new Date('2026-09-01T10:00:00Z'),
  status: 'PRODUCAO',
  observacoes: null,
  respostaAdmin: 'Pronto em 3 dias',
  posologia: '10 gotas 2x ao dia',
  preco: new Prisma.Decimal('45.5'),
  arquivoReceitaUrl: 'hash-receita.pdf',
  usuario: { id: 'u1', email: 'cliente@x.com' },
  familiar: null,
  itens: [
    {
      produtoId: 'p1',
      quantidade: 3,
      precoUnitario: new Prisma.Decimal('10'),
      produto: { nome: 'Arnica' },
    },
  ],
  anexos: [{ arquivoUrl: 'hash-exame.pdf', nomeArquivo: 'exame.pdf' }],
};

function criar(erp = new ErpMockAdapter()) {
  const prisma = {
    orcamento: {
      findUnique: jest.fn().mockResolvedValue(pedidoBanco),
      update: jest.fn(({ data }) => Promise.resolve(data)),
    },
  };
  const storage = {
    baixarArquivo: jest.fn().mockResolvedValue({
      buffer: Buffer.from('conteudo'),
      mimetype: 'application/pdf',
    }),
  };
  return {
    service: new ErpService(prisma as any, storage as any, erp),
    prisma,
    erp,
  };
}

describe('ErpService', () => {
  it('monta o pedido completo e registra o envio', async () => {
    const { service, prisma, erp } = criar();

    const r = await service.sincronizar(pedidoBanco.id);

    expect(r.erpStatus).toBe('ENVIADO');
    const enviado = erp.enviados[0];
    expect(enviado.pedido).toMatchObject({
      numero: 'ABCDEF12',
      valorTotal: '45.50',
      posologia: '10 gotas 2x ao dia',
    });
    expect(enviado.paciente.tipo).toBe('TITULAR');
    expect(enviado.itens[0]).toMatchObject({
      nome: 'Arnica',
      precoUnitario: '10.00',
      subtotal: '30.00',
    });
    expect(enviado.arquivos.map((a) => a.tipo)).toEqual(['RECEITA', 'ANEXO']);
    expect(enviado.arquivos[0].conteudoBase64).toBe(
      Buffer.from('conteudo').toString('base64'),
    );
    expect(prisma.orcamento.update.mock.calls[0][0].data.erpErro).toBeNull();
  });

  it('falha no ERP fica registrada no pedido e não lança erro', async () => {
    const erpForaDoAr = {
      enviarPedido: jest.fn().mockRejectedValue(new Error('ERP respondeu 503')),
    };
    const { service } = criar(erpForaDoAr as any);

    const r = await service.sincronizar(pedidoBanco.id);

    expect(r.erpStatus).toBe('ERRO');
    expect(r.erpErro).toBe('ERP respondeu 503');
  });

  it('exporta com o nome de arquivo do pedido', async () => {
    const { service } = criar();
    const { nomeArquivo, conteudo } = await service.exportar(
      pedidoBanco.id,
      'xml',
    );
    expect(nomeArquivo).toBe('pedido-ABCDEF12.xml');
    expect(conteudo).toContain('<posologia>10 gotas 2x ao dia</posologia>');
  });

  describe('mapeamento do paciente', () => {
    it.each([
      [
        'dependente',
        {
          tipo: 'PESSOA',
          nome: 'Ana',
          parentesco: 'Filho(a)',
          especie: null,
          dataNascimento: new Date('2015-03-09T00:00:00Z'),
        },
        {
          tipo: 'DEPENDENTE',
          nome: 'Ana',
          parentesco: 'Filho(a)',
          especie: null,
          dataNascimento: '2015-03-09',
        },
      ],
      [
        'pet',
        {
          tipo: 'PET',
          nome: 'Thor',
          parentesco: 'Pet',
          especie: 'Cão',
          dataNascimento: null,
        },
        {
          tipo: 'PET',
          nome: 'Thor',
          parentesco: 'Pet',
          especie: 'Cão',
          dataNascimento: null,
        },
      ],
    ])('%s', async (_caso, familiar, esperado) => {
      const { service, prisma, erp } = criar();
      prisma.orcamento.findUnique.mockResolvedValue({
        ...pedidoBanco,
        familiar,
      });

      await service.sincronizar(pedidoBanco.id);

      expect(erp.enviados[0].paciente).toEqual(esperado);
    });
  });

  it('pedido sem preço, produtos nem anexos ainda gera um payload válido', async () => {
    const { service, prisma, erp } = criar();
    prisma.orcamento.findUnique.mockResolvedValue({
      ...pedidoBanco,
      preco: null,
      itens: [],
      anexos: [],
    });

    await service.sincronizar(pedidoBanco.id);

    const enviado = erp.enviados[0];
    expect(enviado.pedido.valorTotal).toBeNull();
    expect(enviado.itens).toEqual([]);
    expect(enviado.arquivos).toHaveLength(1); // só a receita
  });

  it('devolve só os campos de status do ERP que a tela do admin usa', async () => {
    const { service, prisma } = criar();
    await service.sincronizar(pedidoBanco.id);
    expect(prisma.orcamento.update.mock.calls[0][0].select).toEqual({
      id: true,
      erpStatus: true,
      erpEnviadoEm: true,
      erpErro: true,
    });
  });

  it('pedido inexistente vira 404 (não é registrado como falha do ERP)', async () => {
    const { service, prisma } = criar();
    prisma.orcamento.findUnique.mockResolvedValue(null);
    await expect(service.sincronizar('nao-existe')).rejects.toThrow(
      'Pedido não encontrado',
    );
    expect(prisma.orcamento.update).not.toHaveBeenCalled();
  });
});
