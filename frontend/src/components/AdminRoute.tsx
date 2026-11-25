import { Navigate, Outlet } from 'react-router-dom';

function getRole(): string | null {
  try {
    const u = JSON.parse(localStorage.getItem('usuario_farmacia') ?? 'null');
    return u?.role ?? null;
  } catch {
    return null;
  }
}

export default function AdminRoute() {
  const role = getRole();
  if (role !== 'ADMIN') {
    return <Navigate to="/meus-pedidos" replace />;
  }
  return <Outlet />;
}
