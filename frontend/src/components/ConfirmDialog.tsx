import { useEffect, useRef } from 'react';

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

// Substitui o confirm() nativo: acessível (role=dialog, Esc fecha, foco no Cancelar)
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
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (aberto) cancelarRef.current?.focus();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !processando) onCancelar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aberto, processando, onCancelar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        aria-describedby="confirm-mensagem"
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
      >
        <h2 id="confirm-titulo" className="text-lg font-bold text-gray-800">
          {titulo}
        </h2>
        <p id="confirm-mensagem" className="text-sm text-gray-600 mt-2">
          {mensagem}
        </p>
        <div className="flex gap-3 justify-end mt-6">
          <button
            ref={cancelarRef}
            type="button"
            onClick={onCancelar}
            disabled={processando}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={processando}
            className={`px-4 py-2 text-white font-bold rounded-lg transition-colors disabled:opacity-50 ${
              variante === 'perigo' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {processando ? 'Processando...' : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
