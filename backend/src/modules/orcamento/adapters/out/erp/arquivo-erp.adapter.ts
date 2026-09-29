import { Injectable, Logger } from '@nestjs/common';
import { mkdir, rename, writeFile } from 'fs/promises';
import { join } from 'path';
import { ErpPort, PedidoErp } from '../../../core/ports/out/erp.port';
import { formatoConfigurado, serializarPedido } from '../../../core/erp/erp-serializador';

// Sem ERP_URL: grava um arquivo por pedido numa pasta de saída que o ERP legado
// importa (troca por arquivo). Escreve em .tmp e renomeia, para o ERP nunca ler
// um arquivo pela metade.
@Injectable()
export class ArquivoErpAdapter implements ErpPort {
  private readonly logger = new Logger(ArquivoErpAdapter.name);
  private readonly pasta = process.env.ERP_PASTA_SAIDA || join(process.cwd(), 'erp-saida');

  async enviarPedido(pedido: PedidoErp): Promise<void> {
    const formato = formatoConfigurado();
    await mkdir(this.pasta, { recursive: true });
    const destino = join(this.pasta, `pedido-${pedido.pedido.numero}.${formato}`);
    await writeFile(`${destino}.tmp`, serializarPedido(pedido, formato), 'utf-8');
    await rename(`${destino}.tmp`, destino);
    this.logger.log(`Pedido ${pedido.pedido.numero} exportado para ${destino}`);
  }
}
