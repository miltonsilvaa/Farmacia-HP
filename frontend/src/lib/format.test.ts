import { describe, expect, it } from 'vitest'
import { formatarData, formatarDataUTC, formatarMoeda, numeroPedido } from './format'

describe('formatarMoeda', () => {
  it('formata um número em real (BRL)', () => {
    expect(formatarMoeda(19.9)).toMatch(/^R\$\s19,90$/)
  })

  it('aceita o valor como string', () => {
    expect(formatarMoeda('19.90')).toMatch(/^R\$\s19,90$/)
  })

  it('formata valor negativo', () => {
    expect(formatarMoeda(-5)).toMatch(/^-R\$\s5,00$/)
  })

  it('zero é um valor válido, não "sem valor"', () => {
    expect(formatarMoeda(0)).toMatch(/^R\$\s0,00$/)
  })

  it.each([null, undefined, ''])('mostra "—" quando o valor é %s', (valor) => {
    expect(formatarMoeda(valor)).toBe('—')
  })
})

describe('formatarData', () => {
  it('formata a data no padrão dd de mês de aaaa', () => {
    expect(formatarData('2026-03-05T12:00:00.000Z')).toBe('05 de mar. de 2026')
  })
})

describe('formatarDataUTC', () => {
  it('mostra o dia gravado, sem voltar um dia por causa do fuso', () => {
    // Regressão: usar toLocaleDateString sem timeZone: 'UTC' pode mostrar o dia
    // anterior em fusos negativos (ex: America/Sao_Paulo) para datas sem horário.
    expect(formatarDataUTC('1990-05-15')).toBe('15/05/1990')
  })

  it('funciona também com data e hora completas', () => {
    expect(formatarDataUTC('1990-05-15T00:00:00.000Z')).toBe('15/05/1990')
  })
})

describe('numeroPedido', () => {
  it('usa os 8 primeiros caracteres do id, em maiúsculas', () => {
    expect(numeroPedido('abcdef12-3456-7890-abcd-ef1234567890')).toBe('ABCDEF12')
  })

  it('é determinístico: o mesmo id sempre gera o mesmo número', () => {
    const id = 'f00dbabe-0000-0000-0000-000000000000'
    expect(numeroPedido(id)).toBe(numeroPedido(id))
  })
})
