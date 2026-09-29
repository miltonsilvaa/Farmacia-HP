// Posologia em destaque e com letra grande: o cliente (muitas vezes idoso)
// consulta aqui em vez de ligar para a farmácia ou procurar a receita impressa
export default function ComoTomar({ posologia }: { posologia: string | null }) {
  if (!posologia) return null;
  return (
    <section
      aria-label="Como tomar"
      className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-4"
    >
      <p className="text-sm font-bold text-amber-900 uppercase tracking-wide flex items-center gap-2">
        <span aria-hidden="true">💊</span> Como tomar
      </p>
      <p className="mt-1 text-lg text-gray-900 leading-relaxed whitespace-pre-line">{posologia}</p>
    </section>
  );
}
