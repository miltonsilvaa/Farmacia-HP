import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: string;
  imagemUrl: string | null;
}

interface Familiar {
  id: string;
  nome: string;
  parentesco: string;
  tipo: 'PESSOA' | 'PET';
  especie: string | null;
  proprio: boolean;
  titularEmail: string | null;
}

const MAX_ANEXOS = 5;

function rotuloFamiliar(f: Familiar) {
  const detalhe = f.tipo === 'PET' ? `Pet${f.especie ? ` · ${f.especie}` : ''}` : f.parentesco;
  return `${f.nome} — ${detalhe}`;
}

interface ItemCarrinho {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
}

export default function NovoOrcamento() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [anexos, setAnexos] = useState<File[]>([]);
  const [sugestoes, setSugestoes] = useState<Produto[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [familiarId, setFamiliarId] = useState('');
  const [carrinho, setCarrinho] = useState<Map<string, ItemCarrinho>>(new Map());
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/produtos')
      .then((r) => (r.ok ? r.json() : []))
      .then(setProdutos)
      .catch(() => {});

    apiFetch('/familiares')
      .then((r) => (r.ok ? r.json() : []))
      .then(setFamiliares)
      .catch(() => {});
  }, []);

  // Sugestões de produtos complementares aos que já estão no pedido
  const idsNoCarrinho = Array.from(carrinho.keys()).sort().join(',');
  useEffect(() => {
    if (!idsNoCarrinho) return;
    let cancelado = false;
    apiFetch(`/produtos/sugestoes?ids=${encodeURIComponent(idsNoCarrinho)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((lista) => {
        if (!cancelado) setSugestoes(lista);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [idsNoCarrinho]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setArquivo(e.target.files[0]);
  };

  const handleAnexosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novos = Array.from(e.target.files ?? []);
    e.target.value = '';
    const muitoGrandes = novos.filter((f) => f.size > 10 * 1024 * 1024);
    if (muitoGrandes.length > 0) {
      toast.error('Cada anexo pode ter no máximo 10MB.');
    }
    setAnexos((prev) => {
      const combinados = [...prev, ...novos.filter((f) => f.size <= 10 * 1024 * 1024)];
      if (combinados.length > MAX_ANEXOS) {
        toast.error(`Você pode enviar até ${MAX_ANEXOS} anexos.`);
      }
      return combinados.slice(0, MAX_ANEXOS);
    });
  };

  const sugestoesVisiveis = idsNoCarrinho ? sugestoes.filter((p) => !carrinho.has(p.id)) : [];

  const removerAnexo = (indice: number) =>
    setAnexos((prev) => prev.filter((_, i) => i !== indice));

  const adicionarAoCarrinho = (produto: Produto) => {
    setCarrinho((prev) => {
      const next = new Map(prev);
      const existente = next.get(produto.id);
      if (existente) {
        next.set(produto.id, { ...existente, quantidade: existente.quantidade + 1 });
      } else {
        next.set(produto.id, {
          produtoId: produto.id,
          nome: produto.nome,
          preco: Number(produto.preco),
          quantidade: 1,
        });
      }
      return next;
    });
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho((prev) => {
      const next = new Map(prev);
      const item = next.get(produtoId);
      if (!item) return prev;
      if (item.quantidade <= 1) {
        next.delete(produtoId);
      } else {
        next.set(produtoId, { ...item, quantidade: item.quantidade - 1 });
      }
      return next;
    });
  };

  const totalCarrinho = Array.from(carrinho.values()).reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo) {
      toast.error('Por favor, anexe a foto ou PDF da sua receita médica.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      anexos.forEach((a) => formData.append('anexos', a));
      if (observacoes) formData.append('observacoes', observacoes);
      if (familiarId) formData.append('familiarId', familiarId);

      const itens = Array.from(carrinho.values()).map((i) => ({
        produtoId: i.produtoId,
        quantidade: i.quantidade,
      }));
      if (itens.length > 0) {
        formData.append('itens', JSON.stringify(itens));
      }

      const response = await apiFetch('/orcamentos/receita', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSucesso(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(
          typeof errorData.message === 'string'
            ? errorData.message
            : 'Tivemos um problema ao processar sua receita. Tente novamente.',
        );
      }
    } catch {
      toast.error('Não foi possível conectar com o servidor. O backend está rodando?');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sucesso) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="text-6xl mb-4" aria-hidden="true">✅</div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Receita enviada com sucesso!</h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Nossa equipe de farmacêuticos já recebeu o seu arquivo. Você receberá o orçamento
              detalhado muito em breve.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md cursor-pointer"
            >
              Voltar para o Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Enviar Receita</h1>
        <p className="text-gray-600 mt-2">
          Anexe sua receita e, se desejar, adicione produtos do nosso catálogo ao pedido.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Formulário principal */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Paciente */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 id="titulo-paciente" className="font-semibold text-gray-800 mb-4">1. Para quem é esta receita?</h2>
              <select
                aria-labelledby="titulo-paciente"
                value={familiarId}
                onChange={(e) => setFamiliarId(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm disabled:bg-gray-100"
              >
                <option value="">Para mim mesmo (titular da conta)</option>
                {familiares.some((f) => f.proprio) && (
                  <optgroup label="Meus dependentes">
                    {familiares
                      .filter((f) => f.proprio)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {rotuloFamiliar(f)}
                        </option>
                      ))}
                  </optgroup>
                )}
                {familiares.some((f) => !f.proprio) && (
                  <optgroup label="Compartilhados com você">
                    {familiares
                      .filter((f) => !f.proprio)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {rotuloFamiliar(f)} ({f.titularEmail})
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
              {familiares.length === 0 && (
                <p className="mt-2 text-xs text-gray-400">
                  Nenhum dependente cadastrado.{' '}
                  <Link to="/grupo-familia" className="text-blue-600 hover:underline">
                    Adicionar no Grupo Família
                  </Link>
                </p>
              )}
            </div>

            {/* Receita */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-4">2. Receita Médica *</h2>
              <label
                htmlFor="dropzone-file"
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  arquivo
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col items-center justify-center text-center px-4">
                  {arquivo ? (
                    <>
                      <div className="text-3xl mb-1" aria-hidden="true">✅</div>
                      <p className="text-sm text-green-700 font-semibold truncate max-w-xs">
                        {arquivo.name}
                      </p>
                      <p className="text-xs text-green-600">Clique para trocar</p>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl mb-1 text-gray-400" aria-hidden="true">📄</div>
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">Clique para upload</span> ou arraste
                      </p>
                      <p className="text-xs text-gray-400">PNG, JPG ou PDF (Máx. 10MB)</p>
                    </>
                  )}
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                />
              </label>
            </div>

            {/* Anexos */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-800">3. Outros anexos (Opcional)</h2>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Exames, laudos ou receitas complementares. Até {MAX_ANEXOS} arquivos (imagem ou PDF, máx. 10MB cada).
              </p>
              {anexos.length > 0 && (
                <ul className="mb-3 flex flex-col gap-2">
                  {anexos.map((a, i) => (
                    <li
                      key={`${a.name}-${i}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    >
                      <span className="truncate text-gray-700">{a.name}</span>
                      <button
                        type="button"
                        onClick={() => removerAnexo(i)}
                        disabled={isSubmitting}
                        aria-label={`Remover anexo ${a.name}`}
                        className="shrink-0 text-red-600 hover:underline text-xs font-semibold disabled:opacity-50"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {anexos.length < MAX_ANEXOS && (
                <label
                  htmlFor="anexos-file"
                  className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span aria-hidden="true">📎</span> Adicionar anexos
                  <input
                    id="anexos-file"
                    type="file"
                    multiple
                    className="sr-only"
                    accept="image/*,.pdf"
                    onChange={handleAnexosChange}
                    disabled={isSubmitting}
                  />
                </label>
              )}
            </div>

            {/* Observações */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 id="titulo-observacoes" className="font-semibold text-gray-800 mb-4">4. Observações (Opcional)</h2>
              <textarea
                aria-labelledby="titulo-observacoes"
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                disabled={isSubmitting}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none disabled:bg-gray-100 text-sm"
                placeholder="Ex: Prefiro cápsulas vegetais, se possível."
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={isSubmitting}
                className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Solicitar Orçamento'}
              </button>
            </div>
          </form>
        </div>

        {/* Vitrine + Carrinho */}
        <div className="lg:w-80 flex flex-col gap-4">
          {/* Carrinho */}
          {carrinho.size > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 mb-3 text-sm">Produtos selecionados</h3>
              <div className="flex flex-col gap-2">
                {Array.from(carrinho.values()).map((item) => (
                  <div key={item.produtoId} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-700 flex-1 truncate">{item.nome}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => removerDoCarrinho(item.produtoId)}
                        aria-label={`Diminuir quantidade de ${item.nome}`}
                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-red-50 hover:text-red-600 text-xs font-bold"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-semibold" aria-live="polite">
                        {item.quantidade}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          adicionarAoCarrinho({
                            id: item.produtoId,
                            nome: item.nome,
                            preco: String(item.preco),
                            descricao: null,
                            imagemUrl: null,
                          })
                        }
                        aria-label={`Aumentar quantidade de ${item.nome}`}
                        className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-green-50 hover:text-green-600 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                <span className="text-xs text-blue-700 font-medium">Subtotal estimado</span>
                <span className="font-bold text-blue-800">
                  R$ {totalCarrinho.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          )}

          {/* Sugestões de complementares */}
          {sugestoesVisiveis.length > 0 && (
            <section
              aria-labelledby="titulo-sugestoes"
              className="bg-emerald-50 border border-emerald-100 rounded-xl p-4"
            >
              <h3 id="titulo-sugestoes" className="font-semibold text-emerald-900 text-sm">
                Combina com o seu pedido
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5 mb-3">
                Produtos complementares indicados pela farmácia
              </p>
              <ul className="flex flex-col gap-2">
                {sugestoesVisiveis.map((produto) => (
                  <li key={produto.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{produto.nome}</p>
                      <p className="text-xs text-green-700 font-semibold">
                        R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => adicionarAoCarrinho(produto)}
                      aria-label={`Adicionar ${produto.nome} ao pedido`}
                      className="shrink-0 px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                    >
                      + Add
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Catálogo */}
          {produtos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">
                  5. Adicionar Produtos ao Pedido
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Opcional — agiliza o preparo</p>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {produtos.map((produto) => {
                  const noCarrinho = carrinho.get(produto.id);
                  return (
                    <div key={produto.id} className="p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{produto.nome}</p>
                        <p className="text-xs text-green-700 font-semibold">
                          R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      {noCarrinho ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => removerDoCarrinho(produto.id)}
                            aria-label={`Diminuir quantidade de ${produto.nome}`}
                            className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded text-sm font-bold"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-semibold">
                            {noCarrinho.quantidade}
                          </span>
                          <button
                            type="button"
                            onClick={() => adicionarAoCarrinho(produto)}
                            aria-label={`Aumentar quantidade de ${produto.nome}`}
                            className="w-7 h-7 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => adicionarAoCarrinho(produto)}
                          aria-label={`Adicionar ${produto.nome} ao pedido`}
                          className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
