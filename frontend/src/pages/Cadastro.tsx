import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function Cadastro() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/usuarios', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });

      if (!response.ok) {
        const text = await response.text();
        let msg = `Erro ao cadastrar (Status: ${response.status})`;
        try { msg = JSON.parse(text).message || msg; } catch { /* empty */ }
        throw new Error(msg);
      }

      navigate('/login?cadastrado=true');
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
          <p className="text-gray-500">Crie sua conta para gerenciar orçamentos.</p>
        </div>

        {erro && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg text-center border border-red-100">
            {erro}
          </div>
        )}

        <form onSubmit={handleCadastro} className="space-y-5">
          <div>
            <label htmlFor="cadastro-campo-1" className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
            <input id="cadastro-campo-1"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="cadastro-campo-2" className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
            <input id="cadastro-campo-2"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label htmlFor="cadastro-campo-3" className="block text-sm font-semibold text-gray-700 mb-1">Confirmar Senha</label>
            <input id="cadastro-campo-3"
              type="password"
              required
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              placeholder="Repita a senha"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500 pt-6 border-t border-gray-100">
          Já tem conta?{' '}
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 font-bold hover:underline"
          >
            Entrar aqui
          </button>
        </div>
      </div>
    </div>
  );
}
