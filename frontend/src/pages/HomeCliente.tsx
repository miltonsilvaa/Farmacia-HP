import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Camera, ChevronRight, ClipboardList, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatarData, formatarMoeda, numeroPedido } from '@/lib/format';
import { STATUS_RENOVAVEIS } from '@/lib/status';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/StatusBadge';
import LinhaDoTempoPedido from '@/components/LinhaDoTempoPedido';

interface Pedido {
  id: string;
  criadoEm: string;
  status: string;
  preco: string | null;
  posologia: string | null;
  itens: { produto: { nome: string } }[];
  familiar: { nome: string } | null;
}

// O orçamento à espera já aparece em destaque no topo; aqui vem o que está andando
const EM_ANDAMENTO = ['PRODUCAO', 'FINALIZADO', 'PENDENTE'];

const paciente = (p: Pedido) => p.familiar?.nome ?? 'Você';

const resumoProdutos = (p: Pedido) =>
  p.itens.length > 0 ? p.itens.map((i) => i.produto.nome).join(', ') : 'Fórmula da receita';

// Cartão de pedido da tela inicial: amarelo quando espera a resposta do cliente
function CartaoPedido({ pedido }: { pedido: Pedido }) {
  const responder = pedido.status === 'AGUARDANDO_PAGAMENTO';
  return (
    <section
      aria-labelledby={`home-${pedido.id}`}
      className={cn('rounded-2xl p-5 shadow-card sm:p-6', responder ? 'bg-status-amarelo-soft' : 'bg-card')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`home-${pedido.id}`} className="flex items-center gap-2 text-xl font-bold">
            {responder && <BellRing aria-hidden="true" className="size-6 shrink-0 text-status-amarelo" />}
            {responder ? 'Seu orçamento está pronto' : 'Acompanhe seu pedido'}
          </h2>
          <p className={responder ? 'text-status-amarelo' : 'text-muted-foreground'}>
            #{numeroPedido(pedido.id)} · {paciente(pedido)}
            {responder && (
              <>
                {' '}· <span className="tabular font-bold">{formatarMoeda(pedido.preco)}</span>
              </>
            )}
          </p>
        </div>
        {!responder && <StatusBadge status={pedido.status} />}
      </div>
      <div className="mt-5">
        <LinhaDoTempoPedido status={pedido.status} />
      </div>
      {responder ? (
        <Button asChild size="lg" variant="outline" className="mt-5 w-full sm:w-auto">
          <Link to={`/meus-pedidos#pedido-${pedido.id}`}>Ver e responder</Link>
        </Button>
      ) : (
        <Link
          to={`/meus-pedidos#pedido-${pedido.id}`}
          className="mt-4 inline-flex min-h-12 items-center gap-1 font-bold text-primary hover:text-primary-hover"
        >
          Ver detalhes do pedido
          <ChevronRight aria-hidden="true" className="size-5" />
        </Link>
      )}
    </section>
  );
}

export default function HomeCliente() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);

  useEffect(() => {
    apiFetch('/orcamentos')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setPedidos)
      .catch(() => {
        setPedidos([]);
        toast.error('Não conseguimos carregar seus pedidos. Confira sua internet.');
      });
  }, []);

  const aResponder = pedidos?.filter((p) => p.status === 'AGUARDANDO_PAGAMENTO') ?? [];
  const emAndamento = EM_ANDAMENTO.map((s) => pedidos?.find((p) => p.status === s)).find(Boolean);
  const [destaque, ...outros] = [...aResponder, ...(emAndamento ? [emAndamento] : [])];
  // Um por paciente: o mais recente de cada um (a lista já vem do mais novo ao mais antigo)
  const renovaveis = (pedidos ?? [])
    .filter((p) => STATUS_RENOVAVEIS.includes(p.status))
    .filter((p, i, lista) => lista.findIndex((q) => paciente(q) === paciente(p)) === i)
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Olá! O que você precisa hoje?</h1>
      </div>

      {/* 1. Um cartão só no topo: o orçamento à espera ou o pedido em andamento */}
      {pedidos === null ? (
        <div role="status" aria-label="Carregando" className="rounded-2xl bg-card p-6 shadow-card">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-6 h-10 w-full" />
        </div>
      ) : (
        destaque && <CartaoPedido pedido={destaque} />
      )}

      {/* 2. Ação principal: botão verde de largura total, ao alcance do polegar */}
      <div>
        <Button asChild size="lg" className="w-full">
          <Link to="/novo-orcamento">
            <Camera aria-hidden="true" />
            Enviar receita
          </Link>
        </Button>
        <p className="mt-2 text-center text-muted-foreground">
          Tire uma foto da receita. A farmácia responde com o orçamento.
        </p>
      </div>

      {/* 3. Os demais pedidos que pedem atenção */}
      {outros.map((p) => (
        <CartaoPedido key={p.id} pedido={p} />
      ))}

      {/* 4. Renovar em 1 clique */}
      {renovaveis.length > 0 && (
        <section aria-labelledby="titulo-renovar">
          <h2 id="titulo-renovar" className="mb-3 text-xl font-bold">
            Renovar um remédio
          </h2>
          <ul className="divide-y overflow-hidden rounded-2xl bg-card shadow-card">
            {renovaveis.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-bold">{resumoProdutos(p)}</p>
                  {p.posologia && <p className="truncate">{p.posologia}</p>}
                  <p className="text-muted-foreground">
                    Para {p.familiar?.nome ?? 'você'} · último pedido em {formatarData(p.criadoEm)}
                  </p>
                </div>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to={`/meus-pedidos?renovar=${p.id}`}>
                    <RefreshCw aria-hidden="true" />
                    Renovar
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 5. Atalhos */}
      <nav aria-label="Atalhos">
        <ul className="divide-y overflow-hidden rounded-2xl bg-card shadow-card">
          {[
            { para: '/meus-pedidos', rotulo: 'Meus pedidos', texto: 'Histórico, orçamentos e posologia', icone: ClipboardList },
            { para: '/grupo-familia', rotulo: 'Minha família', texto: 'Parentes e pets que você cuida', icone: Users },
          ].map(({ para, rotulo, texto, icone: Icone }) => (
            <li key={para}>
              <Link to={para} className="flex min-h-18 items-center gap-4 px-5 py-4 transition-colors hover:bg-muted">
                <Icone aria-hidden="true" className="size-7 shrink-0 text-primary" />
                <span className="flex-1">
                  <span className="block text-lg font-bold">{rotulo}</span>
                  <span className="block text-muted-foreground">{texto}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-6 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
