import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FileText, Inbox, Loader2, Paperclip, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatarData, formatarMoeda, numeroPedido } from '@/lib/format';
import { CLASSES_COR, infoStatus } from '@/lib/status';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
}

// Etapas que a equipe acompanha no dia a dia (links levam à lista já filtrada)
const RESUMO = ['PENDENTE', 'AGUARDANDO_PAGAMENTO', 'PRODUCAO', 'FINALIZADO'];

export default function DashboardAdmin() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoAdmin[] | null>(null);
  const [selecionado, setSelecionado] = useState<OrcamentoAdmin | null>(null);
  const [precoInput, setPrecoInput] = useState('');
  const [respostaInput, setRespostaInput] = useState('');
  const [posologiaInput, setPosologiaInput] = useState('');
  const [avaliando, setAvaliando] = useState<'AGUARDANDO_PAGAMENTO' | 'RECUSADO' | null>(null);

  const carregar = useCallback(
    () =>
      apiFetch('/orcamentos/admin')
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(setOrcamentos)
        .catch(() => {
          setOrcamentos((atual) => atual ?? []);
          toast.error('Não foi possível carregar os pedidos.');
        }),
    [],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrir = (o: OrcamentoAdmin) => {
    setSelecionado(o);
    setPrecoInput('');
    setRespostaInput('');
    // Renovações já chegam com o modo de uso do pedido anterior
    setPosologiaInput(o.posologia ?? '');
  };

  const handleAvaliar = async (status: 'AGUARDANDO_PAGAMENTO' | 'RECUSADO') => {
    if (!selecionado) return;
    const preco = parseFloat(precoInput.replace(',', '.'));
    if (status === 'AGUARDANDO_PAGAMENTO' && !(preco > 0)) {
      toast.error('Informe o preço da manipulação antes de enviar o orçamento.');
      return;
    }
    if (status === 'RECUSADO' && !respostaInput.trim()) {
      toast.error('Escreva o motivo da recusa: o cliente vai ler essa mensagem.');
      return;
    }

    setAvaliando(status);
    try {
      const body: Record<string, unknown> = { status, respostaAdmin: respostaInput || undefined };
      if (status === 'AGUARDANDO_PAGAMENTO') {
        body.preco = preco;
        body.posologia = posologiaInput;
      }
      const res = await apiFetch(`/orcamentos/admin/${selecionado.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.message);
      }
      await carregar();
      toast.success(status === 'AGUARDANDO_PAGAMENTO' ? 'Orçamento enviado ao cliente.' : 'Receita recusada.');
      setSelecionado(null);
    } catch (e) {
      toast.error((e as Error).message || 'Não foi possível avaliar o pedido.');
    } finally {
      setAvaliando(null);
    }
  };

  const pendentes = (orcamentos ?? []).filter((o) => o.status === 'PENDENTE');
  const contar = (s: string) => (orcamentos ?? []).filter((o) => o.status === s).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Fila do dia</h1>
        <p className="mt-1 text-lg text-muted-foreground">Receitas que esperam orçamento, da mais antiga para a mais nova.</p>
      </div>

      {/* Onde está cada pedido: atalho para a lista filtrada */}
      <nav aria-label="Resumo por status">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {RESUMO.map((status) => {
            const info = infoStatus(status);
            const Icone = info.icone;
            return (
              <li key={status} className="h-full">
                <Link
                  to={`/admin/pedidos?status=${status}`}
                  className="flex h-full min-h-18 items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-card transition-shadow hover:shadow-float"
                >
                  <span className={cn('grid size-11 shrink-0 place-items-center rounded-full', CLASSES_COR[info.cor])}>
                    <Icone aria-hidden="true" className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="tabular block text-2xl font-bold leading-tight">
                      {orcamentos === null ? '–' : contar(status)}
                    </span>
                    <span className="block leading-snug text-muted-foreground">{info.rotuloAdmin}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby="titulo-fila" className="overflow-hidden rounded-2xl bg-card shadow-card">
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <h2 id="titulo-fila" className="text-xl font-bold">
            Aguardando orçamento{' '}
            <span className="tabular text-muted-foreground">({orcamentos === null ? '…' : pendentes.length})</span>
          </h2>
          <Link to="/admin/pedidos" className="inline-flex min-h-12 items-center gap-1 font-bold text-primary hover:text-primary-hover">
            Todos os pedidos
            <ChevronRight aria-hidden="true" className="size-5" />
          </Link>
        </div>

        {orcamentos === null ? (
          <LinhasCarregando quantidade={4} />
        ) : pendentes.length === 0 ? (
          <EstadoVazio
            icone={Inbox}
            titulo="Nenhuma receita esperando"
            texto="Quando um cliente enviar uma receita, ela aparece aqui para você avaliar."
          />
        ) : (
          <ul className="divide-y">
            {[...pendentes].reverse().map((o) => (
              <li key={o.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-bold">
                    <span className="tabular">#{numeroPedido(o.id)}</span>
                    {o.observacoes?.startsWith('[Renovação') && (
                      <span className="ml-2 rounded-full bg-status-azul-soft px-2.5 py-0.5 text-sm text-status-azul">Renovação</span>
                    )}
                  </p>
                  <p className="truncate text-muted-foreground">
                    {o.familiar ? `${o.familiar.nome} (${o.familiar.parentesco})` : 'Titular'} · {o.usuario.email} ·{' '}
                    {formatarData(o.criadoEm)}
                  </p>
                </div>
                <Button onClick={() => abrir(o)}>Avaliar receita</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Avaliação: tarefa focada, merece o modal */}
      <Dialog open={selecionado !== null} onOpenChange={(aberto) => !aberto && !avaliando && setSelecionado(null)}>
        {selecionado && (
          <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Avaliar pedido #{numeroPedido(selecionado.id)}</DialogTitle>
              <DialogDescription>
                {selecionado.familiar
                  ? `${selecionado.familiar.nome} (${selecionado.familiar.parentesco})`
                  : 'Para o titular'}{' '}
                · {selecionado.usuario.email}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={selecionado.arquivoReceitaUrl} target="_blank" rel="noopener noreferrer">
                  <FileText aria-hidden="true" />
                  Abrir receita
                </a>
              </Button>
              {selecionado.anexos?.map((a, i) => (
                <Button key={a.id} asChild variant="outline" size="sm">
                  <a href={a.arquivoUrl} target="_blank" rel="noopener noreferrer" title={a.nomeArquivo}>
                    <Paperclip aria-hidden="true" />
                    Anexo {i + 1}
                  </a>
                </Button>
              ))}
            </div>

            {selecionado.observacoes && (
              <p className="rounded-xl bg-muted/60 px-4 py-3">
                <span className="font-bold">Recado do cliente:</span> {selecionado.observacoes}
              </p>
            )}

            {selecionado.itens.length > 0 && (
              <div className="tabular rounded-xl bg-muted/60 px-4 py-3">
                <p className="font-bold">Produtos pedidos</p>
                {selecionado.itens.map((i) => (
                  <p key={i.id} className="flex justify-between gap-3">
                    <span>
                      {i.produto.nome} × {i.quantidade}
                    </span>
                    <span>{formatarMoeda(Number(i.precoUnitario) * i.quantidade)}</span>
                  </p>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="avaliar-preco">Preço total (R$)</Label>
              <Input
                id="avaliar-preco"
                inputMode="decimal"
                value={precoInput}
                onChange={(e) => setPrecoInput(e.target.value)}
                placeholder="Ex.: 89,90"
                className="tabular"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="avaliar-posologia">Como tomar (aparece para o cliente)</Label>
              <Textarea
                id="avaliar-posologia"
                rows={2}
                value={posologiaInput}
                onChange={(e) => setPosologiaInput(e.target.value)}
                placeholder="Ex.: 10 gotas, 2 vezes ao dia, longe das refeições."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="avaliar-resposta">Mensagem ao cliente</Label>
              <Textarea
                id="avaliar-resposta"
                rows={2}
                value={respostaInput}
                onChange={(e) => setRespostaInput(e.target.value)}
                placeholder="Ex.: fica pronto em 3 dias úteis. (Obrigatória para recusar)"
              />
            </div>

            <DialogFooter className="gap-3">
              <Button variant="destructive-outline" onClick={() => handleAvaliar('RECUSADO')} disabled={avaliando !== null}>
                {avaliando === 'RECUSADO' ? <Loader2 aria-hidden="true" className="animate-spin" /> : <X aria-hidden="true" />}
                Recusar receita
              </Button>
              <Button onClick={() => handleAvaliar('AGUARDANDO_PAGAMENTO')} disabled={avaliando !== null}>
                {avaliando === 'AGUARDANDO_PAGAMENTO' ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : (
                  <Send aria-hidden="true" />
                )}
                Enviar orçamento
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
