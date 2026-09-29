import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: string;
  estoque: number;
  imagemUrl: string | null;
  ativo: boolean;
  relacionadosIds: string[];
}

interface FormState {
  nome: string;
  descricao: string;
  preco: string;
  estoque: string;
  imagemUrl: string;
  ativo: boolean;
  relacionadosIds: string[];
}

const formVazio: FormState = {
  nome: '',
  descricao: '',
  preco: '',
  estoque: '0',
  imagemUrl: '',
  ativo: true,
  relacionadosIds: [],
};

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isCarregando, setIsCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState<FormState>(formVazio);
  const [isSalvando, setIsSalvando] = useState(false);
  const [isInativando, setIsInativando] = useState<string | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    setIsCarregando(true);
    try {
      const res = await apiFetch('/produtos/admin');
      if (res.ok) {
        setProdutos(await res.json());
      } else {
        toast.error('Erro ao carregar produtos.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setIsCarregando(false);
    }
  };

  const abrirModalNovo = () => {
    setProdutoEditando(null);
    setForm(formVazio);
    setModalAberto(true);
  };

  const abrirModalEditar = (p: Produto) => {
    setProdutoEditando(p);
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? '',
      preco: Number(p.preco).toFixed(2),
      estoque: String(p.estoque),
      imagemUrl: p.imagemUrl ?? '',
      ativo: p.ativo,
      relacionadosIds: p.relacionadosIds ?? [],
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoEditando(null);
    setForm(formVazio);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSalvando(true);

    const payload = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      preco: parseFloat(form.preco.replace(',', '.')),
      estoque: parseInt(form.estoque, 10) || 0,
      imagemUrl: form.imagemUrl || undefined,
      ativo: form.ativo,
      relacionadosIds: form.relacionadosIds,
    };

    try {
      let res: Response;
      if (produtoEditando) {
        res = await apiFetch(`/produtos/admin/${produtoEditando.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiFetch('/produtos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error();

      // Recarrega para refletir os relacionados nos dois produtos da ligação
      await carregarProdutos();

      toast.success(produtoEditando ? 'Produto atualizado!' : 'Produto criado com sucesso!');
      fecharModal();
    } catch {
      toast.error('Erro ao salvar produto. Tente novamente.');
    } finally {
      setIsSalvando(false);
    }
  };

  const handleInativar = async (produto: Produto) => {
    if (!confirm(`Deseja inativar o produto "${produto.nome}"?`)) return;
    setIsInativando(produto.id);
    try {
      const res = await apiFetch(`/produtos/admin/${produto.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setProdutos((prev) =>
        prev.map((p) => (p.id === produto.id ? { ...p, ativo: false } : p)),
      );
      toast.success('Produto inativado.');
    } catch {
      toast.error('Erro ao inativar produto.');
    } finally {
      setIsInativando(null);
    }
  };

  const alternarRelacionado = (id: string) =>
    setForm((f) => ({
      ...f,
      relacionadosIds: f.relacionadosIds.includes(id)
        ? f.relacionadosIds.filter((r) => r !== id)
        : [...f.relacionadosIds, id],
    }));

  const outrosProdutos = produtos.filter((p) => p.id !== produtoEditando?.id && p.ativo);

  const campo = (campo: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Catálogo de Produtos</h2>
            <p className="text-sm text-gray-500 mt-1">
              {isCarregando ? '...' : `${produtos.length} produto(s) cadastrado(s)`}
            </p>
          </div>
          <button
            onClick={abrirModalNovo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <span>➕</span> Novo Produto
          </button>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isCarregando ? (
            <div className="p-10 text-center text-gray-500">Carregando...</div>
          ) : produtos.length === 0 ? (
            <div className="p-10 text-center text-gray-500 border-2 border-dashed border-gray-200 m-6 rounded-xl">
              <p className="text-lg">Nenhum produto cadastrado ainda.</p>
              <button
                onClick={abrirModalNovo}
                className="mt-3 text-blue-600 font-semibold hover:underline text-sm"
              >
                Criar o primeiro produto
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estoque</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-semibold text-gray-800">{p.nome}</p>
                        {p.descricao && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{p.descricao}</p>
                        )}
                      </td>
                      <td className="py-4 px-5 font-medium text-green-700">
                        R$ {Number(p.preco).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-4 px-5 text-gray-700">{p.estoque}</td>
                      <td className="py-4 px-5">
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          p.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => abrirModalEditar(p)}
                            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                          {p.ativo && (
                            <button
                              onClick={() => handleInativar(p)}
                              disabled={isInativando === p.id}
                              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isInativando === p.id ? 'Processando...' : 'Inativar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Modal Criar / Editar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">
                {produtoEditando ? 'Editar Produto' : 'Novo Produto'}
              </h3>
            </div>

            <form onSubmit={handleSalvar} className="p-6 flex flex-col gap-5">
              {/* Nome */}
              <div>
                <label htmlFor="adminprodutos-campo-1" className="block text-sm font-semibold text-gray-700 mb-1">Nome *</label>
                <input id="adminprodutos-campo-1"
                  type="text"
                  required
                  value={form.nome}
                  onChange={campo('nome')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: Vitamina C 500mg"
                />
              </div>

              {/* Descrição */}
              <div>
                <label htmlFor="adminprodutos-campo-2" className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
                <textarea id="adminprodutos-campo-2"
                  rows={2}
                  value={form.descricao}
                  onChange={campo('descricao')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  placeholder="Ex: Frasco com 30 cápsulas"
                />
              </div>

              {/* Preço + Estoque */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="adminprodutos-campo-3" className="block text-sm font-semibold text-gray-700 mb-1">Preço (R$) *</label>
                  <input id="adminprodutos-campo-3"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={form.preco}
                    onChange={campo('preco')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="w-32">
                  <label htmlFor="adminprodutos-campo-4" className="block text-sm font-semibold text-gray-700 mb-1">Estoque</label>
                  <input id="adminprodutos-campo-4"
                    type="number"
                    min="0"
                    value={form.estoque}
                    onChange={campo('estoque')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* URL da imagem */}
              <div>
                <label htmlFor="adminprodutos-campo-5" className="block text-sm font-semibold text-gray-700 mb-1">URL da Imagem</label>
                <input id="adminprodutos-campo-5"
                  type="url"
                  value={form.imagemUrl}
                  onChange={campo('imagemUrl')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>

              {/* Produtos complementares */}
              {outrosProdutos.length > 0 && (
                <fieldset>
                  <legend className="block text-sm font-semibold text-gray-700 mb-1">
                    Produtos complementares
                  </legend>
                  <p className="text-xs text-gray-500 mb-2">
                    Sugeridos ao cliente quando este produto estiver no pedido (e vice-versa).
                  </p>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {outrosProdutos.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={form.relacionadosIds.includes(p.id)}
                          onChange={() => alternarRelacionado(p.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        {p.nome}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {/* Ativo */}
              {produtoEditando && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={form.ativo}
                    onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="ativo" className="text-sm font-semibold text-gray-700">
                    Produto ativo (visível no catálogo)
                  </label>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={isSalvando}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSalvando}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSalvando ? 'Processando...' : produtoEditando ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
