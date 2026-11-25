import { beforeEach, describe, expect, it } from 'vitest'
import { getUsuario } from './api'

describe('getUsuario', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('retorna null quando não há usuário salvo', () => {
    expect(getUsuario()).toBeNull()
  })

  it('retorna o usuário salvo no localStorage', () => {
    localStorage.setItem('usuario_farmacia', JSON.stringify({ id: '123', email: 'cliente@exemplo.com' }))
    expect(getUsuario()).toEqual({ id: '123', email: 'cliente@exemplo.com' })
  })

  it('retorna null em vez de lançar erro quando o valor salvo está corrompido', () => {
    localStorage.setItem('usuario_farmacia', '{json inválido')
    expect(getUsuario()).toBeNull()
  })
})
