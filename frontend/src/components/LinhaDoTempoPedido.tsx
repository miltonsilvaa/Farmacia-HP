import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ETAPAS = [
  { titulo: 'Solicitado', status: ['PENDENTE', 'AGUARDANDO_PAGAMENTO'] },
  { titulo: 'Em manipulação', status: ['PRODUCAO'] },
  { titulo: 'Pronto para retirada', status: ['FINALIZADO'] },
  { titulo: 'Entregue', status: ['ENTREGUE'] },
];

// Responde "onde está meu remédio?" sem o cliente precisar perguntar no WhatsApp.
// Pedidos recusados/cancelados não têm andamento e não mostram a linha.
export default function LinhaDoTempoPedido({ status }: { status: string }) {
  const atual = ETAPAS.findIndex((e) => e.status.includes(status));
  if (atual === -1) return null;
  const concluido = status === 'ENTREGUE';

  return (
    <ol aria-label="Andamento do pedido" className="grid grid-cols-4">
      {ETAPAS.map((etapa, i) => {
        const feita = i < atual || concluido;
        const ehAtual = i === atual && !concluido;
        return (
          <li
            key={etapa.titulo}
            aria-current={ehAtual ? 'step' : undefined}
            className="relative flex flex-col items-center text-center"
          >
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-[1.05rem] right-1/2 h-1 w-full rounded-full',
                  i <= atual ? 'bg-primary' : 'bg-border',
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'relative z-10 grid size-9 place-items-center rounded-full border-2 text-base font-bold transition-colors',
                feita && 'border-primary bg-primary text-primary-foreground',
                ehAtual && 'border-primary bg-card text-primary ring-4 ring-primary/15',
                !feita && !ehAtual && 'border-border bg-card text-muted-foreground',
              )}
            >
              {feita ? <Check className="size-5" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                'mt-2 px-1 text-sm leading-tight',
                ehAtual ? 'font-bold text-accent-foreground' : feita ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {etapa.titulo}
              <span className="sr-only">
                {feita ? ' (concluído)' : ehAtual ? ' (etapa atual)' : ' (próxima etapa)'}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
