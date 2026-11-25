import { Injectable, Logger } from '@nestjs/common';
import {
  ErpIntegrationPort,
  PedidoErp,
} from '../../../core/ports/out/erp-integration.port';

// ERP simulado em memória: responde na hora, não usa rede nem disco.
// Para testes automatizados e para desenvolver sem nenhum ERP.
@Injectable()
export class ErpMockAdapter implements ErpIntegrationPort {
  private readonly logger = new Logger(ErpMockAdapter.name);
  readonly enviados: PedidoErp[] = [];

  enviarPedido(pedido: PedidoErp): Promise<void> {
    this.enviados.push(pedido);
    this.logger.log(`[ERP simulado] Pedido ${pedido.pedido.numero} recebido.`);
    return Promise.resolve();
  }
}
