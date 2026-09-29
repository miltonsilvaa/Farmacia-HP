import { ErpMockAdapter } from './erp-mock.adapter';
import { PedidoErp } from '../../../core/ports/out/erp-integration.port';

describe('ErpMockAdapter', () => {
  it('responde na hora e guarda cada pedido recebido, na ordem', async () => {
    const erp = new ErpMockAdapter();
    const pedido = (numero: string) =>
      ({ pedido: { numero } }) as unknown as PedidoErp;

    await expect(erp.enviarPedido(pedido('A'))).resolves.toBeUndefined();
    await erp.enviarPedido(pedido('B'));

    expect(erp.enviados.map((p) => p.pedido.numero)).toEqual(['A', 'B']);
  });
});
