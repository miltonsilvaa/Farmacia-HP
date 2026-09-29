import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';

interface Orcamento {
  id: string;
  criadoEm: string;
  status: string;
  preco: string | null;
  usuario: { email: string };
  familiar: { nome: string } | null;
}

const APROVADOS = ['PRODUCAO', 'FINALIZADO', 'ENTREGUE'];
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AdminRelatorios() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [isCarregando, setIsCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/orcamentos/admin');
        if (res.ok) setOrcamentos(await res.json());
        else toast.error('Erro ao carregar dados do relatório.');
      } catch {
        toast.error('Erro de conexão.');
      } finally {
        setIsCarregando(false);
      }
    })();
  }, []);

  const r = useMemo(() => {
    const porStatus: Record<string, number> = {};
    orcamentos.forEach((o) => (porStatus[o.status] = (porStatus[o.status] ?? 0) + 1));

    const aprovados = orcamentos.filter((o) => APROVADOS.includes(o.status) && o.preco);
    const faturamento = aprovados.reduce((s, o) => s + Number(o.preco), 0);

    const hoje = new Date();
    const meses = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1);
      const doMes = orcamentos.filter((o) => {
        const c = new Date(o.criadoEm);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      });
      return {
        label: d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        qtd: doMes.length,
        valor: doMes
          .filter((o) => APROVADOS.includes(o.status) && o.preco)
          .reduce((s, o) => s + Number(o.preco), 0),
      };
    });

    return {
      porStatus,
      faturamento,
      ticket: aprovados.length ? faturamento / aprovados.length : 0,
      meses,
    };
  }, [orcamentos]);

  const exportarCsv = () => {
    const linhas = [
      ['Pedido', 'Data', 'Cliente', 'Paciente', 'Status', 'Preço'],
      ...orcamentos.map((o) => [
        o.id.substring(0, 8).toUpperCase(),
        new Date(o.criadoEm).toLocaleDateString('pt-BR'),
        o.usuario.email,
        o.familiar?.nome ?? 'Titular',
        o.status,
        o.preco ? Number(o.preco).toFixed(2).replace('.', ',') : '',
      ]),
    ];
    const csv = '\uFEFF' + linhas.map((l) => l.map((c) => `"${c}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Relatório exportado.');
  };

  if (isCarregando) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

  const cards = [
    { label: 'Total de pedidos', valor: String(orcamentos.length) },
    { label: 'Pendentes', valor: String(r.porStatus.PENDENTE ?? 0) },
    { label: 'Faturamento aprovado', valor: brl(r.faturamento) },
    { label: 'Ticket médio', valor: brl(r.ticket) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Relatórios</h2>
          <p className="text-gray-500 text-sm mt-1">Visão geral dos pedidos (MVP)</p>
        </div>
        <button
          onClick={exportarCsv}
          disabled={orcamentos.length === 0}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
        >
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{c.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{c.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Pedidos por status</h3>
          {Object.keys(r.porStatus).length === 0 ? (
            <p className="text-sm text-gray-400">Sem pedidos.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {Object.entries(r.porStatus).map(([s, n]) => (
                <li key={s} className="flex justify-between text-sm">
                  <span className="text-gray-600">{s.replace('_', ' ')}</span>
                  <span className="font-semibold text-gray-800">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
          <h3 className="font-semibold text-gray-700 mb-3">Últimos 6 meses</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="py-1">Mês</th>
                <th className="py-1">Pedidos</th>
                <th className="py-1">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {r.meses.map((m) => (
                <tr key={m.label} className="border-t border-gray-100">
                  <td className="py-2 text-gray-600">{m.label}</td>
                  <td className="py-2 font-medium">{m.qtd}</td>
                  <td className="py-2 font-medium text-green-700">{brl(m.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
