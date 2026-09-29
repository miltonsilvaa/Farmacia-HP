import { Type } from '@nestjs/common';
import { ErpPort } from '../../../core/ports/out/erp.port';
import { HttpErpAdapter } from './http-erp.adapter';
import { ArquivoErpAdapter } from './arquivo-erp.adapter';
import { MockErpAdapter } from './mock-erp.adapter';

const ADAPTERS: Record<string, Type<ErpPort>> = {
  mock: MockErpAdapter,
  arquivo: ArquivoErpAdapter,
  http: HttpErpAdapter,
};

// ERP_MODO escolhe o adapter (mock | arquivo | http). Sem ERP_MODO mantém o
// comportamento anterior: http se houver ERP_URL, senão arquivo.
// Compara o texto exato: ler a variável como booleano faria "false" virar verdadeiro.
export function escolherErpAdapter(
  env: NodeJS.ProcessEnv = process.env,
): Type<ErpPort> {
  const modo = env.ERP_MODO?.trim().toLowerCase();
  if (modo) {
    const adapter = ADAPTERS[modo];
    if (!adapter) {
      throw new Error(
        `ERP_MODO inválido: "${env.ERP_MODO}". Use mock, arquivo ou http.`,
      );
    }
    if (adapter === HttpErpAdapter && !env.ERP_URL) {
      throw new Error('ERP_MODO=http exige ERP_URL.');
    }
    return adapter;
  }
  return env.ERP_URL ? HttpErpAdapter : ArquivoErpAdapter;
}
