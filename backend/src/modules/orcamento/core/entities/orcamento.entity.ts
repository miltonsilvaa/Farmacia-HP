export class Orcamento {
  constructor(
    public readonly id: string,
    public readonly clienteId: string,
    public readonly arquivoReceitaUrl: string,
    public readonly status: 'PENDENTE' | 'RESPONDIDO',
    public readonly observacoes?: string,
    public readonly familiarId?: string,
  ) {}
}
