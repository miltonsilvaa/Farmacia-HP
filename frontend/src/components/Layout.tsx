import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

function getEmail(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem('usuario_farmacia') ?? 'null');
    return u?.email ?? null;
  } catch {
    return null;
  }
}

export default function Layout() {
  const navigate = useNavigate();
  const email = getEmail();

  const handleSair = () => {
    localStorage.removeItem('token_farmacia');
    localStorage.removeItem('usuario_farmacia');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Toaster position="top-right" />

      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-y-3 justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold tracking-tight shrink-0">
            Grupo Farmácia HP
          </Link>

          {/* Navegação central */}
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
            <Link to="/" className="hover:text-blue-200 transition-colors">
              Início
            </Link>
            <Link to="/meus-pedidos" className="hover:text-blue-200 transition-colors">
              Meus Pedidos
            </Link>
            <Link to="/grupo-familia" className="hover:text-blue-200 transition-colors">
              Grupo Família
            </Link>
            <Link
              to="/novo-orcamento"
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-full transition-colors shadow-sm"
            >
              + Novo Orçamento
            </Link>
          </nav>

          {/* Usuário + Sair */}
          <div className="flex items-center gap-3 shrink-0">
            {email && (
              <span className="hidden sm:block text-xs text-blue-300 max-w-[180px] truncate">
                {email}
              </span>
            )}
            <button
              onClick={handleSair}
              className="text-xs border border-blue-600 hover:border-blue-400 hover:text-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
