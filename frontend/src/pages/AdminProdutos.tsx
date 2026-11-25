import { useState, useEffect, useCallback } from 'react';
import { Check, Loader2, Package, PackageX, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatarMoeda } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import EstadoVazio from '@/components/EstadoVazio';
import { LinhasCarregando } from '@/components/Carregando';

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: string;
  estoque: number;
  imagemUrl: string | null;
  ativo: boolean;
  relacionadosIds: string[];
}

interface FormState {
  nome: string;
  descricao: string;
  preco: string;
  estoque: string;
  imagemUrl: string;
  ativo: boolean;
  relacionadosIds: string[];
}

const formVazio: FormState = {
  nome: '',
  descricao: '',
  preco: '',
  estoque: '0',
  imagemUrl: '',
  ativo: true,
  relacionadosIds: [],
};

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState<FormState>(formVazio);
  const [isSalvando, setIsSalvando] = useState(false);
  const [inativando, setInativando] = useState<Produto | null>(null);
  const [isInativando, setIsInativando] = useState(false);

  const carregarProdutos = useCallback(
    () =>
      apiFetch('/produtos/admin')
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then(setProdutos)
        .catch(() => {
          setProdutos((atual) => atual ?? []);
          toast.error('Não foi possível carregar o catálogo.');
        }),
    [],
  );

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  const abrirNovo = () => {
    setProdutoEditando(null);
    setForm(formVazio);
    setModalAberto(true);
  };

  const abrirEdicao = (p: Produto) => {
    setProdutoEditando(p);
    setForm({
      nome: p.nome,
      descricao: p.descricao ?? '',
      preco: Number(p.preco).toFixed(2).replace('.', ','),
      estoque: String(p.estoque),
      imagemUrl: p.imagemUrl ?? '',
      ativo: p.ativo,
      relacionadosIds: p.relacionadosIds ?? [],
    });
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const preco = parseFloat(form.preco.replace(',', '.'));
    if (!(preco >= 0)) {
      toast.error('Informe um preço válido.');
      return;
    }
    setIsSalvando(true);
    const payload = {
      nome: form.nome,
      descricao: form.descricao || undefined,
      preco,
      estoque: parseInt(form.estoque, 10) || 0,
      imagemUrl: form.imagemUrl || undefined,
      ativo: form.ativo,
      relacionadosIds: form.relacionadosIds,
    };
    try {
      const res = await apiFetch(produtoEditando ? `/produtos/admin/${produtoEditando.id}` : '/produtos', {
        method: produtoEditando ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.message);
      }
      // Recarrega para refletir os complementares nos dois produtos da ligação
      await carregarProdutos();
      toast.success(produtoEditando ? 'Produto atualizado.' : 'Produto cadastrado.');
      setModalAberto(false);
    } catch (e) {
      toast.error((e as Error).message || 'Não foi possível salvar o produto.');
    } finally {
      setIsSalvando(false);
    }
  };

  const handleInativar = async () => {
    if (!inativando) return;
    setIsInativando(true);
    try {
      const res = await apiFetch(`/produtos/admin/${inativando.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setProdutos((prev) => prev?.map((p) => (p.id === inativando.id ? { ...p, ativo: false } : p)) ?? prev);
      toast.success('Produto tirado do catálogo.');
    } catch {
      toast.error('Não foi possível inativar o produto.');
    } finally {
      setIsInativando(false);
      setInativando(null);
    }
  };

  const alternarRelacionado = (id: string) =>
    setForm((f) => ({
      ...f,
      relacionadosIds: f.relacionadosIds.includes(id)
        ? f.relacionadosIds.filter((r) => r !== id)
        : [...f.relacionadosIds, id],
    }));

  const outrosProdutos = (produtos ?? []).filter((p) => p.id !== produtoEditando?.id && p.ativo);
  const campo =
    (nome: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [nome]: e.target.value }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Catálogo</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            {produtos === null ? 'Carregando…' : `${produtos.filter((p) => p.ativo).length} produto(s) à venda`}
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus aria-hidden="true" />
          Novo produto
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-card">
        {produtos === null ? (
          <LinhasCarregando />
        ) : produtos.length === 0 ? (
          <EstadoVazio
            icone={Package}
            titulo="Catálogo vazio"
            texto="Cadastre os produtos que o cliente pode adicionar ao pedido."
            acao={
              <Button onClick={abrirNovo} className="w-full">
                <Plus aria-hidden="true" />
                Cadastrar o primeiro
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left">
              <thead>
                <tr className="border-b bg-muted/60 text-sm text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-bold">Produto</th>
                  <th scope="col" className="px-5 py-3 text-right font-bold">Preço</th>
                  <th scope="col" className="px-5 py-3 text-right font-bold">Estoque</th>
                  <th scope="col" className="px-5 py-3 font-bold">Situação</th>
                  <th scope="col" className="px-5 py-3 text-right font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => (
                  <tr key={p.id} className={cn('border-b last:border-0 hover:bg-muted/40', !p.ativo && 'text-muted-foreground')}>
                    <td className="px-5 py-4">
                      <p className="font-bold">{p.nome}</p>
                      {p.descricao && <p className="max-w-md truncate text-sm text-muted-foreground">{p.descricao}</p>}
                      {p.relacionadosIds?.length > 0 && (
                        <p className="text-sm text-muted-foreground">{p.relacionadosIds.length} complementar(es)</p>
                      )}
                    </td>
                    <td className="tabular px-5 py-4 text-right font-bold">{formatarMoeda(p.preco)}</td>
                    <td className="tabular px-5 py-4 text-right">{p.estoque}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-sm font-bold',
                          p.ativo ? 'bg-status-verde-soft text-status-verde' : 'bg-status-cinza-soft text-status-cinza',
                        )}
                      >
                        {p.ativo ? 'À venda' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => abrirEdicao(p)}>
                          <Pencil aria-hidden="true" />
                          Editar
                        </Button>
                        {p.ativo && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive-soft"
                            onClick={() => setInativando(p)}
                          >
                            <PackageX aria-hidden="true" />
                            Inativar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={modalAberto} onOpenChange={(aberto) => !aberto && !isSalvando && setModalAberto(false)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{produtoEditando ? 'Editar produto' : 'Novo produto'}</DialogTitle>
            <DialogDescription>Os produtos à venda aparecem para o cliente no envio da receita.</DialogDescription>
          </DialogHeader>
          <form id="form-produto" onSubmit={handleSalvar} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="produto-nome">Nome</Label>
              <Input id="produto-nome" required value={form.nome} onChange={campo('nome')} placeholder="Ex.: Vitamina C 500 mg" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="produto-descricao">Descrição (opcional)</Label>
              <Textarea id="produto-descricao" rows={2} value={form.descricao} onChange={campo('descricao')} placeholder="Ex.: frasco com 30 cápsulas" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="produto-preco">Preço (R$)</Label>
                <Input id="produto-preco" required inputMode="decimal" value={form.preco} onChange={campo('preco')} placeholder="0,00" className="tabular" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="produto-estoque">Estoque</Label>
                <Input id="produto-estoque" type="number" min="0" value={form.estoque} onChange={campo('estoque')} className="tabular" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="produto-imagem">Link da imagem (opcional)</Label>
              <Input id="produto-imagem" type="url" value={form.imagemUrl} onChange={campo('imagemUrl')} placeholder="https://…" />
            </div>

            {outrosProdutos.length > 0 && (
              <fieldset>
                <legend className="text-base font-bold">Produtos complementares</legend>
                <p className="text-muted-foreground">Sugeridos ao cliente quando este produto estiver no pedido (e vice-versa).</p>
                <div className="mt-2 max-h-48 divide-y overflow-y-auto rounded-xl border">
                  {outrosProdutos.map((p) => (
                    <label key={p.id} className="flex min-h-12 cursor-pointer items-center gap-3 px-4 hover:bg-muted/60">
                      <input
                        type="checkbox"
                        checked={form.relacionadosIds.includes(p.id)}
                        onChange={() => alternarRelacionado(p.id)}
                        className="size-5"
                      />
                      {p.nome}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {produtoEditando && (
              <label className="flex min-h-12 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                  className="size-5"
                />
                <span className="font-bold">À venda (aparece para o cliente)</span>
              </label>
            )}
          </form>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setModalAberto(false)} disabled={isSalvando}>
              Cancelar
            </Button>
            <Button type="submit" form="form-produto" disabled={isSalvando}>
              {isSalvando ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Check aria-hidden="true" />}
              {produtoEditando ? 'Salvar alterações' : 'Cadastrar produto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={inativando !== null}
        titulo={`Tirar "${inativando?.nome ?? ''}" do catálogo?`}
        mensagem="O produto deixa de aparecer para os clientes. Pedidos antigos continuam com ele."
        textoConfirmar="Inativar"
        processando={isInativando}
        onConfirmar={handleInativar}
        onCancelar={() => setInativando(null)}
      />
    </div>
  );
}
