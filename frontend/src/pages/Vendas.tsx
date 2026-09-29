import { useState } from 'react';
import toast from 'react-hot-toast';

// Tipagens para manter o código seguro e organizado
type Produto = { id: number; nome: string; preco: number; estoque: number };
type ItemCarrinho = Produto & { quantidade: number };

export default function Vendas() {
  // Simulação do banco de dados de produtos
  const [estoque] = useState<Produto[]>([
    { id: 1, nome: 'Dipirona 500mg', preco: 5.99, estoque: 120 },
    { id: 2, nome: 'Ibuprofeno 400mg', preco: 15.50, estoque: 85 },
    { id: 3, nome: 'Amoxicilina 500mg', preco: 22.90, estoque: 40 },
    { id: 4, nome: 'Soro Fisiológico 500ml', preco: 8.00, estoque: 50 },
  ]);

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [termoBusca, setTermoBusca] = useState('');

  // Adiciona item ou aumenta a quantidade se já estiver no carrinho
  const adicionarAoCarrinho = (produto: Produto) => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    
    if (itemExistente) {
      setCarrinho(carrinho.map(item => 
        item.id === produto.id 
          ? { ...item, quantidade: item.quantidade + 1 } 
          : item
      ));
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
    }
  };

  // Remove o item completamente do carrinho
  const removerDoCarrinho = (id: number) => {
    setCarrinho(carrinho.filter(item => item.id !== id));
  };

  // Calcula o valor total da compra
  const totalCompra = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  const finalizarVenda = () => {
    if (carrinho.length === 0) return toast.error('Adicione produtos antes de finalizar!');
    
    toast.success(`Venda finalizada! Total: R$ ${totalCompra.toFixed(2).replace('.', ',')}`);
    setCarrinho([]); // Limpa o carrinho após a venda
  };

  const produtosFiltrados = estoque.filter(p => p.nome.toLowerCase().includes(termoBusca.toLowerCase()));

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Frente de Caixa (PDV)</h1>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 items-stretch lg:items-start">
        
        {/* LADO ESQUERDO: Lista de Produtos */}
        <div className="flex-[2] bg-white p-6 rounded-lg shadow-md flex flex-col lg:h-[70vh]">
          <input 
            type="text" 
            placeholder="Buscar medicamento..." 
            aria-label="Buscar medicamento"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 mb-6 focus:ring-2 focus:ring-blue-500 outline-none text-lg"
          />

          <div className="overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {produtosFiltrados.map(produto => (
              <div 
                key={produto.id} 
                onClick={() => adicionarAoCarrinho(produto)}
                className="border border-gray-200 p-4 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex justify-between items-center bg-gray-50"
              >
                <div>
                  <h3 className="font-semibold text-gray-800">{produto.nome}</h3>
                  <p className="text-sm text-gray-500">Estoque: {produto.estoque}</p>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  R$ {produto.preco.toFixed(2).replace('.', ',')}
                </div>
              </div>
            ))}
            {produtosFiltrados.length === 0 && (
              <p className="text-gray-500 col-span-2 text-center py-4">Nenhum produto encontrado.</p>
            )}
          </div>
        </div>

        {/* LADO DIREITO: Carrinho de Compras */}
        <div className="flex-[1] bg-slate-800 text-white p-6 rounded-lg shadow-md flex flex-col h-[70vh]">
          <h2 className="text-xl font-bold border-b border-slate-600 pb-4 mb-4">Cupom Fiscal</h2>
          
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
            {carrinho.length === 0 ? (
              <p className="text-slate-400 text-center mt-10">Carrinho vazio</p>
            ) : (
              carrinho.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-slate-700 p-3 rounded">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.nome}</p>
                    <p className="text-xs text-slate-300">{item.quantidade}x de R$ {item.preco.toFixed(2).replace('.', ',')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                    <button 
                      onClick={() => removerDoCarrinho(item.id)}
                      className="text-red-400 hover:text-red-300 font-bold px-2 cursor-pointer"
                      title="Remover item"
                    >
                      X
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-600">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg">Total:</span>
              <span className="text-3xl font-bold text-green-400">
                R$ {totalCompra.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <button 
              onClick={finalizarVenda}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg text-lg transition-colors shadow-lg cursor-pointer"
            >
              Finalizar Venda
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}