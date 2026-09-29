import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import LinhaDoTempoPedido from '../components/LinhaDoTempoPedido';
import SuporteWhatsApp from '../components/SuporteWhatsApp';
import ComoTomar from '../components/ComoTomar';

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

const STATUS_RENOVAVEIS = ['PRODUCAO', 'FINALIZADO', 'ENTREGUE'];

const badgeClass: Record<string, string> = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  AGUARDANDO_PAGAMENTO: 'bg-blue-100 text-blue-700',
  PRODUCAO: 'bg-green-100 text-green-700',
  FINALIZADO: 'bg-emerald-100 text-emerald-800',
  ENTREGUE: 'bg-teal-100 text-teal-800',
  CANCELADO: 'bg-gray-100 text-gray-500',
  RECUSADO: 'bg-red-100 text-red-700',
};

const badgeLabel: Record<string, string> = {
  PENDENTE: 'Pendente',
  AGUARDANDO_PAGAMENTO: 'Orçamento Disponível',
  PRODUCAO: 'Em Produção',
  FINALIZADO: 'Pronto para retirada',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
  RECUSADO: 'Recusado',
};

function PainelAcao({
  pedido,
  isRespondendo,
  isRenovando,
  onResponder,
  onRenovar,
}: {
  pedido: Pedido;
  isRespondendo: string | null;
  isRenovando: string | null;
  onResponder: (id: string, acao: 'APROVAR' | 'RECUSAR') => void;
  onRenovar: (id: string) => void;
}) {
  const processandoResposta = isRespondendo === pedido.id;
  const processandoRenovacao = isRenovando === pedido.id;

  if (pedido.status === 'AGUARDANDO_PAGAMENTO') {
    return (
      <div className="ml-0 md:ml-14 bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">
            Orçamento do Farmacêutico
          </p>
          <p className="text-3xl font-bold text-blue-700">
            {pedido.preco
              ? `R$ ${Number(pedido.preco).toFixed(2).replace('.', ',')}`
              : '—'}
          </p>
          {pedido.respostaAdmin && (
            <p className="mt-2 text-sm text-gray-600 italic">
              "{pedido.respostaAdmin}"
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onResponder(pedido.id, 'APROVAR')}
            disabled={processandoResposta}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {processandoResposta ? 'Processando...' : <><span aria-hidden="true">✅</span> Aprovar Orçamento</>}
          </button>
          <button
            onClick={() => onResponder(pedido.id, 'RECUSAR')}
            disabled={processandoResposta}
            className="flex-1 py-2.5 border border-red-300 text-red-600 hover:bg-red-50 font-bold rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {processandoResposta ? 'Processando...' : <><span aria-hidden="true">❌</span> Recusar</>}
          </button>
        </div>
      </div>
    );
  }

  if (STATUS_RENOVAVEIS.includes(pedido.status)) {
    return (
      <div className="ml-0 md:ml-14 flex flex-col gap-3">
        {pedido.preco && (
          <p className="text-sm text-gray-500">
            Valor:{' '}
            <span className="font-semibold text-gray-700">
              R$ {Number(pedido.preco).toFixed(2).replace('.', ',')}
            </span>
          </p>
        )}
        <div>
          <button
            onClick={() => onRenovar(pedido.id)}
            disabled={processandoRenovacao}
            className="px-5 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {processandoRenovacao ? 'Enviando...' : <><span aria-hidden="true">🔄</span> Renovar em 1 clique</>}
          </button>
        </div>
      </div>
    );
  }

  if (pedido.status === 'PENDENTE') {
    return (
      <p className="ml-0 md:ml-14 text-sm text-gray-400 italic">
        Aguardando avaliação da farmácia...
      </p>
    );
  }

  if (pedido.status === 'RECUSADO' || pedido.status === 'CANCELADO') {
    return (
      <p className="ml-0 md:ml-14 text-sm text-gray-400">
        {pedido.status === 'RECUSADO'
          ? 'Receita recusada pela farmácia. Entre em contato para mais informações.'
          : 'Pedido cancelado.'}
      </p>
    );
  }

  return null;
}

export default function MeusPedidos() {
  const navigate = useNavigate();
  // Vindo do e-mail de lembrete de recompra: /meus-pedidos?renovar=<id>
  const [searchParams, setSearchParams] = useSearchParams();
  const renovarId = searchParams.get('renovar');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isRespondendo, setIsRespondendo] = useState<string | null>(null);
  const [isRenovando, setIsRenovando] = useState<string | null>(null);
  const [isCarregando, setIsCarregando] = useState(true);

  const carregar = useCallback(
    () =>
      apiFetch('/orcamentos')
        .then(async (response) => {
          if (response.ok) {
            setPedidos(await response.json());
          } else {
            toast.error('Não foi possível carregar seus pedidos.');
          }
        })
        .catch(() => toast.error('Erro de conexão ao carregar pedidos.'))
        .finally(() => setIsCarregando(false)),
    [],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleResponder = async (pedidoId: string, acao: 'APROVAR' | 'RECUSAR') => {
    setIsRespondendo(pedidoId);
    try {
      const response = await apiFetch(`/orcamentos/${pedidoId}/responder-cliente`, {
        method: 'PATCH',
        body: JSON.stringify({ acao }),
      });

      if (!response.ok) throw new Error();

      const atualizado = await response.json();
      setPedidos((prev) =>
        prev.map((p) => (p.id === atualizado.id ? { ...p, status: atualizado.status } : p)),
      );

      toast.success(
        acao === 'APROVAR'
          ? 'Orçamento aprovado! Entrando em produção.'
          : 'Orçamento recusado.',
      );
    } catch {
      toast.error('Erro ao processar resposta. Tente novamente.');
    } finally {
      setIsRespondendo(null);
    }
  };

  const handleRenovar = async (pedidoId: string) => {
    setIsRenovando(pedidoId);
    try {
      const response = await apiFetch(`/orcamentos/${pedidoId}/renovar`, { method: 'POST' });
      if (!response.ok) throw new Error();
      const { itensIndisponiveis } = await response.json();
      await carregar();
      toast.success(
        itensIndisponiveis > 0
          ? `Renovação enviada! ${itensIndisponiveis} produto(s) não estão mais disponíveis e ficaram de fora.`
          : 'Renovação enviada com a mesma receita e produtos! O farmacêutico já foi notificado.',
      );
    } catch {
      toast.error('Erro ao solicitar renovação. Tente novamente.');
    } finally {
      setIsRenovando(null);
    }
  };

  const pedidoLembrete = renovarId
    ? pedidos.find((p) => p.id === renovarId && STATUS_RENOVAVEIS.includes(p.status))
    : undefined;

  useEffect(() => {
    if (pedidoLembrete) {
      document.getElementById(`pedido-${pedidoLembrete.id}`)?.scrollIntoView({ block: 'center' });
    }
  }, [pedidoLembrete]);

  const fecharLembrete = () => setSearchParams({}, { replace: true });

  const renovarDoLembrete = async (id: string) => {
    await handleRenovar(id);
    fecharLembrete();
  };

  const formatarData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Meus Pedidos</h1>
        <p className="text-gray-600 mt-2">
          Acompanhe seus orçamentos ou renove medicamentos de uso contínuo com um clique.
        </p>
      </div>

      {pedidoLembrete && (
        <div
          role="region"
          aria-label="Lembrete de renovação"
          className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <p className="font-bold text-emerald-900 text-lg">Seu medicamento está acabando?</p>
            <p className="text-sm text-emerald-800 mt-1">
              Renove o pedido #{pedidoLembrete.id.substring(0, 8).toUpperCase()} com a mesma receita
              e os mesmos produtos.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => renovarDoLembrete(pedidoLembrete.id)}
              disabled={isRenovando === pedidoLembrete.id}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {isRenovando === pedidoLembrete.id ? 'Enviando...' : 'Renovar agora'}
            </button>
            <button
              onClick={fecharLembrete}
              className="px-4 py-3 text-emerald-800 hover:bg-emerald-100 font-semibold rounded-lg transition-colors"
            >
              Agora não
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isCarregando ? (
          <div className="p-8 text-center text-gray-500" role="status">Carregando...</div>
        ) : pedidos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Você ainda não tem nenhum pedido com a gente.</p>
            <button
              onClick={() => navigate('/novo-orcamento')}
              className="mt-4 text-blue-600 font-semibold hover:underline"
            >
              Fazer meu primeiro orçamento
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                id={`pedido-${pedido.id}`}
                className={`p-6 flex flex-col gap-4 transition-colors ${
                  pedidoLembrete?.id === pedido.id ? 'bg-emerald-50/60' : 'hover:bg-gray-50'
                }`}
              >
                {/* Cabeçalho do card */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-lg text-xl" aria-hidden="true">
                      {pedido.familiar?.tipo === 'PET' ? '🐾' : '📄'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        Pedido #{pedido.id.substring(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Enviado em: {formatarData(pedido.criadoEm)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Paciente:{' '}
                        {pedido.familiar
                          ? `${pedido.familiar.nome} (${
                              pedido.familiar.tipo === 'PET'
                                ? `Pet${pedido.familiar.especie ? ` · ${pedido.familiar.especie}` : ''}`
                                : pedido.familiar.parentesco
                            })`
                          : 'Titular da Conta'}
                      </p>
                      {pedido.solicitadoPor && (
                        <p className="text-xs text-gray-400">Solicitado por {pedido.solicitadoPor}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      badgeClass[pedido.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {badgeLabel[pedido.status] ?? pedido.status}
                  </span>
                </div>

                {/* Onde está meu remédio? */}
                <div className="ml-0 md:ml-14">
                  <LinhaDoTempoPedido status={pedido.status} />
                </div>

                {pedido.posologia && (
                  <div className="ml-0 md:ml-14">
                    <ComoTomar posologia={pedido.posologia} />
                  </div>
                )}

                {/* Painel condicional por status */}
                <PainelAcao
                  pedido={pedido}
                  isRespondendo={isRespondendo}
                  isRenovando={isRenovando}
                  onResponder={handleResponder}
                  onRenovar={handleRenovar}
                />

                {/* Arquivos enviados */}
                <div className="ml-0 md:ml-14 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <a
                    href={pedido.arquivoReceitaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Ver receita
                  </a>
                  {pedido.anexos?.map((anexo) => (
                    <a
                      key={anexo.id}
                      href={anexo.arquivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-[200px]"
                    >
                      {anexo.nomeArquivo}
                    </a>
                  ))}
                </div>

                <div className="ml-0 md:ml-14">
                  <SuporteWhatsApp pedidoId={pedido.id} />
                </div>

                {/* Itens do pedido — sempre visíveis quando presentes */}
                {pedido.itens && pedido.itens.length > 0 && (
                  <div className="ml-0 md:ml-14">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Produtos solicitados
                    </p>
                    <div className="flex flex-col gap-1">
                      {pedido.itens.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-gray-600">
                          <span>
                            {item.produto.nome} × {item.quantidade}
                          </span>
                          <span className="text-gray-500">
                            R${' '}
                            {(Number(item.precoUnitario) * item.quantidade)
                              .toFixed(2)
                              .replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
