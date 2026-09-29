import { Orcamento } from '../../entities/orcamento.entity';

export interface OrcamentoRepositoryPort {
  salvar(orcamento: Orcamento): Promise<void>;
}

export const ORCAMENTO_REPOSITORY = Symbol('ORCAMENTO_REPOSITORY');
