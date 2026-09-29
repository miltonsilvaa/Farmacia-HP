import { Pill } from 'lucide-react';

// Posologia sempre à mão, em letra grande: substitui a receita impressa perdida
export default function ComoTomar({ posologia }: { posologia: string | null }) {
  if (!posologia) return null;
  return (
    <section
      aria-label="Como tomar"
      className="flex gap-4 rounded-xl bg-status-azul-soft p-4"
    >
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-card text-status-azul shadow-card"
      >
        <Pill className="size-6" />
      </span>
      <div>
        <p className="font-bold text-status-azul">Como tomar</p>
        <p className="mt-0.5 text-lg leading-relaxed whitespace-pre-line">{posologia}</p>
      </div>
    </section>
  );
}
