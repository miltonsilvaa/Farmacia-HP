import { Toaster } from 'sonner';

// Notificações flutuantes: verde para sucesso, vermelho para erro, letra grande
export default function Avisos() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        classNames: {
          toast: '!text-base !rounded-xl !shadow-float !p-4 !gap-3',
          title: '!font-bold',
          closeButton: '!size-7',
        },
      }}
    />
  );
}
