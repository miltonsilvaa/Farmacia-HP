import { useState, useEffect, Fragment } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';

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

const badgeClass: Record<string, string> = {
  PENDENTE: 'bg-orange-100 text-orange-700',
  AGUARDANDO_PAGAMENTO: 'bg-blue-100 text-blue-700',
  PRODUCAO: 'bg-emerald-100 text-emerald-700',
  RECUSADO: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-gray-100 text-gray-600',
  FINALIZADO: 'bg-green-100 text-green-800',
  ENTREGUE: 'bg-teal-100 text-teal-800',
};

const statusLabel: Record<string, string> = {
  TODOS: 'Todos',
  PENDENTE: 'Pendente',
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PRODUCAO: 'Em produção',
  FINALIZADO: 'Pronto',
  ENTREGUE: 'Entregue',
  RECUSADO: 'Recusado',
  CANCELADO: 'Cancelado',
};

export default function AdminPedidos() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoAdmin[]>([]);
  const [isCarregando, setIsCarregando] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('TODOS');

  const [mudanca, setMudanca] = useState<{ pedido: OrcamentoAdmin; para: 'FINALIZADO' | 'ENTREGUE' } | null>(null);
  const [isMudando, setIsMudando] = useState(false);
  const [processandoErp, setProcessandoErp] = useState<string | null>(null);

  const statusFiltro = Object.keys(statusLabel);
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

  const atualizarPedido = (id: string, dados: Partial<OrcamentoAdmin>) =>
    setOrcamentos((prev) => prev.map((o) => (o.id === id ? { ...o, ...dados } : o)));

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
        para === 'FINALIZADO'
          ? 'Pedido marcado como pronto. O cliente foi avisado por e-mail.'
          : 'Pedido marcado como entregue.',
      );
    } catch (e) {
      toast.error((e as Error).message || 'Não foi possível atualizar o pedido.');
    } finally {
      setIsMudando(false);
      setMudanca(null);
    }
  };

  const [editandoPosologia, setEditandoPosologia] = useState<OrcamentoAdmin | null>(null);
  const [posologiaTexto, setPosologiaTexto] = useState('');
  const [isSalvandoPosologia, setIsSalvandoPosologia] = useState(false);

  const abrirPosologia = (o: OrcamentoAdmin) => {
    setEditandoPosologia(o);
    setPosologiaTexto(o.posologia ?? '');
  };

  const handleSalvarPosologia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoPosologia) return;
    setIsSalvandoPosologia(true);
    try {
      const res = await apiFetch(`/orcamentos/admin/${editandoPosologia.id}/posologia`, {
        method: 'PATCH',
        body: JSON.stringify({ posologia: posologiaTexto }),
      });
      if (!res.ok) throw new Error();
      const { posologia } = await res.json();
      atualizarPedido(editandoPosologia.id, { posologia });
      toast.success('Modo de uso salvo. O cliente já vê no histórico do pedido.');
      setEditandoPosologia(null);
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
      if (resultado.erpStatus === 'ENVIADO') {
        toast.success('Pedido enviado ao ERP.');
      } else {
        toast.error(`Falha no envio ao ERP: ${resultado.erpErro ?? 'erro desconhecido'}`);
      }
    } catch {
      toast.error('Erro de conexão ao enviar ao ERP.');
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
      link.download = `pedido-${id.substring(0, 8).toUpperCase()}.${formato}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível gerar o arquivo.');
    }
  };

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
            {statusLabel[s]} ({contar(s)})
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
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">ERP</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((o) => (
                    <Fragment key={o.id}>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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
                            {statusLabel[o.status] ?? o.status}
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
                        <td className="py-4 px-5 text-sm">
                          {o.erpStatus === 'ENVIADO' && (
                            <span
                              className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700"
                              title={o.erpEnviadoEm ? `Enviado em ${new Date(o.erpEnviadoEm).toLocaleString('pt-BR')}` : undefined}
                            >
                              Enviado
                            </span>
                          )}
                          {o.erpStatus === 'ERRO' && (
                            <span
                              className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700"
                              title={o.erpErro ?? undefined}
                            >
                              Falhou
                            </span>
                          )}
                          {!o.erpStatus && <span className="text-gray-400">—</span>}
                          <div className="flex gap-2 mt-1 text-xs">
                            <button onClick={() => handleExportar(o.id, 'json')} className="text-blue-600 hover:underline">
                              JSON
                            </button>
                            <button onClick={() => handleExportar(o.id, 'xml')} className="text-blue-600 hover:underline">
                              XML
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-col items-end gap-1">
                            {(o.status === 'PRODUCAO' || o.status === 'FINALIZADO') && (
                              <button
                                onClick={() =>
                                  setMudanca({ pedido: o, para: o.status === 'PRODUCAO' ? 'FINALIZADO' : 'ENTREGUE' })
                                }
                                className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
                              >
                                {o.status === 'PRODUCAO' ? 'Marcar pronto' : 'Marcar entregue'}
                              </button>
                            )}
                            {['PRODUCAO', 'FINALIZADO', 'ENTREGUE'].includes(o.status) && (
                              <button
                                onClick={() => handleEnviarErp(o.id)}
                                disabled={processandoErp === o.id}
                                className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                              >
                                {processandoErp === o.id
                                  ? 'Enviando...'
                                  : o.erpStatus
                                    ? 'Reenviar ao ERP'
                                    : 'Enviar ao ERP'}
                              </button>
                            )}
                            {!['RECUSADO', 'CANCELADO'].includes(o.status) && (
                              <button
                                onClick={() => abrirPosologia(o)}
                                className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 font-semibold rounded-lg transition-colors whitespace-nowrap"
                              >
                                {o.posologia ? 'Editar modo de uso' : 'Adicionar modo de uso'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandido === o.id && o.itens.length > 0 && (
                        <tr key={`${o.id}-itens`} className="bg-blue-50">
                          <td colSpan={10} className="px-8 py-3">
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
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {editandoPosologia && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSalvarPosologia}
            role="dialog"
            aria-modal="true"
            aria-labelledby="posologia-titulo"
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4"
          >
            <h2 id="posologia-titulo" className="text-lg font-bold text-gray-800">
              Modo de uso — Pedido #{editandoPosologia.id.substring(0, 8).toUpperCase()}
            </h2>
            <div>
              <label htmlFor="posologia-texto" className="block text-sm font-semibold text-gray-700 mb-1">
                Posologia exibida ao cliente
              </label>
              <textarea
                id="posologia-texto"
                rows={4}
                autoFocus
                value={posologiaTexto}
                onChange={(e) => setPosologiaTexto(e.target.value)}
                disabled={isSalvandoPosologia}
                placeholder="Ex: Tomar 10 gotas, 2 vezes ao dia, longe das refeições."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Deixe em branco para remover.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setEditandoPosologia(null)}
                disabled={isSalvandoPosologia}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSalvandoPosologia}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isSalvandoPosologia ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        aberto={mudanca !== null}
        titulo={mudanca?.para === 'ENTREGUE' ? 'Confirmar entrega' : 'Pedido pronto'}
        mensagem={`Confirmar que o pedido #${mudanca?.pedido.id.substring(0, 8).toUpperCase() ?? ''} ${
          mudanca?.para === 'ENTREGUE' ? 'foi entregue' : 'está pronto para retirada/envio'
        }? O cliente receberá um e-mail.`}
        textoConfirmar={mudanca?.para === 'ENTREGUE' ? 'Marcar entregue' : 'Marcar pronto'}
        variante="primario"
        processando={isMudando}
        onConfirmar={handleMudarStatus}
        onCancelar={() => setMudanca(null)}
      />
    </div>
  );
}
