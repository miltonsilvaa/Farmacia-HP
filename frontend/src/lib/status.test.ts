import { describe, expect, it } from 'vitest'
import { CLASSES_COR, PONTO_COR, STATUS, STATUS_RENOVAVEIS, infoStatus } from './status'

describe('infoStatus', () => {
  it('retorna o rótulo, a cor e o ícone cadastrados para um status conhecido', () => {
    const info = infoStatus('PRODUCAO')
    expect(info.rotulo).toBe('Em manipulação')
    expect(info.cor).toBe('azul')
  })

  it('cai num padrão seguro (cinza) para um status desconhecido, sem lançar erro', () => {
    const info = infoStatus('STATUS_QUE_NAO_EXISTE')
    expect(info.rotulo).toBe('STATUS_QUE_NAO_EXISTE')
    expect(info.cor).toBe('cinza')
  })
})

describe('STATUS_RENOVAVEIS', () => {
  it('só permite renovar pedidos que já foram aprovados pelo cliente', () => {
    // Mesma regra de negócio existe no backend (orcamento.service): se uma das
    // duas listas for alterada sem a outra, o botão de renovar pode aparecer
    // para um pedido que o backend recusaria, ou vice-versa.
    expect(STATUS_RENOVAVEIS).toEqual(['PRODUCAO', 'FINALIZADO', 'ENTREGUE'])
  })

  it('nunca inclui um pedido que ainda não foi aprovado ou que foi recusado/cancelado', () => {
    for (const status of ['PENDENTE', 'AGUARDANDO_PAGAMENTO', 'RECUSADO', 'CANCELADO']) {
      expect(STATUS_RENOVAVEIS).not.toContain(status)
    }
  })
})

describe('consistência do vocabulário de status', () => {
  it('toda cor usada em STATUS tem uma classe correspondente em CLASSES_COR e PONTO_COR', () => {
    const coresUsadas = Object.values(STATUS).map((info) => info.cor)
    for (const cor of coresUsadas) {
      expect(CLASSES_COR[cor]).toBeTruthy()
      expect(PONTO_COR[cor]).toBeTruthy()
    }
  })
})
