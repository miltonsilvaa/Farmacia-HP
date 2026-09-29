export interface NotificacaoStatus {
  email: string;
  pedidoId: string;
  status: string;
  preco?: number | string | null;
  mensagem?: string | null;
}

export interface LembreteRecompra {
  email: string;
  pedidoId: string;
  paciente: string | null; // null = o próprio titular
  linkRenovar: string;
}

export interface NotificacaoPort {
  notificarStatus(dados: NotificacaoStatus): Promise<void>;
  lembrarRecompra(dados: LembreteRecompra): Promise<void>;
}

export const NOTIFICACAO_PORT = Symbol('NOTIFICACAO_PORT');
