export interface NotificacaoStatus {
  email: string;
  pedidoId: string;
  status: string;
  preco?: number | string | null;
  mensagem?: string | null;
}

export interface NotificacaoPort {
  notificarStatus(dados: NotificacaoStatus): Promise<void>;
}

export const NOTIFICACAO_PORT = Symbol('NOTIFICACAO_PORT');
