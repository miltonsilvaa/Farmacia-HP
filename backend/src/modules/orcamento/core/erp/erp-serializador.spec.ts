import { serializarPedido } from './erp-serializador';
import { PedidoErp } from '../ports/out/erp.port';

const pedido: PedidoErp = {
  pedido: {
    id: 'id-1',
    numero: 'ABC12345',
    criadoEm: '2026-09-28T12:00:00.000Z',
    status: 'PRODUCAO',
    observacoes: 'Cápsulas <veganas> & "sem" glúten',
    respostaFarmacia: null,
    posologia: '10 gotas 2x ao dia',
    valorTotal: '89.90',
  },
  cliente: { id: 'u1', email: 'cliente@exemplo.com' },
  paciente: {
    tipo: 'PET',
    nome: 'Thor',
    parentesco: 'Pet',
    especie: 'Cão',
    dataNascimento: null,
  },
  itens: [
    {
      produtoId: 'p1',
      nome: 'Arnica',
      quantidade: 2,
      precoUnitario: '10.00',
      subtotal: '20.00',
    },
    {
      produtoId: 'p2',
      nome: 'Calêndula',
      quantidade: 1,
      precoUnitario: '5.00',
      subtotal: '5.00',
    },
  ],
  arquivos: [
    {
      tipo: 'RECEITA',
      nomeArquivo: 'r.pdf',
      mimetype: 'application/pdf',
      conteudoBase64: 'SGVsbG8=',
    },
  ],
};

describe('serializarPedido', () => {
  it('gera JSON que volta ao mesmo objeto', () => {
    expect(JSON.parse(serializarPedido(pedido, 'json'))).toEqual(pedido);
  });

  describe('XML', () => {
    const xml = serializarPedido(pedido, 'xml');

    it('tem declaração e elemento raiz', () => {
      expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(
        true,
      );
      expect(xml).toContain('<pedidoFarmacia>');
      expect(xml.trim().endsWith('</pedidoFarmacia>')).toBe(true);
    });

    it('escapa caracteres especiais do texto livre', () => {
      expect(xml).toContain(
        '<observacoes>Cápsulas &lt;veganas&gt; &amp; &quot;sem&quot; glúten</observacoes>',
      );
    });

    it('usa item/arquivo como elemento de cada posição das listas', () => {
      expect(xml.match(/<item>/g)).toHaveLength(2);
      expect(xml.match(/<arquivo>/g)).toHaveLength(1);
    });

    it('representa nulos como elemento vazio', () => {
      expect(xml).toContain('<respostaFarmacia/>');
    });
  });
});
