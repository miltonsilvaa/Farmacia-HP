import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CloudUpload,
  Download,
  FileText,
  Loader2,
  PackageCheck,
  Paperclip,
  Search,
  Truck,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatarData, formatarMoeda, numeroPedido } from '@/lib/format';
import { PONTO_COR, STATUS } from '@/lib/status';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import EstadoVazio from '@/components/EstadoVazio';
import { LinhasCarregando } from '@/components/Carregando';

interface OrcamentoItem {
  id: string;
  quantidade: number;
  precoUnitario: string;
  produto: { nome: string };
}

interface OrcamentoAdmin {
  id: string;
  criadoEm: string;
  status: string;
  arquivoReceitaUrl: string;
  observacoes: string | null;
  respostaAdmin: string | null;
  posologia: string | null;
  preco: string | null;
  usuario: { email: string };
  itens: OrcamentoItem[];
  anexos: { id: string; arquivoUrl: string; nomeArquivo: string }[];
  familiar: { nome: string; parentesco: string } | null;
  erpStatus: 'ENVIADO' | 'ERRO' | null;
  erpEnviadoEm: string | null;
  erpErro: string | null;
}

// Ordem dos filtros = ordem do fluxo do pedido
const FILTROS = ['TODOS', 'PENDENTE', 'AGUARDANDO_PAGAMENTO', 'PRODUCAO', 'FINALIZADO', 'ENTREGUE', 'RECUSADO', 'CANCELADO'];
const PROXIMO: Record<string, { para: 'FINALIZADO' | 'ENTREGUE'; rotulo: string; icone: typeof PackageCheck }> = {
  PRODUCAO: { para: 'FINALIZADO', rotulo: 'Marcar pronto', icone: PackageCheck },
  FINALIZADO: { para: 'ENTREGUE', rotulo: 'Marcar entregue', icone: Truck },
};
const COM_ERP = ['PRODUCAO', 'FINALIZADO', 'ENTREGUE'];

// Botão do próximo passo do fluxo (Em manipulação → Pronto → Entregue)
function BotaoProximo({
  o,
  onClick,
}: {
  o: OrcamentoAdmin;
  onClick: (para: 'FINALIZADO' | 'ENTREGUE') => void;
}) {
  const proximo = PROXIMO[o.status];
  if (!proximo) return null;
  const Icone = proximo.icone;
  return (
    <Button size="sm" onClick={() => onClick(proximo.para)}>
      <Icone aria-hidden="true" />
      {proximo.rotulo}
    </Button>
  );
}

function paciente(o: OrcamentoAdmin) {
  return o.familiar ? `${o.familiar.nome} (${o.familiar.parentesco})` : 'Titular';
}

export default function AdminPedidos() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoAdmin[] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const filtro = searchParams.get('status') ?? 'TODOS';
  const [busca, setBusca] = useState('');

  const [detalhe, setDetalhe] = useState<OrcamentoAdmin | null>(null);
  const [posologiaTexto, setPosologiaTexto] = useState('');
  const [isSalvandoPosologia, setIsSalvandoPosologia] = useState(false);
  const [mudanca, setMudanca] = useState<{ pedido: OrcamentoAdmin; para: 'FINALIZADO' | 'ENTREGUE' } | null>(null);
  const [isMudando, setIsMudando] = useState(false);
  const [processandoErp, setProcessandoErp] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/orcamentos/admin')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setOrcamentos)
      .catch(() => {
        setOrcamentos([]);
        toast.error('Não foi possível carregar os pedidos.');
      });
  }, []);

  const atualizarPedido = (id: string, dados: Partial<OrcamentoAdmin>) => {
    setOrcamentos((prev) => prev?.map((o) => (o.id === id ? { ...o, ...dados } : o)) ?? prev);
    setDetalhe((d) => (d?.id === id ? { ...d, ...dados } : d));
  };

  const mudarFiltro = (status: string) =>
    setSearchParams(status === 'TODOS' ? {} : { status }, { replace: true });

  const contar = (s: string) =>
    s === 'TODOS' ? (orcamentos?.length ?? 0) : (orcamentos ?? []).filter((o) => o.status === s).length;

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase().replace(/^#/, '');
    return (orcamentos ?? []).filter(
      (o) =>
        (filtro === 'TODOS' || o.status === filtro) &&
        (!termo ||
          numeroPedido(o.id).toLowerCase().includes(termo) ||
          o.usuario.email.toLowerCase().includes(termo) ||
          o.familiar?.nome.toLowerCase().includes(termo)),
    );
  }, [orcamentos, filtro, busca]);

  const abrirDetalhe = (o: OrcamentoAdmin) => {
    setDetalhe(o);
    setPosologiaTexto(o.posologia ?? '');
  };

  const handleMudarStatus = async () => {
    if (!mudanca) return;
    const { pedido, para } = mudanca;
    setIsMudando(true);
    try {
      const res = await apiFetch(`/orcamentos/admin/${pedido.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: para }),
      });
      if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.message);
      }
      atualizarPedido(pedido.id, { status: para });
      toast.success(
        para === 'FINALIZADO' ? 'Pedido pronto. O cliente foi avisado por e-mail.' : 'Pedido marcado como entregue.',
      );
    } catch (e) {
      toast.error((e as Error).message || 'Não foi possível atualizar o pedido.');
    } finally {
      setIsMudando(false);
      setMudanca(null);
    }
  };

  const handleSalvarPosologia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detalhe) return;
    setIsSalvandoPosologia(true);
    try {
      const res = await apiFetch(`/orcamentos/admin/${detalhe.id}/posologia`, {
        method: 'PATCH',
        body: JSON.stringify({ posologia: posologiaTexto }),
      });
      if (!res.ok) throw new Error();
      const { posologia } = await res.json();
      atualizarPedido(detalhe.id, { posologia });
      toast.success('Modo de uso salvo. O cliente já vê no pedido.');
    } catch {
      toast.error('Não foi possível salvar o modo de uso.');
    } finally {
      setIsSalvandoPosologia(false);
    }
  };

  const handleEnviarErp = async (id: string) => {
    setProcessandoErp(id);
    try {
      const res = await apiFetch(`/orcamentos/admin/${id}/erp`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const resultado = await res.json();
      atualizarPedido(id, resultado);
      if (resultado.erpStatus === 'ENVIADO') toast.success('Pedido enviado ao ERP.');
      else toast.error(`Falha no envio ao ERP: ${resultado.erpErro ?? 'erro desconhecido'}`);
    } catch {
      toast.error('Sem conexão para enviar ao ERP.');
    } finally {
      setProcessandoErp(null);
    }
  };

  // Download autenticado: busca com o token e entrega o arquivo ao navegador
  const handleExportar = async (id: string, formato: 'json' | 'xml') => {
    try {
      const res = await apiFetch(`/orcamentos/admin/${id}/erp?formato=${formato}`);
      if (!res.ok) throw new Error();
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `pedido-${numeroPedido(id)}.${formato}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível gerar o arquivo.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            {orcamentos === null ? 'Carregando…' : `${orcamentos.length} pedido(s) no total`}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Label htmlFor="busca-pedidos" className="sr-only">
            Buscar por número, e-mail ou paciente
          </Label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="busca-pedidos"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nº, e-mail ou paciente"
            className="pl-12"
          />
        </div>
      </div>

      {/* Filtros rápidos por status */}
      <div role="group" aria-label="Filtrar por status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {FILTROS.map((s) => {
          const ativo = filtro === s;
          const info = s === 'TODOS' ? null : STATUS[s];
          return (
            <button
              key={s}
              onClick={() => mudarFiltro(s)}
              aria-pressed={ativo}
              className={cn(
                'flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-4 font-bold whitespace-nowrap transition-colors',
                ativo ? 'border-foreground bg-foreground text-card' : 'border-border bg-card hover:border-foreground/40',
              )}
            >
              {info && (
                <span aria-hidden="true" className={cn('size-3 rounded-full', PONTO_COR[info.cor], ativo && 'ring-2 ring-card')} />
              )}
              {info ? info.rotuloAdmin : 'Todos'}
              <span className={cn('tabular', ativo ? 'text-card/80' : 'text-muted-foreground')}>{contar(s)}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        {orcamentos === null ? (
          <LinhasCarregando />
        ) : lista.length === 0 ? (
          <EstadoVazio
            icone={ClipboardList}
            titulo={orcamentos.length === 0 ? 'Nenhum pedido ainda' : 'Nada encontrado'}
            texto={
              orcamentos.length === 0
                ? 'Os pedidos dos clientes aparecem aqui assim que chegarem.'
                : 'Tente outro filtro ou outra busca.'
            }
          />
        ) : (
          <>
          {/* Celular e tablet: um cartão por pedido, com status e ação sempre visíveis */}
          <ul className="divide-y lg:hidden">
            {lista.map((o) => (
              <li key={o.id} className="flex flex-col gap-3 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="tabular font-bold">
                      #{numeroPedido(o.id)} <span className="font-normal text-muted-foreground">· {formatarData(o.criadoEm)}</span>
                    </p>
                    <p className="font-bold">{paciente(o)}</p>
                    <p className="truncate text-sm text-muted-foreground">{o.usuario.email}</p>
                  </div>
                  <p className="tabular text-lg font-bold">{formatarMoeda(o.preco)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={o.status} admin />
                  {o.erpStatus === 'ERRO' && <span className="text-sm font-bold text-status-vermelho">ERP falhou</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <BotaoProximo o={o} onClick={(para) => setMudanca({ pedido: o, para })} />
                  <Button size="sm" variant="outline" onClick={() => abrirDetalhe(o)}>
                    Detalhes
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden lg:block">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[9rem]" />
                <col />
                <col className="w-[13rem]" />
                <col className="w-[8.5rem]" />
                <col className="w-[17rem]" />
              </colgroup>
              <thead>
                <tr className="border-b bg-muted/60 text-sm text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-bold">Pedido</th>
                  <th scope="col" className="px-5 py-3 font-bold">Paciente e cliente</th>
                  <th scope="col" className="px-5 py-3 font-bold">Status</th>
                  <th scope="col" className="py-3 pr-8 pl-5 text-right font-bold">Valor</th>
                  <th scope="col" className="px-5 py-3 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                    <td className="px-5 py-4">
                      <p className="tabular font-bold">#{numeroPedido(o.id)}</p>
                      <p className="text-sm whitespace-nowrap text-muted-foreground">{formatarData(o.criadoEm)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="truncate font-bold">{paciente(o)}</p>
                      <p className="truncate text-sm text-muted-foreground">{o.usuario.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={o.status} admin />
                      {o.erpStatus === 'ENVIADO' && <p className="mt-1 text-sm text-status-verde">ERP: enviado</p>}
                      {o.erpStatus === 'ERRO' && (
                        <p className="mt-1 text-sm font-bold text-status-vermelho" title={o.erpErro ?? undefined}>
                          ERP: falhou
                        </p>
                      )}
                    </td>
                    <td className="tabular py-4 pr-8 pl-5 text-right font-bold">{formatarMoeda(o.preco)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <BotaoProximo o={o} onClick={(para) => setMudanca({ pedido: o, para })} />
                        <Button size="sm" variant="outline" onClick={() => abrirDetalhe(o)}>
                          Detalhes
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Detalhes do pedido */}
      <Dialog open={detalhe !== null} onOpenChange={(aberto) => !aberto && setDetalhe(null)}>
        {detalhe && (
          <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pedido #{numeroPedido(detalhe.id)}</DialogTitle>
              <DialogDescription>
                {paciente(detalhe)} · {detalhe.usuario.email} · {formatarData(detalhe.criadoEm)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={detalhe.status} admin />
              <span className="tabular text-lg font-bold">{formatarMoeda(detalhe.preco)}</span>
              <span className="ml-auto">
                <BotaoProximo o={detalhe} onClick={(para) => setMudanca({ pedido: detalhe, para })} />
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={detalhe.arquivoReceitaUrl} target="_blank" rel="noopener noreferrer">
                  <FileText aria-hidden="true" />
                  Abrir receita
                </a>
              </Button>
              {detalhe.anexos?.map((a, i) => (
                <Button key={a.id} asChild variant="outline" size="sm">
                  <a href={a.arquivoUrl} target="_blank" rel="noopener noreferrer" title={a.nomeArquivo}>
                    <Paperclip aria-hidden="true" />
                    Anexo {i + 1}
                  </a>
                </Button>
              ))}
            </div>

            {(detalhe.observacoes || detalhe.respostaAdmin) && (
              <div className="flex flex-col gap-2 rounded-xl bg-muted/60 px-4 py-3">
                {detalhe.observacoes && (
                  <p>
                    <span className="font-bold">Recado do cliente:</span> {detalhe.observacoes}
                  </p>
                )}
                {detalhe.respostaAdmin && (
                  <p>
                    <span className="font-bold">Mensagem da farmácia:</span> {detalhe.respostaAdmin}
                  </p>
                )}
              </div>
            )}

            {detalhe.itens.length > 0 && (
              <div className="tabular rounded-xl bg-muted/60 px-4 py-3">
                <p className="font-bold">Produtos</p>
                {detalhe.itens.map((i) => (
                  <p key={i.id} className="flex justify-between gap-3">
                    <span>
                      {i.produto.nome} × {i.quantidade}
                    </span>
                    <span>{formatarMoeda(Number(i.precoUnitario) * i.quantidade)}</span>
                  </p>
                ))}
              </div>
            )}

            {!['RECUSADO', 'CANCELADO'].includes(detalhe.status) && (
              <form onSubmit={handleSalvarPosologia} className="flex flex-col gap-2">
                <Label htmlFor="detalhe-posologia">Como tomar (aparece para o cliente)</Label>
                <Textarea
                  id="detalhe-posologia"
                  rows={2}
                  value={posologiaTexto}
                  onChange={(e) => setPosologiaTexto(e.target.value)}
                  disabled={isSalvandoPosologia}
                  placeholder="Ex.: 10 gotas, 2 vezes ao dia. Deixe em branco para remover."
                />
                <Button type="submit" variant="outline" size="sm" disabled={isSalvandoPosologia} className="self-end">
                  {isSalvandoPosologia && <Loader2 aria-hidden="true" className="animate-spin" />}
                  Salvar modo de uso
                </Button>
              </form>
            )}

            {COM_ERP.includes(detalhe.status) && (
              <section aria-labelledby="titulo-erp" className="rounded-xl border px-4 py-3">
                <h3 id="titulo-erp" className="font-bold">
                  ERP da farmácia
                </h3>
                <p className="text-muted-foreground">
                  {detalhe.erpStatus === 'ENVIADO' &&
                    `Enviado${detalhe.erpEnviadoEm ? ` em ${new Date(detalhe.erpEnviadoEm).toLocaleString('pt-BR')}` : ''}.`}
                  {detalhe.erpStatus === 'ERRO' && `Falhou: ${detalhe.erpErro ?? 'erro desconhecido'}.`}
                  {!detalhe.erpStatus && 'Ainda não enviado.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleEnviarErp(detalhe.id)} disabled={processandoErp === detalhe.id}>
                    {processandoErp === detalhe.id ? (
                      <Loader2 aria-hidden="true" className="animate-spin" />
                    ) : (
                      <CloudUpload aria-hidden="true" />
                    )}
                    {detalhe.erpStatus ? 'Reenviar ao ERP' : 'Enviar ao ERP'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExportar(detalhe.id, 'json')}>
                    <Download aria-hidden="true" />
                    Baixar JSON
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExportar(detalhe.id, 'xml')}>
                    <Download aria-hidden="true" />
                    Baixar XML
                  </Button>
                </div>
              </section>
            )}
          </DialogContent>
        )}
      </Dialog>

      <ConfirmDialog
        aberto={mudanca !== null}
        titulo={mudanca?.para === 'ENTREGUE' ? 'Confirmar entrega?' : 'O pedido está pronto?'}
        mensagem={`Pedido #${mudanca ? numeroPedido(mudanca.pedido.id) : ''} ${
          mudanca?.para === 'ENTREGUE' ? 'foi entregue ao cliente' : 'está pronto para retirada ou envio'
        }. O cliente recebe um e-mail.`}
        textoConfirmar={mudanca?.para === 'ENTREGUE' ? 'Marcar entregue' : 'Marcar pronto'}
        variante="primario"
        processando={isMudando}
        onConfirmar={handleMudarStatus}
        onCancelar={() => setMudanca(null)}
      />
    </div>
  );
}

