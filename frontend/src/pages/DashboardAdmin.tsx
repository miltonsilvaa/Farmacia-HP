import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  posologia: string | null;
  preco: string | null;
  usuario: { email: string };
  itens: OrcamentoItem[];
  familiar: { nome: string; parentesco: string } | null;
}

export default function DashboardAdmin() {
  const [orcamentos, setOrcamentos] = useState<OrcamentoAdmin[]>([]);
  const [isCarregando, setIsCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState<OrcamentoAdmin | null>(null);
  const [precoInput, setPrecoInput] = useState('');
  const [respostaInput, setRespostaInput] = useState('');
  const [posologiaInput, setPosologiaInput] = useState('');
  const [isAvaliando, setIsAvaliando] = useState(false);

  useEffect(() => {
    carregarOrcamentos();
  }, []);

  const carregarOrcamentos = async () => {
    setIsCarregando(true);
    try {
      const res = await apiFetch('/orcamentos/admin');
      if (res.ok) {
        setOrcamentos(await res.json());
      } else {
        toast.error('Erro ao carregar orçamentos.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setIsCarregando(false);
    }
  };

  const handleAvaliar = async (status: 'AGUARDANDO_PAGAMENTO' | 'RECUSADO') => {
    if (!selecionado) return;
    if (status === 'AGUARDANDO_PAGAMENTO' && !precoInput) {
      toast.error('Informe o preço antes de enviar o orçamento.');
      return;
    }

    setIsAvaliando(true);
    try {
      const body: Record<string, unknown> = {
        status,
        respostaAdmin: respostaInput || undefined,
      };
      if (status === 'AGUARDANDO_PAGAMENTO') {
        body.preco = parseFloat(precoInput.replace(',', '.'));
        body.posologia = posologiaInput;
      }

      const res = await apiFetch(`/orcamentos/admin/${selecionado.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      const atualizado = await res.json();
      setOrcamentos((prev) =>
        prev.map((o) => (o.id === atualizado.id ? { ...o, ...atualizado } : o)),
      );
      toast.success(
        status === 'AGUARDANDO_PAGAMENTO'
          ? 'Orçamento enviado ao cliente!'
          : 'Receita recusada.',
      );
      setSelecionado(null);
      setPrecoInput('');
      setRespostaInput('');
      setPosologiaInput('');
    } catch {
      toast.error('Erro ao avaliar orçamento.');
    } finally {
      setIsAvaliando(false);
    }
  };

  const pendentes = orcamentos.filter((o) => o.status === 'PENDENTE');
  const aguardando = orcamentos.filter((o) => o.status === 'AGUARDANDO_PAGAMENTO');
  const finalizados = orcamentos.filter(
    (o) => o.status !== 'PENDENTE' && o.status !== 'AGUARDANDO_PAGAMENTO',
  );

  const formatarData = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bem-vindo, Farmacêutico!</h2>
          <p className="text-gray-600">Confira as solicitações de orçamento do dia.</p>
        </div>
        <Link
          to="/admin/produtos"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
        >
          Gerenciar Catálogo
        </Link>
      </div>

      {/* Estatísticas reais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Pedidos Pendentes</p>
          <p className="text-3xl font-bold text-orange-600">
            {isCarregando ? '—' : pendentes.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Aguardando Pagamento</p>
          <p className="text-3xl font-bold text-blue-600">
            {isCarregando ? '—' : aguardando.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Finalizados / Recusados</p>
          <p className="text-3xl font-bold text-green-600">
            {isCarregando ? '—' : finalizados.length}
          </p>
        </div>
      </div>

      {/* Caixa de Entrada */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg">Últimas Receitas Recebidas (Pendentes)</h3>
          <Link
            to="/admin/pedidos"
            className="text-blue-600 text-sm font-semibold hover:underline"
          >
            Ver todas
          </Link>
        </div>

        {isCarregando ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : pendentes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📂</div>
            <p>Nenhuma receita pendente no momento.</p>
            <p className="text-sm">Novas solicitações aparecerão automaticamente aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendentes.map((o) => (
              <div
                key={o.id}
                className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-orange-50 text-orange-500 p-3 rounded-lg text-xl">📄</div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      Pedido #{o.id.substring(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {o.usuario.email} · {formatarData(o.criadoEm)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelecionado(o);
                    setPrecoInput('');
                    setRespostaInput('');
                    // Renovações já chegam com o modo de uso do pedido anterior
                    setPosologiaInput(o.posologia ?? '');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Avaliar Receita
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Avaliação */}
      {selecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">
                Avaliar Pedido #{selecionado.id.substring(0, 8).toUpperCase()}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Cliente: {selecionado.usuario.email}
              </p>
              <p className="text-sm text-gray-500">
                Paciente:{' '}
                <span className="font-medium text-gray-700">
                  {selecionado.familiar
                    ? `${selecionado.familiar.nome} (${selecionado.familiar.parentesco})`
                    : 'Titular da Conta'}
                </span>
              </p>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Link da receita */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Receita Médica</p>
                <a
                  href={selecionado.arquivoReceitaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <span>📎</span> Abrir arquivo da receita
                </a>
                {selecionado.observacoes && (
                  <p className="mt-2 text-sm text-gray-500 italic">
                    Obs. do cliente: {selecionado.observacoes}
                  </p>
                )}

                {/* Itens do pedido */}
                {selecionado.itens && selecionado.itens.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Produtos solicitados
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-1">
                      {selecionado.itens.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-gray-700">
                          <span>{item.produto.nome} × {item.quantidade}</span>
                          <span className="text-gray-500">
                            R$ {(Number(item.precoUnitario) * item.quantidade).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Preço */}
              <div>
                <label htmlFor="dashboardadmin-campo-1" className="block text-sm font-semibold text-gray-700 mb-1">
                  Preço da Manipulação (R$)
                </label>
                <input id="dashboardadmin-campo-1"
                  type="number"
                  min="0"
                  step="0.01"
                  value={precoInput}
                  onChange={(e) => setPrecoInput(e.target.value)}
                  placeholder="Ex: 89.90"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Resposta */}
              <div>
                <label htmlFor="dashboardadmin-campo-2" className="block text-sm font-semibold text-gray-700 mb-1">
                  Observações ao Cliente (Opcional)
                </label>
                <textarea id="dashboardadmin-campo-2"
                  rows={3}
                  value={respostaInput}
                  onChange={(e) => setRespostaInput(e.target.value)}
                  placeholder="Ex: Prazo de preparo: 3 dias úteis."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Posologia */}
              <div>
                <label htmlFor="dashboardadmin-posologia" className="block text-sm font-semibold text-gray-700 mb-1">
                  Modo de Uso / Posologia (Opcional)
                </label>
                <textarea id="dashboardadmin-posologia"
                  rows={2}
                  value={posologiaInput}
                  onChange={(e) => setPosologiaInput(e.target.value)}
                  placeholder="Ex: Tomar 10 gotas, 2 vezes ao dia, longe das refeições."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Aparece para o cliente no histórico do pedido. Pode ser ajustado depois em Pedidos.
                </p>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3 justify-end">
              <button
                onClick={() => setSelecionado(null)}
                disabled={isAvaliando}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAvaliar('RECUSADO')}
                disabled={isAvaliando}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isAvaliando ? '...' : 'Recusar Receita'}
              </button>
              <button
                onClick={() => handleAvaliar('AGUARDANDO_PAGAMENTO')}
                disabled={isAvaliando}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isAvaliando ? '...' : 'Enviar Orçamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
