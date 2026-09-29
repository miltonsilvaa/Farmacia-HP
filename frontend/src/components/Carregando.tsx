import { Skeleton } from '@/components/ui/skeleton';

// Esqueleto no formato do conteúdo que vai chegar: a pessoa vê que a tela não travou
export function CartoesCarregando({ quantidade = 3 }: { quantidade?: number }) {
  return (
    <div role="status" aria-label="Carregando" className="flex flex-col gap-4">
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="rounded-xl bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>
      ))}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

export function LinhasCarregando({ quantidade = 5 }: { quantidade?: number }) {
  return (
    <div role="status" aria-label="Carregando" className="divide-y divide-border">
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
      ))}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
