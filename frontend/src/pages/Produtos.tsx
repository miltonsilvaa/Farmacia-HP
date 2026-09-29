import { useState } from 'react';

export default function Produtos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtos, setProdutos] = useState([
    { id: 1, nome: 'Dipirona 500mg', categoria: 'Analgésico', preco: 'R$ 5,99', estoque: 120 },
    { id: 2, nome: 'Ibuprofeno 400mg', categoria: 'Anti-inflamatório', preco: 'R$ 15,50', estoque: 85 },
    { id: 3, nome: 'Amoxicilina 500mg', categoria: 'Antibiótico', preco: 'R$ 22,90', estoque: 40 },
  ]);

  const [formData, setFormData] = useState({ nome: '', categoria: '', preco: '', estoque: '' });

  const handleSalvarProduto = (e: React.FormEvent) => {
    e.preventDefault();
    const novoProduto = {
      id: produtos.length > 0 ? produtos[produtos.length - 1].id + 1 : 1,
      nome: formData.nome,
      categoria: formData.categoria || 'Não definida',
      preco: `R$ ${Number(formData.preco).toFixed(2).replace('.', ',')}`,
      estoque: Number(formData.estoque)
    };
    setProdutos([...produtos, novoProduto]);
    setIsModalOpen(false);
    setFormData({ nome: '', categoria: '', preco: '', estoque: '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Produtos</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors cursor-pointer"
        >
          + Novo Produto
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Nome</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Preço</th>
              <th className="py-3 px-4">Estoque</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {produtos.map((produto) => (
              <tr key={produto.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{produto.id}</td>
                <td className="py-3 px-4 font-semibold">{produto.nome}</td>
                <td className="py-3 px-4">{produto.categoria}</td>
                <td className="py-3 px-4">{produto.preco}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-sm ${produto.estoque > 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {produto.estoque} un
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Cadastrar Novo Produto</h2>
            <form onSubmit={handleSalvarProduto} className="flex flex-col gap-4">
              <div>
                <label htmlFor="produtos-campo-1" className="block text-sm font-medium text-gray-700 mb-1">Nome do Medicamento</label>
                <input id="produtos-campo-1" type="text" required value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" placeholder="Ex: Paracetamol 750mg" />
              </div>
              <div>
                <label htmlFor="produtos-campo-2" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select id="produtos-campo-2" required value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className="w-full border border-gray-300 rounded-md p-2 bg-white">
                  <option value="">Selecione...</option>
                  <option value="Analgésico">Analgésico</option>
                  <option value="Anti-inflamatório">Anti-inflamatório</option>
                  <option value="Antibiótico">Antibiótico</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="produtos-campo-3" className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                  <input id="produtos-campo-3" type="number" step="0.01" required value={formData.preco} onChange={(e) => setFormData({...formData, preco: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" placeholder="0.00" />
                </div>
                <div className="flex-1">
                  <label htmlFor="produtos-campo-4" className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
                  <input id="produtos-campo-4" type="number" required value={formData.estoque} onChange={(e) => setFormData({...formData, estoque: e.target.value})} className="w-full border border-gray-300 rounded-md p-2" placeholder="0" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}