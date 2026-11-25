import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('junta várias classes em uma string só', () => {
    expect(cn('base', 'extra')).toBe('base extra')
  })

  it('ignora valores falsy (condicionais que não se aplicam)', () => {
    const ativo = false
    expect(cn('base', ativo && 'ativo', undefined, null, '')).toBe('base')
  })

  it('resolve conflito entre classes do Tailwind mantendo a última', () => {
    // twMerge precisa continuar fazendo isso: sem ele, passar um `className`
    // para sobrescrever o padding de um componente shadcn/ui vira classe duplicada.
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})
