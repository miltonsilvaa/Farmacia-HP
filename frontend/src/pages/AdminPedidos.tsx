import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';

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
  preco: string | null;
  usuario: { email: string };
  itens: OrcamentoItem[];
  anexos: { id: string; arquivoUrl: string; nomeArquivo: string }[];
  familiar: { nome: string; parentesco: string } | null;
}

const badgeClass: Record<string, string> = {
  PENDENTE: 'bg-orange-100 text-orange-700',
  AGUARDANDO_PAGAMENTO: 'bg-blue-100 text-blue-700',
  RECUSADO: 'bg-red-100 text-red-700',
  FINALIZADO: 'bg-green-100 text-green-700',
};

export default function AdminPedidos() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoAdmin[]>([]);
  const [isCarregando, setIsCarregando] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('TODOS');

  const statusFiltro = ['TODOS', 'PENDENTE', 'AGUARDANDO_PAGAMENTO', 'RECUSADO', 'FINALIZADO'];
  const contar = (s: string) =>
    s === 'TODOS' ? orcamentos.length : orcamentos.filter((o) => o.status === s).length;

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await apiFetch('/orcamentos/admin');
        if (res.ok) {
          setOrcamentos(await res.json());
        } else {
          toast.error('Erro ao carregar pedidos.');
        }
      } catch {
        toast.error('Erro de conexão.');
      } finally {
        setIsCarregando(false);
      }
    };
    carregar();
  }, []);

  const lista = filtro === 'TODOS' ? orcamentos : orcamentos.filter((o) => o.status === filtro);

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Histórico Completo</h2>
        <p className="text-gray-500 text-sm mt-1">
          {isCarregando ? '...' : `${orcamentos.length} pedido(s) encontrado(s)`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar pedidos por status">
        {statusFiltro.map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            aria-pressed={filtro === s}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filtro === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s.replace('_', ' ')} ({contar(s)})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isCarregando ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : lista.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {orcamentos.length === 0
                ? 'Nenhum pedido registrado ainda.'
                : 'Nenhum pedido com esse status.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pedido</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paciente</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receita</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Itens</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((o) => (
                    <>
                      <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-5 font-mono text-sm font-semibold text-gray-700">
                          #{o.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="py-4 px-5 text-sm text-gray-600">{o.usuario.email}</td>
                        <td className="py-4 px-5 text-sm text-gray-700">
                          {o.familiar ? (
                            <span>
                              {o.familiar.nome}{' '}
                              <span className="text-xs text-gray-400">({o.familiar.parentesco})</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Titular</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-sm text-gray-500">{formatarData(o.criadoEm)}</td>
                        <td className="py-4 px-5">
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded-full ${
                              badgeClass[o.status] ?? 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {o.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-sm font-medium text-green-700">
                          {o.preco
                            ? `R$ ${Number(o.preco).toFixed(2).replace('.', ',')}`
                            : '—'}
                        </td>
                        <td className="py-4 px-5">
                          <a
                            href={o.arquivoReceitaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Ver arquivo
                          </a>
                          {o.anexos?.map((anexo, i) => (
                            <a
                              key={anexo.id}
                              href={anexo.arquivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={anexo.nomeArquivo}
                              className="block text-blue-600 hover:underline text-xs mt-1"
                            >
                              Anexo {i + 1}
                            </a>
                          ))}
                        </td>
                        <td className="py-4 px-5">
                          {o.itens && o.itens.length > 0 ? (
                            <button
                              onClick={() => setExpandido(expandido === o.id ? null : o.id)}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {o.itens.length} item(ns) {expandido === o.id ? '▲' : '▼'}
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                      {expandido === o.id && o.itens.length > 0 && (
                        <tr key={`${o.id}-itens`} className="bg-blue-50">
                          <td colSpan={7} className="px-8 py-3">
                            <div className="flex flex-col gap-1">
                              {o.itens.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm text-gray-700 max-w-md">
                                  <span>{item.produto.nome} × {item.quantidade}</span>
                                  <span className="text-gray-500">
                                    R$ {(Number(item.precoUnitario) * item.quantidade).toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
