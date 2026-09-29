import { useState, type ReactNode } from 'react';
import { Eye, EyeOff, CircleAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Moldura das telas de entrada e cadastro
export function TelaAcesso({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-primary px-4 pt-10 pb-24 text-primary-foreground">
        <div className="mx-auto max-w-md">
          <p className="text-xl font-bold">Grupo Farmácia HP</p>
          <p className="mt-1 text-primary-foreground/90">Sua farmácia de manipulação, na palma da mão.</p>
        </div>
      </header>
      <main className="-mt-16 flex-1 px-4 pb-12">
        <div className="mx-auto max-w-md rounded-2xl bg-card p-6 shadow-float sm:p-8">
          <h1 className="text-3xl font-bold">{titulo}</h1>
          <p className="mt-1 text-lg text-muted-foreground">{subtitulo}</p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function AvisoErro({ mensagem }: { mensagem: string }) {
  if (!mensagem) return null;
  return (
    <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl bg-destructive-soft p-4 text-destructive">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p className="font-bold">{mensagem}</p>
    </div>
  );
}

// Senha com botão "Mostrar": evita erro de digitação, comum no celular
export function CampoSenha({
  id,
  rotulo,
  valor,
  onChange,
  autoComplete,
  dica,
}: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  autoComplete: string;
  dica?: string;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{rotulo}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visivel ? 'text' : 'password'}
          required
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-describedby={dica ? `${id}-dica` : undefined}
          className="pr-32"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-pressed={visivel}
          className="absolute inset-y-1 right-1 flex items-center gap-1.5 rounded-md px-3 font-bold text-accent-foreground transition-colors hover:bg-muted"
        >
          {visivel ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
          {visivel ? 'Esconder' : 'Mostrar'}
        </button>
      </div>
      {dica && (
        <p id={`${id}-dica`} className="text-muted-foreground">
          {dica}
        </p>
      )}
    </div>
  );
}
