import { useEffect, useMemo, useState } from 'react';
import { ChartColumn, Download } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatarMoeda, numeroPedido } from '@/lib/format';
import { PONTO_COR, STATUS, infoStatus } from '@/lib/status';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import EstadoVazio from '@/components/EstadoVazio';

interface Orcamento {
  id: string;
  criadoEm: string;
  status: string;
  preco: string | null;
  usuario: { email: string };
  familiar: { nome: string } | null;
}

const APROVADOS = ['PRODUCAO', 'FINALIZADO', 'ENTREGUE'];

export default function AdminRelatorios() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[] | null>(null);

  useEffect(() => {
    apiFetch('/orcamentos/admin')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setOrcamentos)
      .catch(() => {
        setOrcamentos([]);
        toast.error('Não foi possível carregar os dados do relatório.');
      });
  }, []);

  const r = useMemo(() => {
    const lista = orcamentos ?? [];
    const porStatus: Record<string, number> = {};
    lista.forEach((o) => (porStatus[o.status] = (porStatus[o.status] ?? 0) + 1));

    const aprovados = lista.filter((o) => APROVADOS.includes(o.status) && o.preco);
    const faturamento = aprovados.reduce((s, o) => s + Number(o.preco), 0);

    const hoje = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
      const doMes = lista.filter((o) => {
        const c = new Date(o.criadoEm);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      });
      return {
        rotulo: ((t) => t.charAt(0).toUpperCase() + t.slice(1))(
          d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        ),
        qtd: doMes.length,
        valor: doMes.filter((o) => APROVADOS.includes(o.status) && o.preco).reduce((s, o) => s + Number(o.preco), 0),
      };
    });
    const maiorMes = Math.max(1, ...meses.map((m) => m.valor));

    return { porStatus, faturamento, ticket: aprovados.length ? faturamento / aprovados.length : 0, meses, maiorMes };
  }, [orcamentos]);

  const exportarCsv = () => {
    if (!orcamentos) return;
    const linhas = [
      ['Pedido', 'Data', 'Cliente', 'Paciente', 'Status', 'Preço'],
      ...orcamentos.map((o) => [
        numeroPedido(o.id),
        new Date(o.criadoEm).toLocaleDateString('pt-BR'),
        o.usuario.email,
        o.familiar?.nome ?? 'Titular',
        infoStatus(o.status).rotuloAdmin,
        o.preco ? Number(o.preco).toFixed(2).replace('.', ',') : '',
      ]),
    ];
    const csv = '﻿' + linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Planilha baixada. Abre no Excel.');
  };

  const total = orcamentos?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="mt-1 text-lg text-muted-foreground">Visão geral dos pedidos e do faturamento aprovado.</p>
        </div>
        <Button onClick={exportarCsv} disabled={!total}>
          <Download aria-hidden="true" />
          Baixar planilha (CSV)
        </Button>
      </div>

      {orcamentos === null ? (
        <div role="status" aria-label="Carregando" className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-28 rounded-2xl md:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : total === 0 ? (
        <div className="rounded-2xl bg-card shadow-card">
          <EstadoVazio icone={ChartColumn} titulo="Ainda sem dados" texto="O relatório se monta sozinho conforme os pedidos chegam." />
        </div>
      ) : (
        <>
          <dl className="tabular grid divide-y rounded-2xl bg-card shadow-card sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {[
              { rotulo: 'Pedidos no total', valor: String(total) },
              { rotulo: 'Aguardando orçamento', valor: String(r.porStatus.PENDENTE ?? 0) },
              { rotulo: 'Faturamento aprovado', valor: formatarMoeda(r.faturamento) },
              { rotulo: 'Valor médio por pedido', valor: formatarMoeda(r.ticket) },
            ].map((m) => (
              <div key={m.rotulo} className="px-5 py-4">
                <dt className="text-muted-foreground">{m.rotulo}</dt>
                <dd className="text-2xl font-bold">{m.valor}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-4 md:grid-cols-2">
            <section aria-labelledby="titulo-status" className="rounded-2xl bg-card p-5 shadow-card">
              <h2 id="titulo-status" className="text-xl font-bold">
                Pedidos por status
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {Object.keys(STATUS)
                  .filter((s) => r.porStatus[s])
                  .map((s) => {
                    const n = r.porStatus[s];
                    return (
                      <li key={s}>
                        <div className="tabular flex justify-between gap-3">
                          <span>{STATUS[s].rotuloAdmin}</span>
                          <span className="font-bold">
                            {n} <span className="font-normal text-muted-foreground">({Math.round((n / total) * 100)}%)</span>
                          </span>
                        </div>
                        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                          <div
                            className={cn('h-full rounded-full', PONTO_COR[STATUS[s].cor])}
                            style={{ width: `${(n / total) * 100}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </section>

            <section aria-labelledby="titulo-meses" className="rounded-2xl bg-card p-5 shadow-card">
              <h2 id="titulo-meses" className="text-xl font-bold">
                Últimos 6 meses
              </h2>
              <table className="tabular mt-4 w-full text-left">
                <thead>
                  <tr className="text-sm text-muted-foreground">
                    <th scope="col" className="pb-2 font-bold">Mês</th>
                    <th scope="col" className="pb-2 text-right font-bold">Pedidos</th>
                    <th scope="col" className="pb-2 pl-4 font-bold">Faturamento</th>
                  </tr>
                </thead>
                <tbody>
                  {r.meses.map((m) => (
                    <tr key={m.rotulo} className="border-t">
                      <td className="py-2.5">{m.rotulo}</td>
                      <td className="py-2.5 text-right font-bold">{m.qtd}</td>
                      <td className="py-2.5 pl-4">
                        <div className="flex items-center gap-3">
                          <span className="h-2.5 min-w-1 rounded-full bg-primary" style={{ width: `${(m.valor / r.maiorMes) * 45}%` }} aria-hidden="true" />
                          <span className="font-bold whitespace-nowrap">{formatarMoeda(m.valor)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
