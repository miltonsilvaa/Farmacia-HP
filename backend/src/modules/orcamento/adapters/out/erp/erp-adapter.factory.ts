import { Type } from '@nestjs/common';
import { ErpIntegrationPort } from '../../../core/ports/out/erp-integration.port';
import { ErpHttpAdapter } from './erp-http.adapter';
import { ErpArquivoAdapter } from './erp-arquivo.adapter';
import { ErpMockAdapter } from './erp-mock.adapter';

const ADAPTERS: Record<string, Type<ErpIntegrationPort>> = {
  mock: ErpMockAdapter,
  arquivo: ErpArquivoAdapter,
  http: ErpHttpAdapter,
};

// ERP_MODO escolhe o adapter (mock | arquivo | http). Sem ERP_MODO mantém o
// comportamento anterior: http se houver ERP_URL, senão arquivo.
// Compara o texto exato: ler a variável como booleano faria "false" virar verdadeiro.
export function escolherErpAdapter(
  env: NodeJS.ProcessEnv = process.env,
): Type<ErpIntegrationPort> {
  const modo = env.ERP_MODO?.trim().toLowerCase();
  if (modo) {
    const adapter = ADAPTERS[modo];
    if (!adapter) {
      throw new Error(
        `ERP_MODO inválido: "${env.ERP_MODO}". Use mock, arquivo ou http.`,
      );
    }
    if (adapter === ErpHttpAdapter && !env.ERP_URL) {
      throw new Error('ERP_MODO=http exige ERP_URL.');
    }
    return adapter;
  }
  return env.ERP_URL ? ErpHttpAdapter : ErpArquivoAdapter;
}
