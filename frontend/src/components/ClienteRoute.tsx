import { Navigate, Outlet } from 'react-router-dom';

export default function ClienteRoute() {
  if (!localStorage.getItem('token_farmacia')) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
