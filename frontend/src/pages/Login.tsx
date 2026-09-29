import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CircleCheckBig, Loader2, LogIn } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvisoErro, CampoSenha, TelaAcesso } from '@/components/TelaAcesso';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const acabouDeCadastrar = searchParams.get('cadastrado') === 'true';
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
        const dados = await response.json().catch(() => ({}));
        throw new Error(
          typeof dados.message === 'string' ? dados.message : 'Não conseguimos entrar agora. Tente de novo.',
        );
      }

      const data = await response.json();
      localStorage.setItem('token_farmacia', data.access_token);

      try {
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        const role = data.role ?? payload.role ?? 'CLIENTE';
        localStorage.setItem('usuario_farmacia', JSON.stringify({ id: payload.sub, email: payload.email, role }));
        navigate(role === 'ADMIN' ? '/dashboard-admin' : '/');
      } catch {
        navigate('/');
      }
    } catch (error: unknown) {
      setErro(error instanceof Error ? error.message : 'Sem conexão. Confira sua internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TelaAcesso titulo="Entrar" subtitulo="Use o e-mail e a senha da sua conta.">
      {acabouDeCadastrar && !erro && (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-xl bg-status-verde-soft p-4 text-status-verde">
          <CircleCheckBig aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p className="font-bold">Conta criada! Agora é só entrar.</p>
        </div>
      )}
      <AvisoErro mensagem={erro} />

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="login-email">E-mail</Label>
          <Input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />
        </div>
        <CampoSenha id="login-senha" rotulo="Senha" valor={senha} onChange={setSenha} autoComplete="current-password" />

        <Button type="submit" size="lg" disabled={isLoading} className="mt-2 w-full">
          {isLoading ? <Loader2 aria-hidden="true" className="animate-spin" /> : <LogIn aria-hidden="true" />}
          {isLoading ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-8 border-t pt-6 text-center">
        <p className="text-muted-foreground">Primeira vez aqui?</p>
        <Button asChild variant="outline" size="lg" className="mt-3 w-full">
          <Link to="/cadastro">Criar minha conta</Link>
        </Button>
      </div>
    </TelaAcesso>
  );
}
