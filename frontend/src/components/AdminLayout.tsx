import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ChartColumn, ClipboardList, LayoutDashboard, LogOut, Package, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avisos from './Avisos';

const ITENS: { para: string; rotulo: string; icone: LucideIcon }[] = [
  { para: '/dashboard-admin', rotulo: 'Fila do dia', icone: LayoutDashboard },
  { para: '/admin/pedidos', rotulo: 'Pedidos', icone: ClipboardList },
  { para: '/admin/produtos', rotulo: 'Catálogo', icone: Package },
  { para: '/admin/relatorios', rotulo: 'Relatórios', icone: ChartColumn },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleSair = () => {
    localStorage.clear();
    navigate('/login');
  };

  const classeLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-12 items-center gap-3 rounded-lg px-3 font-bold whitespace-nowrap transition-colors',
      isActive ? 'bg-primary-soft text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    );

  return (
    <>
    {/* Fora da grade: senão o container dos avisos vira a primeira coluna */}
    <Avisos />
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">

      <aside className="sticky top-0 z-30 border-b bg-card lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:h-auto lg:flex-col lg:items-stretch lg:px-4 lg:py-6">
          <Link to="/dashboard-admin" className="leading-tight">
            <span className="block text-lg font-bold text-accent-foreground">Grupo Farmácia HP</span>
            <span className="block text-sm text-muted-foreground">Painel da farmácia</span>
          </Link>
          <button
            onClick={handleSair}
            className="flex min-h-12 items-center gap-2 rounded-lg px-3 font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <LogOut aria-hidden="true" className="size-5" />
            Sair
          </button>
        </div>
        <nav aria-label="Painel" className="overflow-x-auto px-2 pb-2 lg:px-3 lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {ITENS.map(({ para, rotulo, icone: Icone }) => (
              <li key={para}>
                <NavLink to={para} className={classeLink}>
                  <Icone aria-hidden="true" className="size-5" />
                  {rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute inset-x-3 bottom-6 hidden lg:block">
          <button
            onClick={handleSair}
            className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut aria-hidden="true" className="size-5" />
            Sair do painel
          </button>
        </div>
      </aside>

      <main className="mx-auto w-full min-w-0 max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
        <Outlet />
      </main>
    </div>
    </>
  );
}
