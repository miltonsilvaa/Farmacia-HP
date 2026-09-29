import { cn } from '@/lib/utils';
import { CLASSES_COR, infoStatus } from '@/lib/status';

export default function StatusBadge({
  status,
  admin = false,
  className,
}: {
  status: string;
  admin?: boolean;
  className?: string;
}) {
  const info = infoStatus(status);
  const Icone = info.icone;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap',
        CLASSES_COR[info.cor],
        className,
      )}
    >
      <Icone aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.25} />
      {admin ? info.rotuloAdmin : info.rotulo}
    </span>
  );
}
