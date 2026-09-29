import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CircleCheckBig,
  FileText,
  FolderOpen,
  Loader2,
  Minus,
  PawPrint,
  Plus,
  Paperclip,
  Send,
  Sparkles,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatarMoeda, numeroPedido } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: string;
  imagemUrl: string | null;
}

interface Familiar {
  id: string;
  nome: string;
  parentesco: string;
  tipo: 'PESSOA' | 'PET';
  especie: string | null;
  proprio: boolean;
  titularEmail: string | null;
}

interface ItemCarrinho {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
}

const MAX_ANEXOS = 5;
const MAX_BYTES = 10 * 1024 * 1024;

const PASSOS = ['Para quem é', 'Receita', 'Algo mais?', 'Conferir e enviar'];

function descricaoFamiliar(f: Familiar) {
  const detalhe = f.tipo === 'PET' ? `Pet${f.especie ? ` · ${f.especie}` : ''}` : f.parentesco;
  return f.proprio ? detalhe : `${detalhe} · família de ${f.titularEmail}`;
}

export default function NovoOrcamento() {
  const [passo, setPasso] = useState(0);
  const [familiarId, setFamiliarId] = useState<string>(''); // '' = o próprio titular
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [anexos, setAnexos] = useState<File[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [carrinho, setCarrinho] = useState<Map<string, ItemCarrinho>>(new Map());
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [sugestoes, setSugestoes] = useState<Produto[]>([]);
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    apiFetch('/produtos')
      .then((r) => (r.ok ? r.json() : []))
      .then(setProdutos)
      .catch(() => {});
    apiFetch('/familiares')
      .then((r) => (r.ok ? r.json() : []))
      .then(setFamiliares)
      .catch(() => {});
  }, []);

  // Ao trocar de passo, o foco vai para o título: o leitor de tela anuncia onde a pessoa está
  useEffect(() => {
    tituloRef.current?.focus();
  }, [passo]);

  // Sugestões de produtos complementares aos que já estão no pedido
  const idsNoCarrinho = Array.from(carrinho.keys()).sort().join(',');
  useEffect(() => {
    if (!idsNoCarrinho) return;
    let cancelado = false;
    apiFetch(`/produtos/sugestoes?ids=${encodeURIComponent(idsNoCarrinho)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((lista) => {
        if (!cancelado) setSugestoes(lista);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [idsNoCarrinho]);
  const sugestoesVisiveis = idsNoCarrinho ? sugestoes.filter((p) => !carrinho.has(p.id)) : [];

  // Miniatura da foto da receita, para a pessoa conferir que saiu legível
  const previa = useMemo(
    () => (arquivo && arquivo.type.startsWith('image/') ? URL.createObjectURL(arquivo) : null),
    [arquivo],
  );
  useEffect(() => () => {
    if (previa) URL.revokeObjectURL(previa);
  }, [previa]);

  const escolherReceita = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error('Esse arquivo é maior que 10 MB. Tente uma foto com menos qualidade.');
      return;
    }
    setArquivo(f);
  };

  const escolherAnexos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novos = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (novos.some((f) => f.size > MAX_BYTES)) toast.error('Cada arquivo pode ter no máximo 10 MB.');
    setAnexos((prev) => {
      const juntos = [...prev, ...novos.filter((f) => f.size <= MAX_BYTES)];
      if (juntos.length > MAX_ANEXOS) toast.error(`Você pode enviar até ${MAX_ANEXOS} arquivos extras.`);
      return juntos.slice(0, MAX_ANEXOS);
    });
  };

  const mudarQuantidade = (produto: Pick<Produto, 'id' | 'nome' | 'preco'>, delta: number) =>
    setCarrinho((prev) => {
      const next = new Map(prev);
      const atual = next.get(produto.id);
      const quantidade = (atual?.quantidade ?? 0) + delta;
      if (quantidade <= 0) next.delete(produto.id);
      else
        next.set(produto.id, {
          produtoId: produto.id,
          nome: produto.nome,
          preco: Number(produto.preco),
          quantidade: Math.min(quantidade, 99),
        });
      return next;
    });

  const itens = Array.from(carrinho.values());
  const subtotal = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
  const pacienteEscolhido = familiares.find((f) => f.id === familiarId);
  const nomePaciente = pacienteEscolhido?.nome ?? 'Você mesmo(a)';

  const podeAvancar = passo !== 1 || arquivo !== null;

  const avancar = () => {
    if (!podeAvancar) {
      toast.error('Envie a foto ou o arquivo da receita para continuar.');
      return;
    }
    setPasso((p) => Math.min(p + 1, PASSOS.length - 1));
    window.scrollTo({ top: 0 });
  };
  const voltar = () => {
    setPasso((p) => Math.max(p - 1, 0));
    window.scrollTo({ top: 0 });
  };

  const enviar = async () => {
    if (!arquivo) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      anexos.forEach((a) => formData.append('anexos', a));
      if (observacoes) formData.append('observacoes', observacoes);
      if (familiarId) formData.append('familiarId', familiarId);
      if (itens.length > 0) {
        formData.append(
          'itens',
          JSON.stringify(itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade }))),
        );
      }

      const response = await apiFetch('/orcamentos/receita', { method: 'POST', body: formData });
      const dados = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(
          typeof dados.message === 'string'
            ? dados.message
            : 'Não conseguimos enviar sua receita. Tente de novo em instantes.',
        );
        return;
      }
      setProtocolo(dados.id);
      window.scrollTo({ top: 0 });
    } catch {
      toast.error('Sem conexão com a farmácia. Confira sua internet e tente de novo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Confirmação ----------
  if (protocolo) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl bg-card p-6 text-center shadow-card sm:p-10">
          <span
            aria-hidden="true"
            className="mx-auto grid size-20 place-items-center rounded-full bg-status-verde-soft text-status-verde"
          >
            <CircleCheckBig className="size-11" />
          </span>
          <h1 className="mt-5 text-3xl font-bold">Receita enviada!</h1>
          <p className="mt-2 text-lg text-muted-foreground">Guarde o número do seu pedido:</p>
          <p className="tabular mt-2 inline-block rounded-xl bg-muted px-5 py-2 text-3xl font-bold tracking-wider">
            #{numeroPedido(protocolo)}
          </p>

          <ol className="mt-8 space-y-4 text-left">
            {[
              'A farmácia confere a receita.',
              'Você recebe um e-mail quando o orçamento estiver pronto.',
              'Você aprova o valor aqui no app e a gente começa a preparar.',
            ].map((texto, i) => (
              <li key={texto} className="flex items-start gap-3">
                <span className="tabular grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-accent-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-lg">{texto}</span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link to={`/meus-pedidos#pedido-${protocolo}`}>Acompanhar meu pedido</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/">Voltar ao início</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Passos ----------
  return (
    <div className="mx-auto max-w-2xl">
      {/* Indicador de progresso */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3">
          {passo > 0 ? (
            <Button variant="ghost" onClick={voltar} disabled={isSubmitting} className="-ml-3">
              <ArrowLeft aria-hidden="true" />
              Voltar
            </Button>
          ) : (
            <Button asChild variant="ghost" className="-ml-3">
              <Link to="/">
                <ArrowLeft aria-hidden="true" />
                Início
              </Link>
            </Button>
          )}
          <p className="font-bold text-muted-foreground">
            Passo {passo + 1} de {PASSOS.length}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2" aria-hidden="true">
          {PASSOS.map((nome, i) => (
            <span
              key={nome}
              className={cn('h-2 rounded-full transition-colors', i <= passo ? 'bg-primary' : 'bg-border')}
            />
          ))}
        </div>
      </div>

      {/* Passo 1: paciente */}
      {passo === 0 && (
        <section>
          <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold outline-none">
            Para quem é o remédio?
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">Toque em uma opção.</p>

          <div role="radiogroup" aria-label="Para quem é o remédio" className="mt-6 flex flex-col gap-3">
            {[
              { id: '', nome: 'Para mim', detalhe: 'O titular da conta', icone: User },
              ...familiares.map((f) => ({
                id: f.id,
                nome: f.nome,
                detalhe: descricaoFamiliar(f),
                icone: f.tipo === 'PET' ? PawPrint : User,
              })),
            ].map(({ id, nome, detalhe, icone: Icone }) => {
              const marcado = familiarId === id;
              return (
                <button
                  key={id || 'titular'}
                  type="button"
                  role="radio"
                  aria-checked={marcado}
                  onClick={() => setFamiliarId(id)}
                  className={cn(
                    'flex min-h-18 items-center gap-4 rounded-2xl border-2 bg-card px-5 py-4 text-left transition-[border-color,background-color]',
                    marcado ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary/50',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'grid size-12 shrink-0 place-items-center rounded-full',
                      marcado ? 'bg-primary text-primary-foreground' : 'bg-muted text-accent-foreground',
                    )}
                  >
                    <Icone className="size-6" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-lg font-bold">{nome}</span>
                    <span className="block text-muted-foreground">{detalhe}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'grid size-7 shrink-0 place-items-center rounded-full border-2',
                      marcado ? 'border-primary bg-primary' : 'border-input',
                    )}
                  >
                    {marcado && <span className="size-2.5 rounded-full bg-card" />}
                  </span>
                </button>
              );
            })}
          </div>

          <Link
            to="/grupo-familia"
            className="mt-4 inline-flex min-h-12 items-center gap-2 font-bold text-primary hover:text-primary-hover"
          >
            <UserPlus aria-hidden="true" className="size-5" />
            Cadastrar parente ou pet
          </Link>
        </section>
      )}

      {/* Passo 2: receita */}
      {passo === 1 && (
        <section>
          <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold outline-none">
            Envie a receita
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Coloque a receita em um lugar claro e tire a foto de cima, pegando a folha inteira.
          </p>

          {arquivo ? (
            <div className="mt-6 overflow-hidden rounded-2xl bg-card shadow-card">
              {previa ? (
                <img src={previa} alt="Foto da receita enviada" className="max-h-80 w-full bg-muted object-contain" />
              ) : (
                <div className="flex items-center gap-3 bg-muted px-5 py-8">
                  <FileText aria-hidden="true" className="size-10 text-accent-foreground" />
                  <span className="font-bold">Arquivo PDF</span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <p className="flex min-w-0 items-center gap-2 font-bold text-status-verde">
                  <CircleCheckBig aria-hidden="true" className="size-5 shrink-0" />
                  <span className="truncate">{arquivo.name}</span>
                </p>
                <Button variant="outline" onClick={() => setArquivo(null)}>
                  Trocar receita
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {/* No celular, "capture" abre direto a câmera traseira */}
              <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl bg-primary p-6 text-center text-primary-foreground shadow-card transition-colors hover:bg-primary-hover focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ring">
                <Camera aria-hidden="true" className="size-12" />
                <span className="text-xl font-bold">Tirar foto da receita</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={escolherReceita}
                  className="sr-only"
                />
              </label>
              <label className="flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-primary/30 bg-card px-5 text-lg font-bold text-accent-foreground transition-colors hover:border-primary hover:bg-primary-soft focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ring">
                <FolderOpen aria-hidden="true" className="size-6" />
                Escolher foto ou PDF salvo
                <input type="file" accept="image/*,.pdf" onChange={escolherReceita} className="sr-only" />
              </label>
              <p className="text-center text-muted-foreground">Foto ou PDF de até 10 MB.</p>
            </div>
          )}

          {/* Arquivos extras */}
          <div className="mt-8">
            <h2 className="text-xl font-bold">Tem exames ou outra receita?</h2>
            <p className="text-muted-foreground">Opcional. Até {MAX_ANEXOS} arquivos.</p>
            {anexos.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {anexos.map((a, i) => (
                  <li
                    key={`${a.name}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-card py-1 pr-1 pl-4 shadow-card"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Paperclip aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{a.name}</span>
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => setAnexos((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={`Remover ${a.name}`}
                      className="text-destructive"
                    >
                      <X aria-hidden="true" />
                      Remover
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {anexos.length < MAX_ANEXOS && (
              <label className="mt-3 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border-2 border-primary/30 bg-card px-4 font-bold text-accent-foreground transition-colors hover:border-primary hover:bg-primary-soft focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ring">
                <Paperclip aria-hidden="true" className="size-5" />
                Adicionar arquivo
                <input type="file" multiple accept="image/*,.pdf" onChange={escolherAnexos} className="sr-only" />
              </label>
            )}
          </div>
        </section>
      )}

      {/* Passo 3: observações e produtos */}
      {passo === 2 && (
        <section>
          <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold outline-none">
            Quer dizer algo à farmácia?
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">Tudo aqui é opcional. Se não precisar, é só continuar.</p>

          <div className="mt-6 flex flex-col gap-2">
            <Label htmlFor="observacoes">Recado para o farmacêutico</Label>
            <Textarea
              id="observacoes"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex.: prefiro cápsulas vegetais."
            />
          </div>

          {sugestoesVisiveis.length > 0 && (
            <section aria-labelledby="titulo-sugestoes" className="mt-8 rounded-2xl bg-primary-soft p-5">
              <h2 id="titulo-sugestoes" className="flex items-center gap-2 text-lg font-bold text-accent-foreground">
                <Sparkles aria-hidden="true" className="size-5" />
                Combina com o seu pedido
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {sugestoesVisiveis.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-card py-2 pr-2 pl-4">
                    <span className="min-w-0">
                      <span className="block font-bold">{p.nome}</span>
                      <span className="tabular block text-muted-foreground">{formatarMoeda(p.preco)}</span>
                    </span>
                    <Button variant="outline" onClick={() => mudarQuantidade(p, 1)} aria-label={`Adicionar ${p.nome}`}>
                      <Plus aria-hidden="true" />
                      Adicionar
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {produtos.length > 0 && (
            <section aria-labelledby="titulo-catalogo" className="mt-8">
              <h2 id="titulo-catalogo" className="text-xl font-bold">
                Produtos da farmácia
              </h2>
              <p className="text-muted-foreground">Quer aproveitar e levar junto?</p>
              <ul className="mt-3 divide-y overflow-hidden rounded-2xl bg-card shadow-card">
                {produtos.map((p) => {
                  const noCarrinho = carrinho.get(p.id);
                  return (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{p.nome}</span>
                        {p.descricao && <span className="block text-muted-foreground">{p.descricao}</span>}
                        <span className="tabular block font-bold text-status-verde">{formatarMoeda(p.preco)}</span>
                      </span>
                      {noCarrinho ? (
                        <span className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => mudarQuantidade(p, -1)}
                            aria-label={`Diminuir ${p.nome}`}
                          >
                            <Minus aria-hidden="true" />
                          </Button>
                          <span className="tabular w-10 text-center text-lg font-bold" aria-live="polite">
                            {noCarrinho.quantidade}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => mudarQuantidade(p, 1)}
                            aria-label={`Aumentar ${p.nome}`}
                          >
                            <Plus aria-hidden="true" />
                          </Button>
                        </span>
                      ) : (
                        <Button variant="outline" onClick={() => mudarQuantidade(p, 1)} aria-label={`Adicionar ${p.nome}`}>
                          <Plus aria-hidden="true" />
                          Adicionar
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </section>
      )}

      {/* Passo 4: revisão */}
      {passo === 3 && (
        <section>
          <h1 ref={tituloRef} tabIndex={-1} className="text-3xl font-bold outline-none">
            Confira antes de enviar
          </h1>
          <dl className="mt-6 divide-y overflow-hidden rounded-2xl bg-card shadow-card">
            {[
              { rotulo: 'Para quem', valor: nomePaciente, passo: 0 },
              {
                rotulo: 'Receita',
                valor: `${arquivo?.name ?? '—'}${anexos.length ? ` + ${anexos.length} arquivo(s)` : ''}`,
                passo: 1,
              },
              { rotulo: 'Recado', valor: observacoes || 'Nenhum', passo: 2 },
            ].map((linha) => (
              <div key={linha.rotulo} className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <dt className="text-muted-foreground">{linha.rotulo}</dt>
                  <dd className="break-words text-lg font-bold">{linha.valor}</dd>
                </div>
                <Button variant="ghost" onClick={() => setPasso(linha.passo)} className="text-primary">
                  Alterar
                </Button>
              </div>
            ))}
            {itens.length > 0 && (
              <div className="px-5 py-4">
                <dt className="text-muted-foreground">Produtos</dt>
                <dd>
                  <ul className="mt-1">
                    {itens.map((i) => (
                      <li key={i.produtoId} className="tabular flex justify-between gap-3 text-lg">
                        <span>
                          {i.nome} × {i.quantidade}
                        </span>
                        <span>{formatarMoeda(i.preco * i.quantidade)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="tabular mt-2 flex justify-between border-t pt-2 text-lg font-bold">
                    <span>Subtotal dos produtos</span>
                    <span>{formatarMoeda(subtotal)}</span>
                  </p>
                </dd>
              </div>
            )}
          </dl>
          <p className="mt-4 text-muted-foreground">
            O valor da fórmula vem no orçamento. Você só paga depois de aprovar.
          </p>
        </section>
      )}

      {/* Barra de ação: fica ao alcance do polegar no celular */}
      <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-8 border-t bg-background px-4 py-4 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0">
        {passo < PASSOS.length - 1 ? (
          <Button size="lg" onClick={avancar} aria-disabled={!podeAvancar} className={cn('w-full', !podeAvancar && 'opacity-55')}>
            Continuar
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : (
          <Button size="lg" onClick={enviar} disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" />
                Enviando sua receita…
              </>
            ) : (
              <>
                <Send aria-hidden="true" />
                Enviar para a farmácia
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
