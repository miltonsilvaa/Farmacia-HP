import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, UserPlus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvisoErro, CampoSenha, TelaAcesso } from '@/components/TelaAcesso';

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

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 letras ou números.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErro('As duas senhas estão diferentes. Digite de novo.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/usuarios', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });
      if (!response.ok) {
        const dados = await response.json().catch(() => ({}));
        throw new Error(
          typeof dados.message === 'string' ? dados.message : 'Não conseguimos criar a conta. Tente de novo.',
        );
      }
      navigate('/login?cadastrado=true');
    } catch (error: unknown) {
      setErro(error instanceof Error ? error.message : 'Sem conexão. Confira sua internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TelaAcesso titulo="Criar conta" subtitulo="Leva menos de um minuto.">
      <AvisoErro mensagem={erro} />

      <form onSubmit={handleCadastro} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cadastro-email">E-mail</Label>
          <Input
            id="cadastro-email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />
        </div>
        <CampoSenha
          id="cadastro-senha"
          rotulo="Crie uma senha"
          valor={senha}
          onChange={setSenha}
          autoComplete="new-password"
          dica="Pelo menos 6 letras ou números."
        />
        <CampoSenha
          id="cadastro-confirmar"
          rotulo="Repita a senha"
          valor={confirmarSenha}
          onChange={setConfirmarSenha}
          autoComplete="new-password"
        />

        <Button type="submit" size="lg" disabled={isLoading} className="mt-2 w-full">
          {isLoading ? <Loader2 aria-hidden="true" className="animate-spin" /> : <UserPlus aria-hidden="true" />}
          {isLoading ? 'Criando conta…' : 'Criar minha conta'}
        </Button>
      </form>

      <div className="mt-8 border-t pt-6 text-center">
        <p className="text-muted-foreground">Já tem conta?</p>
        <Button asChild variant="outline" size="lg" className="mt-3 w-full">
          <Link to="/login">Entrar</Link>
        </Button>
      </div>
    </TelaAcesso>
  );
}
