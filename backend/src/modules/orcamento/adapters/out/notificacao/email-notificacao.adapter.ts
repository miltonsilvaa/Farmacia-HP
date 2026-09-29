import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { NotificacaoPort, NotificacaoStatus } from '../../../core/ports/out/notificacao.port';

const TEXTOS: Record<string, { titulo: string; texto: string }> = {
  PENDENTE: { titulo: 'Recebemos sua receita', texto: 'Seu pedido foi recebido e está em análise pela nossa equipe.' },
  AGUARDANDO_PAGAMENTO: { titulo: 'Seu orçamento está pronto', texto: 'Acesse a Área do Cliente para aprovar ou recusar o orçamento.' },
  RECUSADO: { titulo: 'Orçamento não aprovado', texto: 'Não foi possível atender a sua solicitação. Veja a mensagem da farmácia abaixo.' },
  PRODUCAO: { titulo: 'Pedido aprovado', texto: 'Obrigado! Seu pedido foi aprovado e seguiu para a manipulação.' },
  CANCELADO: { titulo: 'Pedido cancelado', texto: 'Você recusou o orçamento e o pedido foi cancelado.' },
  FINALIZADO: { titulo: 'Pedido pronto', texto: 'Seu pedido foi finalizado pela farmácia e está pronto para retirada ou entrega.' },
};

// Texto digitado pelo admin entra no HTML do e-mail: escapa para não virar marcação
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Injectable()
export class EmailNotificacaoAdapter implements NotificacaoPort {
  private readonly logger = new Logger(EmailNotificacaoAdapter.name);
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    secure: process.env.SMTP_PORT === '465',
    ...(process.env.SMTP_USER && {
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    }),
  });

  async notificarStatus({ email, pedidoId, status, preco, mensagem }: NotificacaoStatus): Promise<void> {
    const t = TEXTOS[status] ?? { titulo: 'Atualização do seu pedido', texto: `Novo status: ${status}` };
    const numero = pedidoId.substring(0, 8).toUpperCase();
    const valor = preco ? `<p><strong>Valor:</strong> R$ ${Number(preco).toFixed(2).replace('.', ',')}</p>` : '';
    const msg = mensagem ? `<p><strong>Mensagem da farmácia:</strong> ${escaparHtml(mensagem)}</p>` : '';

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `Grupo Farmácia HP <${process.env.SMTP_USER || 'nao-responda@farmaciahp.com.br'}>`,
        to: email,
        subject: `Pedido #${numero} — ${t.titulo}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
            <div style="background:#1e3a8a;color:#fff;padding:16px 24px;font-size:18px;font-weight:bold">Grupo Farmácia HP</div>
            <div style="padding:24px;color:#1f2937">
              <h2 style="margin-top:0">${t.titulo}</h2>
              <p>${t.texto}</p>
              <p><strong>Pedido:</strong> #${numero}</p>
              ${valor}${msg}
              <p style="color:#6b7280;font-size:12px;margin-top:24px">Este é um e-mail automático, não responda.</p>
            </div>
          </div>`,
      });
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail do pedido ${numero} para ${email}`, error);
    }
  }
}
