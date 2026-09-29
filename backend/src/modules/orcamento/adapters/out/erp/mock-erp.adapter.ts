import { Injectable, Logger } from '@nestjs/common';
import { ErpPort, PedidoErp } from '../../../core/ports/out/erp.port';

// ERP simulado em memória: responde na hora, não usa rede nem disco.
// Para testes automatizados e para desenvolver sem nenhum ERP.
@Injectable()
export class MockErpAdapter implements ErpPort {
  private readonly logger = new Logger(MockErpAdapter.name);
  readonly enviados: PedidoErp[] = [];

  enviarPedido(pedido: PedidoErp): Promise<void> {
    this.enviados.push(pedido);
    this.logger.log(`[ERP simulado] Pedido ${pedido.pedido.numero} recebido.`);
    return Promise.resolve();
  }
}
