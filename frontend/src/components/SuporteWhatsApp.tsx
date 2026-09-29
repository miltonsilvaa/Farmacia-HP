import { MessageCircle } from 'lucide-react';
import { numeroPedido } from '@/lib/format';

// Número da farmácia com DDI e DDD, só dígitos (ex.: 5513999999999)
const NUMERO = (import.meta.env.VITE_WHATSAPP_FARMACIA ?? '').replace(/\D/g, '');

// Leva o cliente ao WhatsApp já com o número do pedido na mensagem, para o
// atendente não precisar perguntar "qual é o pedido?"
export default function SuporteWhatsApp({ pedidoId }: { pedidoId: string }) {
  if (!NUMERO) return null;
  const texto = encodeURIComponent(
    `Olá, preciso de ajuda com o Pedido #${numeroPedido(pedidoId)}`,
  );

  return (
    <a
      href={`https://wa.me/${NUMERO}?text=${texto}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-12 items-center gap-2 rounded-lg px-3 font-bold text-status-verde transition-colors hover:bg-status-verde-soft"
    >
      <MessageCircle aria-hidden="true" className="size-5" />
      Dúvidas? Falar no WhatsApp
    </a>
  );
}
