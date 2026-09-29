import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { ClipboardList, House, LogOut, Camera, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Avisos from './Avisos';

function getEmail(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem('usuario_farmacia') ?? 'null');
    return u?.email ?? null;
  } catch {
    return null;
  }
}

const ITENS: { para: string; rotulo: string; icone: LucideIcon; fim?: boolean }[] = [
  { para: '/', rotulo: 'Início', icone: House, fim: true },
  { para: '/novo-orcamento', rotulo: 'Enviar receita', icone: Camera },
  { para: '/meus-pedidos', rotulo: 'Meus pedidos', icone: ClipboardList },
  { para: '/grupo-familia', rotulo: 'Família', icone: Users },
];

export default function Layout() {
  const navigate = useNavigate();
  const email = getEmail();

  const handleSair = () => {
    localStorage.removeItem('token_farmacia');
    localStorage.removeItem('usuario_farmacia');
    navigate('/login');
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Avisos />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-3 focus:font-bold focus:shadow-float"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Link to="/" className="text-xl font-bold tracking-tight text-accent-foreground">
            Grupo Farmácia HP
          </Link>

          <nav aria-label="Principal" className="hidden md:flex items-center gap-1">
            {ITENS.map(({ para, rotulo, icone: Icone, fim }) => (
              <NavLink
                key={para}
                to={para}
                end={fim}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-12 items-center gap-2 rounded-lg px-3 font-bold transition-colors',
                    isActive
                      ? 'bg-primary-soft text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icone aria-hidden="true" className="size-5" />
                {rotulo}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {email && (
              <span className="hidden lg:block max-w-[14rem] truncate text-sm text-muted-foreground">
                {email}
              </span>
            )}
            <button
              onClick={handleSair}
              className="flex min-h-12 items-center gap-2 rounded-lg px-3 font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut aria-hidden="true" className="size-5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main id="conteudo" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-32 md:pb-12">
        <Outlet />
      </main>

      {/* Navegação do celular: sempre visível, alvos grandes, ícone + texto */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-6px_rgb(15_31_25/0.12)] md:hidden"
      >
        <ul className="grid grid-cols-4">
          {ITENS.map(({ para, rotulo, icone: Icone, fim }) => (
            <li key={para}>
              <NavLink
                to={para}
                end={fim}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[4.25rem] flex-col items-center justify-center gap-1 px-1 text-center text-[0.85rem] font-bold leading-tight transition-colors',
                    isActive ? 'text-accent-foreground' : 'text-muted-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'grid h-8 w-14 place-items-center rounded-full transition-colors',
                        isActive && 'bg-primary-soft',
                      )}
                    >
                      <Icone aria-hidden="true" className="size-6" />
                    </span>
                    {rotulo}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
