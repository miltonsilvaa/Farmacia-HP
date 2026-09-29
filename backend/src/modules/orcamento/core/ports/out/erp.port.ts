export type FormatoErp = 'json' | 'xml';

// Contrato de dados enviado ao ERP legado (ver integracao-erp.md no repo de docs)
export interface PedidoErp {
  pedido: {
    id: string;
    numero: string;
    criadoEm: string;
    status: string;
    observacoes: string | null;
    respostaFarmacia: string | null;
    posologia: string | null;
    valorTotal: string | null;
  };
  cliente: { id: string; email: string };
  paciente: {
    tipo: 'TITULAR' | 'DEPENDENTE' | 'PET';
    nome: string | null;
    parentesco: string | null;
    especie: string | null;
    dataNascimento: string | null;
  };
  itens: {
    produtoId: string;
    nome: string;
    quantidade: number;
    precoUnitario: string;
    subtotal: string;
  }[];
  arquivos: {
    tipo: 'RECEITA' | 'ANEXO';
    nomeArquivo: string;
    mimetype: string;
    conteudoBase64: string;
  }[];
}

export interface ErpPort {
  enviarPedido(pedido: PedidoErp): Promise<void>;
}

export const ERP_PORT = Symbol('ERP_PORT');
