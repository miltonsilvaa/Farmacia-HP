import { Link } from 'react-router-dom';

export default function HomeCliente() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Olá, Cliente!</h1>
        <p className="text-gray-600 mt-2">O que você precisa hoje?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Upload de Receita */}
        <Link to="/novo-orcamento" className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer group flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
            📄
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Enviar Receita</h2>
          <p className="text-gray-500 text-sm">Faça o upload da sua receita médica e solicite um novo orçamento.</p>
        </Link>

        {/* Card 2: Renovação 1 Clique */}
        <Link to="/meus-pedidos" className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-500 transition-all cursor-pointer group flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
            🔄
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Renovar Pedido</h2>
          <p className="text-gray-500 text-sm">Refaça um pedido anterior de uso contínuo com apenas 1 clique.</p>
        </Link>

        {/* Card 3: Grupo Família */}
        <Link to="/grupo-familia" className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-500 transition-all cursor-pointer group flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform" aria-hidden="true">
            👨‍👩‍👧‍👦
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Grupo Família</h2>
          <p className="text-gray-500 text-sm">Gerencie o perfil e os pedidos dos seus dependentes e pets.</p>
        </Link>

      </div>
    </div>
  );
}