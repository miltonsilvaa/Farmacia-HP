import { ErpEntradaController } from './erp-entrada.controller';

describe('ErpEntradaController', () => {
  it('repassa a posologia enviada pelo ERP para o pedido e devolve o formato da interface', async () => {
    const orcamentoService = {
      definirPosologia: jest
        .fn()
        .mockResolvedValue({ id: 'p1', posologia: '10 gotas 2x ao dia' }),
    };
    const controller = new ErpEntradaController(orcamentoService as any);

    const r = await controller.definirPosologia('p1', {
      posologia: '10 gotas 2x ao dia',
    });

    expect(orcamentoService.definirPosologia).toHaveBeenCalledWith(
      'p1',
      '10 gotas 2x ao dia',
    );
    expect(r).toEqual({ id: 'p1', posologia: '10 gotas 2x ao dia' });
  });
});
