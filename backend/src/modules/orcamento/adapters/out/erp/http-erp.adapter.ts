import { Injectable } from '@nestjs/common';
import { ErpPort, PedidoErp } from '../../../core/ports/out/erp.port';
import { CONTENT_TYPE, formatoConfigurado, serializarPedido } from '../../../core/erp/erp-serializador';

// Envia o pedido para a API do ERP (ERP_URL). Usa o id do pedido como chave de
// idempotência, para o ERP ignorar reenvios do mesmo pedido.
@Injectable()
export class HttpErpAdapter implements ErpPort {
  async enviarPedido(pedido: PedidoErp): Promise<void> {
    const formato = formatoConfigurado();
    const resposta = await fetch(process.env.ERP_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': CONTENT_TYPE[formato],
        'Idempotency-Key': pedido.pedido.id,
        ...(process.env.ERP_TOKEN && { Authorization: `Bearer ${process.env.ERP_TOKEN}` }),
      },
      body: serializarPedido(pedido, formato),
      signal: AbortSignal.timeout(15_000),
    });
    if (!resposta.ok) {
      throw new Error(`ERP respondeu ${resposta.status} ${resposta.statusText}`);
    }
  }
}
