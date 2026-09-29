import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

// Tela vazia que ensina o próximo passo, em vez de uma área em branco
export default function EstadoVazio({
  icone: Icone,
  titulo,
  texto,
  acao,
}: {
  icone: LucideIcon;
  titulo: string;
  texto: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <div
        aria-hidden="true"
        className="relative mb-5 grid size-24 place-items-center rounded-full bg-primary-soft"
      >
        <span className="absolute inset-3 rounded-full bg-white/70" />
        <Icone className="relative size-10 text-primary" strokeWidth={1.75} />
      </div>
      <h2 className="text-xl font-bold">{titulo}</h2>
      <p className="mt-2 max-w-sm text-muted-foreground">{texto}</p>
      {acao && <div className="mt-6 w-full max-w-xs">{acao}</div>}
    </div>
  );
}
