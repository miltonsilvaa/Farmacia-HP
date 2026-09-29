import { FormatoErp, PedidoErp } from '../ports/out/erp.port';

// Nome do elemento de cada item de lista no XML
const ITEM_DE_LISTA: Record<string, string> = {
  itens: 'item',
  arquivos: 'arquivo',
};

function escaparXml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function paraElementos(valor: unknown, nome: string, nivel: number): string {
  const recuo = '  '.repeat(nivel);
  if (valor === null || valor === undefined) return `${recuo}<${nome}/>\n`;
  if (Array.isArray(valor)) {
    const filho = ITEM_DE_LISTA[nome] ?? 'item';
    const conteudo = valor
      .map((v) => paraElementos(v, filho, nivel + 1))
      .join('');
    return `${recuo}<${nome}>\n${conteudo}${recuo}</${nome}>\n`;
  }
  if (typeof valor === 'object') {
    const conteudo = Object.entries(valor as Record<string, unknown>)
      .map(([chave, v]) => paraElementos(v, chave, nivel + 1))
      .join('');
    return `${recuo}<${nome}>\n${conteudo}${recuo}</${nome}>\n`;
  }
  return `${recuo}<${nome}>${escaparXml(String(valor as string | number | boolean))}</${nome}>\n`;
}

export function serializarPedido(
  pedido: PedidoErp,
  formato: FormatoErp,
): string {
  if (formato === 'xml') {
    return `<?xml version="1.0" encoding="UTF-8"?>\n${paraElementos(pedido, 'pedidoFarmacia', 0)}`;
  }
  return JSON.stringify(pedido, null, 2);
}

export function formatoConfigurado(): FormatoErp {
  return process.env.ERP_FORMATO === 'xml' ? 'xml' : 'json';
}

export const CONTENT_TYPE: Record<FormatoErp, string> = {
  json: 'application/json; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
};
