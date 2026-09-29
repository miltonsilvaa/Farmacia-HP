import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import HomeCliente from './pages/HomeCliente';
import NovoOrcamento from './pages/NovoOrcamento';
import MeusPedidos from './pages/MeusPedidos';
import GrupoFamilia from './pages/GrupoFamilia';
import DashboardAdmin from './pages/DashboardAdmin';
import AdminProdutos from './pages/AdminProdutos';
import AdminPedidos from './pages/AdminPedidos';
import AdminRelatorios from './pages/AdminRelatorios';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Rotas protegidas — somente ADMIN (guard + layout específico) */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard-admin" element={<DashboardAdmin />} />
            <Route path="/admin/produtos" element={<AdminProdutos />} />
            <Route path="/admin/pedidos" element={<AdminPedidos />} />
            <Route path="/admin/relatorios" element={<AdminRelatorios />} />
          </Route>
        </Route>

        {/* Rotas do cliente */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomeCliente />} />
          <Route path="novo-orcamento" element={<NovoOrcamento />} />
          <Route path="meus-pedidos" element={<MeusPedidos />} />
          <Route path="grupo-familia" element={<GrupoFamilia />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
