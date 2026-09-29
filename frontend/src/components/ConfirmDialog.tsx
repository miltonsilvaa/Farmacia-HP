import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  processando?: boolean;
  variante?: 'perigo' | 'primario';
  onConfirmar: () => void;
  onCancelar: () => void;
}

// Confirmação acessível (foco preso, Esc fecha) para ações que não têm volta
export default function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  processando = false,
  variante = 'perigo',
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={aberto}
      onOpenChange={(aberto) => {
        if (!aberto && !processando) onCancelar();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{mensagem}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel disabled={processando}>Voltar</AlertDialogCancel>
          <AlertDialogAction
            variant={variante === 'perigo' ? 'destructive' : 'default'}
            disabled={processando}
            onClick={(e) => {
              // Fecha só quando a ação terminar (quem chama controla o "aberto")
              e.preventDefault();
              onConfirmar();
            }}
          >
            {processando && <Loader2 aria-hidden="true" className="animate-spin" />}
            {processando ? 'Aguarde…' : textoConfirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
