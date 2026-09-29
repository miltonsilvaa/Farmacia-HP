export interface ItemCarrinho {
  produtoId: string;
  quantidade: number;
}

export interface ArquivoAnexo {
  nomeArquivo: string;
  buffer: Buffer;
  mimetype: string;
}

export interface EnviarReceitaCommand {
  clienteId: string;
  nomeArquivo: string;
  buffer: Buffer;
  mimetype: string;
  anexos?: ArquivoAnexo[];
  observacoes?: string;
  itens?: ItemCarrinho[];
  familiarId?: string;
}

export interface EnviarReceitaUseCasePort {
  executar(command: EnviarReceitaCommand): Promise<{ id: string }>;
}

// O símbolo de injeção de dependência do NestJS
export const ENVIAR_RECEITA_USE_CASE = Symbol('ENVIAR_RECEITA_USE_CASE');