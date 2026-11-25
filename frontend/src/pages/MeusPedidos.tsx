import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  BellRing,
  Camera,
  Check,
  ClipboardList,
  FileText,
  Loader2,
  Paperclip,
  RefreshCw,
  Store,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatarData, formatarMoeda, numeroPedido } from '@/lib/format';
import { STATUS_RENOVAVEIS } from '@/lib/status';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatusBadge from '@/components/StatusBadge';
import LinhaDoTempoPedido from '@/components/LinhaDoTempoPedido';
import ComoTomar from '@/components/ComoTomar';
import SuporteWhatsApp from '@/components/SuporteWhatsApp';
import ConfirmDialog from '@/components/ConfirmDialog';
import EstadoVazio from '@/components/EstadoVazio';
import { CartoesCarregando } from '@/components/Carregando';

interface PedidoItem {
  id: string;
  quantidade: number;
  precoUnitario: string;
  produto: { nome: string };
}

interface Pedido {
  id: string;
  criadoEm: string;
  status: string;
  arquivoReceitaUrl: string;
  preco: string | null;
  respostaAdmin: string | null;
  observacoes: string | null;
  posologia: string | null;
  itens: PedidoItem[];
  anexos: { id: string; arquivoUrl: string; nomeArquivo: string }[];
  familiar: { nome: string; parentesco: string; tipo: 'PESSOA' | 'PET'; especie: string | null } | null;
  solicitadoPor: string | null;
}

const GRUPOS = [
  { titulo: 'Precisa da sua resposta', status: ['AGUARDANDO_PAGAMENTO'] },
  { titulo: 'Em andamento', status: ['PENDENTE', 'PRODUCAO', 'FINALIZADO'] },
  { titulo: 'Histórico', status: ['ENTREGUE', 'RECUSADO', 'CANCELADO'] },
];

function descricaoPaciente(p: Pedido) {
  if (!p.familiar) return 'Você';
  const f = p.familiar;
  const detalhe = f.tipo === 'PET' ? `pet${f.especie ? `, ${f.especie.toLowerCase()}` : ''}` : f.parentesco.toLowerCase();
  return `${f.nome} (${detalhe})`;
}

// O orçamento cobre a fórmula manipulada + os produtos; a diferença é a fórmula
function valorFormula(p: Pedido) {
  if (!p.preco || p.itens.length === 0 || p.status === 'AGUARDANDO_PAGAMENTO') return 0;
  const produtos = p.itens.reduce((s, i) => s + Number(i.precoUnitario) * i.quantidade, 0);
  return Math.round((Number(p.preco) - produtos) * 100) / 100;
}

function nomeRemedio(p: Pedido) {
  return p.itens.length > 0 ? p.itens.map((i) => i.produto.nome).join(', ') : 'Fórmula manipulada da receita';
}

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [respondendo, setRespondendo] = useState<string | null>(null);
  const [recusando, setRecusando] = useState<Pedido | null>(null);
  const [renovando, setRenovando] = useState<Pedido | null>(null);
  const [isRenovando, setIsRenovando] = useState(false);
  const [destaque, setDestaque] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { hash } = useLocation();

  const carregar = useCallback(
    () =>
      apiFetch('/orcamentos')
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(setPedidos)
        .catch(() => {
          setPedidos((atual) => atual ?? []);
          toast.error('Não conseguimos carregar seus pedidos. Confira sua internet.');
        }),
    [],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Vindo do e-mail de lembrete (/meus-pedidos?renovar=<id>): abre direto a confirmação
  const renovarId = searchParams.get('renovar');
  const pedidoDoLembrete = renovarId
    ? pedidos?.find((p) => p.id === renovarId && STATUS_RENOVAVEIS.includes(p.status))
    : undefined;
  const pedidoNoModal = renovando ?? pedidoDoLembrete ?? null;

  // Vindo da tela inicial (#pedido-<id>): rola até o pedido e destaca
  useEffect(() => {
    if (!pedidos || !hash.startsWith('#pedido-')) return;
    const id = hash.slice('#pedido-'.length);
    const el = document.getElementById(`pedido-${id}`);
    if (!el) return;
    el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    el.focus({ preventScroll: true });
    const t = setTimeout(() => setDestaque(id), 0);
    const fim = setTimeout(() => setDestaque(null), 2500);
    return () => {
      clearTimeout(t);
      clearTimeout(fim);
    };
  }, [pedidos, hash]);

  const fecharRenovacao = () => {
    setRenovando(null);
    if (renovarId) setSearchParams({}, { replace: true });
  };

  const responder = async (pedido: Pedido, acao: 'APROVAR' | 'RECUSAR') => {
    setRespondendo(pedido.id);
    try {
      const response = await apiFetch(`/orcamentos/${pedido.id}/responder-cliente`, {
        method: 'PATCH',
        body: JSON.stringify({ acao }),
      });
      if (!response.ok) throw new Error();
      await carregar();
      if (acao === 'APROVAR') {
        toast.success('Orçamento aprovado! A farmácia já vai começar a preparar.');
      } else {
        toast.success('Orçamento recusado. O pedido foi cancelado.');
      }
    } catch {
      toast.error('Não conseguimos registrar sua resposta. Tente de novo.');
    } finally {
      setRespondendo(null);
      setRecusando(null);
    }
  };

  const confirmarRenovacao = async () => {
    if (!pedidoNoModal) return;
    setIsRenovando(true);
    try {
      const response = await apiFetch(`/orcamentos/${pedidoNoModal.id}/renovar`, { method: 'POST' });
      if (!response.ok) throw new Error();
      const { itensIndisponiveis } = await response.json();
      await carregar();
      toast.success(
        itensIndisponiveis > 0
          ? `Pedido renovado! ${itensIndisponiveis} produto(s) não estão mais à venda e ficaram de fora.`
          : 'Pedido renovado! A farmácia vai conferir e mandar o novo orçamento.',
      );
      fecharRenovacao();
    } catch {
      toast.error('Não conseguimos renovar agora. Tente de novo em instantes.');
    } finally {
      setIsRenovando(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meus pedidos</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Acompanhe o preparo, veja como tomar e renove com 1 clique.
          </p>
        </div>
        <Button asChild className="hidden md:inline-flex">
          <Link to="/novo-orcamento">
            <Camera aria-hidden="true" />
            Enviar receita
          </Link>
        </Button>
      </div>

      {pedidos === null ? (
        <CartoesCarregando />
      ) : pedidos.length === 0 ? (
        <div className="rounded-2xl bg-card shadow-card">
          <EstadoVazio
            icone={ClipboardList}
            titulo="Você ainda não tem receitas enviadas"
            texto="Tire uma foto da receita e a farmácia manda o orçamento. Clique no botão abaixo para começar!"
            acao={
              <Button asChild size="lg" className="w-full">
                <Link to="/novo-orcamento">
                  <Camera aria-hidden="true" />
                  Enviar minha primeira receita
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        GRUPOS.map((grupo) => {
          const lista = pedidos.filter((p) => grupo.status.includes(p.status));
          if (lista.length === 0) return null;
          return (
            <section key={grupo.titulo} aria-labelledby={`grupo-${grupo.titulo}`}>
              <h2 id={`grupo-${grupo.titulo}`} className="mb-3 text-xl font-bold">
                {grupo.titulo} <span className="tabular text-muted-foreground">({lista.length})</span>
              </h2>
              <ul className="flex flex-col gap-4">
                {lista.map((pedido) => (
                  <li key={pedido.id}>
                    <article
                      id={`pedido-${pedido.id}`}
                      tabIndex={-1}
                      aria-labelledby={`titulo-${pedido.id}`}
                      className={cn(
                        'scroll-mt-24 rounded-2xl bg-card p-5 shadow-card outline-none transition-shadow duration-500 sm:p-6',
                        destaque === pedido.id && 'ring-4 ring-primary/40',
                      )}
                    >
                      {/* Cabeçalho */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 id={`titulo-${pedido.id}`} className="text-lg font-bold">
                            {nomeRemedio(pedido)}
                          </h3>
                          <p className="text-muted-foreground">
                            <span className="tabular">#{numeroPedido(pedido.id)}</span> · para{' '}
                            {descricaoPaciente(pedido)} · {formatarData(pedido.criadoEm)}
                          </p>
                          {pedido.solicitadoPor && (
                            <p className="text-muted-foreground">Pedido por {pedido.solicitadoPor}</p>
                          )}
                        </div>
                        <StatusBadge status={pedido.status} />
                      </div>

                      <div className="mt-5 flex flex-col gap-5">
                        {pedido.status !== 'ENTREGUE' && <LinhaDoTempoPedido status={pedido.status} />}

                        {/* Orçamento esperando resposta */}
                        {pedido.status === 'AGUARDANDO_PAGAMENTO' && (
                          <div className="rounded-xl bg-status-amarelo-soft p-5">
                            <p className="flex items-center gap-2 font-bold text-status-amarelo">
                              <BellRing aria-hidden="true" className="size-5" />
                              Orçamento da farmácia
                            </p>
                            <p className="tabular mt-1 text-4xl font-bold">{formatarMoeda(pedido.preco)}</p>
                            {pedido.respostaAdmin && (
                              <p className="mt-2 text-lg">“{pedido.respostaAdmin}”</p>
                            )}
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                              <Button
                                size="lg"
                                onClick={() => responder(pedido, 'APROVAR')}
                                disabled={respondendo === pedido.id}
                                className="flex-1"
                              >
                                {respondendo === pedido.id ? (
                                  <Loader2 aria-hidden="true" className="animate-spin" />
                                ) : (
                                  <Check aria-hidden="true" />
                                )}
                                Aprovar orçamento
                              </Button>
                              <Button
                                size="lg"
                                variant="destructive-outline"
                                onClick={() => setRecusando(pedido)}
                                disabled={respondendo === pedido.id}
                                className="flex-1"
                              >
                                <X aria-hidden="true" />
                                Recusar
                              </Button>
                            </div>
                          </div>
                        )}

                        {pedido.status === 'PENDENTE' && (
                          <p className="text-lg text-muted-foreground">
                            A farmácia está conferindo sua receita. Você recebe um e-mail quando o orçamento
                            ficar pronto.
                          </p>
                        )}
                        {pedido.status === 'FINALIZADO' && (
                          <p className="flex items-start gap-2 text-lg font-bold text-status-verde">
                            <Store aria-hidden="true" className="mt-1 size-5 shrink-0" />
                            Seu pedido está pronto. Retire na farmácia ou combine a entrega.
                          </p>
                        )}
                        {pedido.status === 'RECUSADO' && (
                          <p className="text-lg">
                            A farmácia não conseguiu atender esta receita.
                            {pedido.respostaAdmin && <> Motivo: “{pedido.respostaAdmin}”</>}
                          </p>
                        )}

                        <ComoTomar posologia={pedido.posologia} />

                        {/* Produtos e valor */}
                        {!['ENTREGUE', 'CANCELADO'].includes(pedido.status) &&
                          (pedido.itens.length > 0 || (pedido.preco && pedido.status !== 'AGUARDANDO_PAGAMENTO')) && (
                          <dl className="tabular rounded-xl bg-muted/60 px-4 py-3">
                            {pedido.itens.map((item) => (
                              <div key={item.id} className="flex justify-between gap-3 py-0.5">
                                <dt>
                                  {item.produto.nome} × {item.quantidade}
                                </dt>
                                <dd>{formatarMoeda(Number(item.precoUnitario) * item.quantidade)}</dd>
                              </div>
                            ))}
                            {valorFormula(pedido) > 0 && (
                              <div className="flex justify-between gap-3 py-0.5">
                                <dt>Fórmula da receita (manipulação)</dt>
                                <dd>{formatarMoeda(valorFormula(pedido))}</dd>
                              </div>
                            )}
                            {pedido.preco && pedido.status !== 'AGUARDANDO_PAGAMENTO' && (
                              <div className="flex justify-between gap-3 border-t border-border pt-2 mt-1 font-bold">
                                <dt>Valor do orçamento</dt>
                                <dd>{formatarMoeda(pedido.preco)}</dd>
                              </div>
                            )}
                          </dl>
                        )}

                        {/* Ações */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-4">
                          {STATUS_RENOVAVEIS.includes(pedido.status) && (
                            <Button variant="outline" onClick={() => setRenovando(pedido)} className="mr-auto">
                              <RefreshCw aria-hidden="true" />
                              Renovar este pedido
                            </Button>
                          )}
                          <a
                            href={pedido.arquivoReceitaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-12 items-center gap-2 rounded-lg px-3 font-bold text-accent-foreground transition-colors hover:bg-muted"
                          >
                            <FileText aria-hidden="true" className="size-5" />
                            Ver receita
                          </a>
                          {pedido.anexos?.map((anexo, i) => (
                            <a
                              key={anexo.id}
                              href={anexo.arquivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={anexo.nomeArquivo}
                              className="inline-flex min-h-12 items-center gap-2 rounded-lg px-3 font-bold text-accent-foreground transition-colors hover:bg-muted"
                            >
                              <Paperclip aria-hidden="true" className="size-5" />
                              Anexo {i + 1}
                            </a>
                          ))}
                          <SuporteWhatsApp pedidoId={pedido.id} />
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      {/* Confirmação da renovação em 1 clique */}
      <Dialog open={pedidoNoModal !== null} onOpenChange={(aberto) => !aberto && !isRenovando && fecharRenovacao()}>
        {pedidoNoModal && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {pedidoDoLembrete && !renovando ? 'Seu remédio está acabando?' : 'Renovar este pedido?'}
              </DialogTitle>
              <DialogDescription>
                Vamos pedir de novo com a mesma receita. A farmácia confere e manda o orçamento antes de
                cobrar qualquer valor.
              </DialogDescription>
            </DialogHeader>

            <dl className="divide-y rounded-xl bg-muted/60 text-left">
              {[
                { rotulo: 'Para', valor: descricaoPaciente(pedidoNoModal) },
                {
                  rotulo: 'Remédio',
                  valor:
                    pedidoNoModal.itens.length > 0
                      ? pedidoNoModal.itens.map((i) => `${i.produto.nome} × ${i.quantidade}`).join(', ')
                      : `Mesma fórmula do pedido #${numeroPedido(pedidoNoModal.id)}`,
                },
                ...(pedidoNoModal.posologia ? [{ rotulo: 'Como tomar', valor: pedidoNoModal.posologia }] : []),
                { rotulo: 'Último valor', valor: formatarMoeda(pedidoNoModal.preco) },
                { rotulo: 'Retirada', valor: 'Na farmácia ou entrega a combinar' },
              ].map((linha) => (
                <div
                  key={linha.rotulo}
                  className="flex flex-col px-4 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <dt className="shrink-0 text-muted-foreground">{linha.rotulo}</dt>
                  <dd className="tabular font-bold sm:text-right">{linha.valor}</dd>
                </div>
              ))}
            </dl>

            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={fecharRenovacao} disabled={isRenovando}>
                Agora não
              </Button>
              <Button onClick={confirmarRenovacao} disabled={isRenovando}>
                {isRenovando ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : (
                  <RefreshCw aria-hidden="true" />
                )}
                {isRenovando ? 'Renovando…' : 'Sim, renovar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <ConfirmDialog
        aberto={recusando !== null}
        titulo="Recusar este orçamento?"
        mensagem="O pedido será cancelado. Se mudar de ideia, é só enviar a receita de novo."
        textoConfirmar="Sim, recusar"
        processando={respondendo !== null}
        onConfirmar={() => recusando && responder(recusando, 'RECUSAR')}
        onCancelar={() => setRecusando(null)}
      />
    </div>
  );
}
