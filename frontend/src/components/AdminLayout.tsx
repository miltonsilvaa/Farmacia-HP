import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleSair = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-white font-bold border-b-2 border-emerald-400 pb-0.5'
      : 'text-gray-400 hover:text-white transition-colors font-medium';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Toaster position="top-right" />

      <header className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap gap-y-3 justify-between items-center">
          {/* Logo + badge */}
          <Link to="/dashboard-admin" className="flex items-center gap-2 shrink-0">
            <span className="text-lg">💊</span>
            <span className="text-lg font-bold tracking-tight">Grupo Farmácia HP</span>
            <span className="ml-1 px-2 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded-full uppercase tracking-wider">
              Admin
            </span>
          </Link>

          {/* Navegação central */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <NavLink to="/dashboard-admin" className={navClass}>
              Painel Principal
            </NavLink>
            <NavLink to="/admin/produtos" className={navClass}>
              Catálogo de Produtos
            </NavLink>
            <NavLink to="/admin/pedidos" className={navClass}>
              Todos os Pedidos
            </NavLink>
            <NavLink to="/admin/relatorios" className={navClass}>
              Relatórios
            </NavLink>
          </nav>

          {/* Sair */}
          <button
            onClick={handleSair}
            className="shrink-0 text-xs border border-gray-600 hover:border-red-500 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Sair do Sistema
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <Outlet />
      </main>
    </div>
  );
}
