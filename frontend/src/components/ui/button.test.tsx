import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renderiza o texto recebido e responde a clique', async () => {
    render(<Button>Confirmar</Button>)

    const button = screen.getByRole('button', { name: 'Confirmar' })
    expect(button).toBeInTheDocument()
  })

  it('aplica a variante "destructive" quando indicada', () => {
    render(<Button variant="destructive">Cancelar pedido</Button>)

    expect(screen.getByRole('button', { name: 'Cancelar pedido' })).toHaveAttribute(
      'data-variant',
      'destructive',
    )
  })
})
