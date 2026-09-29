import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErro('');

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Erro do servidor (Status: ${response.status})`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch { /* empty */ }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      localStorage.setItem('token_farmacia', data.access_token);

      try {
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        const role = data.role ?? payload.role ?? 'CLIENTE';
        localStorage.setItem(
          'usuario_farmacia',
          JSON.stringify({ id: payload.sub, email: payload.email, role }),
        );
        navigate(role === 'ADMIN' ? '/dashboard-admin' : '/meus-pedidos');
      } catch {
        navigate('/meus-pedidos');
      }
    } catch (error: unknown) {
      setErro(error instanceof Error ? error.message : 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Grupo Farmácia HP</h1>
          <p className="text-gray-500">
            Acesse sua conta para gerenciar orçamentos e dependentes.
          </p>
        </div>

        {erro && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg text-center border border-red-100">
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="login-campo-1" className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
            <input id="login-campo-1"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="login-campo-2" className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
            <input id="login-campo-2"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
              Lembrar de mim
            </label>
            <a href="#" className="text-blue-600 font-semibold hover:underline">
              Esqueceu a senha?
            </a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
          >
            {isLoading ? 'Entrando...' : 'Entrar na Plataforma'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500 pt-6 border-t border-gray-100">
          Ainda não tem conta?{' '}
          <button
            onClick={() => navigate('/cadastro')}
            className="text-blue-600 font-bold hover:underline"
          >
            Cadastre-se aqui
          </button>
        </div>
      </div>
    </div>
  );
}
