import { useState, useEffect, useCallback } from 'react';
import {
  Check,
  Loader2,
  Mail,
  PawPrint,
  Pencil,
  Share2,
  Trash2,
  User,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatarDataUTC } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/ConfirmDialog';
import EstadoVazio from '@/components/EstadoVazio';
import { CartoesCarregando } from '@/components/Carregando';

interface Familiar {
  id: string;
  nome: string;
  parentesco: string;
  tipo: 'PESSOA' | 'PET';
  especie: string | null;
  dataNascimento: string | null;
  proprio: boolean;
  titularEmail: string | null;
}

interface AcessoConcedido {
  id: string;
  emailConvidado: string;
  status: 'PENDENTE' | 'ACEITO';
}

interface AcessoRecebido {
  id: string;
  titularEmail: string;
  status: 'PENDENTE' | 'ACEITO';
}

interface FormState {
  tipo: 'PESSOA' | 'PET';
  nome: string;
  parentesco: string;
  especie: string;
  dataNascimento: string;
}

const formVazio: FormState = { tipo: 'PESSOA', nome: '', parentesco: '', especie: '', dataNascimento: '' };

type Confirmacao =
  | { tipo: 'familiar'; id: string; nome: string }
  | { tipo: 'acesso'; id: string; titulo: string; texto: string; botao: string };

const PARENTESCOS = ['Filho(a)', 'Pai/Mãe', 'Cônjuge', 'Irmão(ã)', 'Avô/Avó', 'Outro'];
const ESPECIES = ['Cão', 'Gato', 'Ave', 'Outro'];

const selectClass =
  'h-13 w-full rounded-lg border-2 border-input bg-card px-4 text-base outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/25 disabled:bg-muted';

function descricaoFamiliar(f: Familiar) {
  if (f.tipo === 'PET') return f.especie ? `Pet · ${f.especie}` : 'Pet';
  return f.parentesco;
}

function Avatar({ tipo }: { tipo: 'PESSOA' | 'PET' }) {
  const Icone: LucideIcon = tipo === 'PET' ? PawPrint : User;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-12 shrink-0 place-items-center rounded-full',
        tipo === 'PET' ? 'bg-status-laranja-soft text-status-laranja' : 'bg-primary-soft text-accent-foreground',
      )}
    >
      <Icone className="size-6" />
    </span>
  );
}

export default function GrupoFamilia() {
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [concedidos, setConcedidos] = useState<AcessoConcedido[]>([]);
  const [recebidos, setRecebidos] = useState<AcessoRecebido[]>([]);
  const [isCarregando, setIsCarregando] = useState(true);

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(formVazio);
  const [isSalvando, setIsSalvando] = useState(false);

  const [emailConvite, setEmailConvite] = useState('');
  const [isConvidando, setIsConvidando] = useState(false);
  const [processandoAcesso, setProcessandoAcesso] = useState<string | null>(null);

  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const [isConfirmando, setIsConfirmando] = useState(false);

  const carregar = useCallback(
    () =>
      Promise.all([apiFetch('/familiares'), apiFetch('/familia/acessos')])
        .then(async ([resFamiliares, resAcessos]) => {
          if (resFamiliares.ok) {
            setFamiliares(await resFamiliares.json());
          } else {
            toast.error('Não conseguimos carregar sua família.');
          }
          if (resAcessos.ok) {
            const acessos = await resAcessos.json();
            setConcedidos(acessos.concedidos);
            setRecebidos(acessos.recebidos);
          }
        })
        .catch(() => toast.error('Sem conexão. Confira sua internet.'))
        .finally(() => setIsCarregando(false)),
    [],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const proprios = familiares.filter((f) => f.proprio);
  const compartilhados = familiares.filter((f) => !f.proprio);
  const convitesPendentes = recebidos.filter((r) => r.status === 'PENDENTE');
  const gruposQueParticipo = recebidos.filter((r) => r.status === 'ACEITO');

  const abrirNovo = () => {
    setEditandoId(null);
    setForm(formVazio);
    setFormAberto(true);
  };

  const abrirEdicao = (f: Familiar) => {
    setEditandoId(f.id);
    setForm({
      tipo: f.tipo,
      nome: f.nome,
      parentesco: f.tipo === 'PESSOA' ? f.parentesco : '',
      especie: f.especie ?? '',
      dataNascimento: f.dataNascimento ? f.dataNascimento.slice(0, 10) : '',
    });
    setFormAberto(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fecharForm = () => {
    setFormAberto(false);
    setEditandoId(null);
    setForm(formVazio);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSalvando(true);
    try {
      const response = await apiFetch(editandoId ? `/familiares/${editandoId}` : '/familiares', {
        method: editandoId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          tipo: form.tipo,
          nome: form.nome,
          parentesco: form.tipo === 'PESSOA' ? form.parentesco : undefined,
          especie: form.tipo === 'PET' ? form.especie : undefined,
          dataNascimento: form.dataNascimento || '',
        }),
      });
      if (!response.ok) throw new Error();
      await carregar();
      toast.success(
        editandoId ? 'Dados atualizados!' : form.tipo === 'PET' ? 'Pet cadastrado!' : 'Parente cadastrado!',
      );
      fecharForm();
    } catch {
      toast.error('Não conseguimos salvar. Confira os dados e tente de novo.');
    } finally {
      setIsSalvando(false);
    }
  };

  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConvidando(true);
    try {
      const response = await apiFetch('/familia/acessos', {
        method: 'POST',
        body: JSON.stringify({ email: emailConvite }),
      });
      if (!response.ok) {
        const erro = await response.json().catch(() => ({}));
        toast.error(erro.message ?? 'Não conseguimos enviar o convite.');
        return;
      }
      setEmailConvite('');
      await carregar();
      toast.success('Convite enviado! A pessoa verá o convite quando entrar no app.');
    } catch {
      toast.error('Sem conexão. Confira sua internet.');
    } finally {
      setIsConvidando(false);
    }
  };

  const handleAceitar = async (acessoId: string) => {
    setProcessandoAcesso(acessoId);
    try {
      const response = await apiFetch(`/familia/acessos/${acessoId}/aceitar`, { method: 'POST' });
      if (!response.ok) throw new Error();
      await carregar();
      toast.success('Convite aceito! Os dependentes compartilhados já aparecem aqui.');
    } catch {
      toast.error('Não conseguimos aceitar o convite.');
    } finally {
      setProcessandoAcesso(null);
    }
  };

  const handleConfirmar = async () => {
    if (!confirmacao) return;
    setIsConfirmando(true);
    try {
      const url =
        confirmacao.tipo === 'familiar' ? `/familiares/${confirmacao.id}` : `/familia/acessos/${confirmacao.id}`;
      const response = await apiFetch(url, { method: 'DELETE' });
      if (!response.ok) {
        const erro = await response.json().catch(() => ({}));
        toast.error(erro.message ?? 'Não foi possível concluir.');
        return;
      }
      await carregar();
      toast.success(confirmacao.tipo === 'familiar' ? 'Removido da sua família.' : 'Pronto, acesso removido.');
    } catch {
      toast.error('Sem conexão. Tente de novo.');
    } finally {
      setIsConfirmando(false);
      setConfirmacao(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minha família</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Cadastre parentes e pets para pedir remédios para eles.
          </p>
        </div>
        {!formAberto && (
          <Button onClick={abrirNovo} className="w-full sm:w-auto">
            <UserPlus aria-hidden="true" />
            Cadastrar parente ou pet
          </Button>
        )}
      </div>

      {/* Convites recebidos */}
      {convitesPendentes.map((c) => (
        <section
          key={c.id}
          aria-label="Convite recebido"
          className="flex flex-col gap-4 rounded-2xl bg-status-amarelo-soft p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-3 text-lg">
            <Mail aria-hidden="true" className="mt-1 size-6 shrink-0 text-status-amarelo" />
            <span>
              <strong>{c.titularEmail}</strong> quer compartilhar a família com você.
            </span>
          </p>
          <div className="flex gap-2">
            <Button onClick={() => handleAceitar(c.id)} disabled={processandoAcesso === c.id} className="flex-1">
              {processandoAcesso === c.id ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <Check aria-hidden="true" />
              )}
              Aceitar
            </Button>
            <Button
              variant="destructive-outline"
              disabled={processandoAcesso === c.id}
              className="flex-1"
              onClick={() =>
                setConfirmacao({
                  tipo: 'acesso',
                  id: c.id,
                  titulo: 'Recusar convite?',
                  texto: `Você não vai ver os dependentes de ${c.titularEmail}.`,
                  botao: 'Recusar',
                })
              }
            >
              Recusar
            </Button>
          </div>
        </section>
      ))}

      {/* Cadastro / edição */}
      {formAberto && (
        <section aria-labelledby="titulo-form" className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
          <h2 id="titulo-form" className="text-xl font-bold">
            {editandoId ? 'Editar cadastro' : 'Novo cadastro'}
          </h2>
          <form onSubmit={handleSalvar} className="mt-5 flex flex-col gap-5">
            <fieldset>
              <legend className="mb-2 text-base font-bold">É um parente ou um pet?</legend>
              <div className="grid grid-cols-2 gap-3">
                {(['PESSOA', 'PET'] as const).map((tipo) => {
                  const Icone = tipo === 'PET' ? PawPrint : User;
                  const marcado = form.tipo === tipo;
                  return (
                    <label
                      key={tipo}
                      className={cn(
                        'flex min-h-16 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 text-lg font-bold transition-colors focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ring',
                        marcado
                          ? 'border-primary bg-primary-soft text-accent-foreground'
                          : 'border-border bg-card hover:border-primary/50',
                      )}
                    >
                      <input
                        type="radio"
                        name="tipo"
                        value={tipo}
                        checked={marcado}
                        onChange={() => setForm((f) => ({ ...f, tipo }))}
                        className="sr-only"
                      />
                      <Icone aria-hidden="true" className="size-6" />
                      {tipo === 'PESSOA' ? 'Parente' : 'Pet'}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <Label htmlFor="familiar-nome">{form.tipo === 'PET' ? 'Nome do pet' : 'Nome completo'}</Label>
              <Input
                id="familiar-nome"
                required
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                disabled={isSalvando}
                placeholder={form.tipo === 'PET' ? 'Ex.: Pipoca' : 'Ex.: Ana Souza'}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {form.tipo === 'PESSOA' ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="familiar-parentesco">Parentesco</Label>
                  <select
                    id="familiar-parentesco"
                    required
                    value={form.parentesco}
                    onChange={(e) => setForm((f) => ({ ...f, parentesco: e.target.value }))}
                    disabled={isSalvando}
                    className={selectClass}
                  >
                    <option value="">Escolha…</option>
                    {PARENTESCOS.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="familiar-especie">Espécie</Label>
                  <select
                    id="familiar-especie"
                    required
                    value={form.especie}
                    onChange={(e) => setForm((f) => ({ ...f, especie: e.target.value }))}
                    disabled={isSalvando}
                    className={selectClass}
                  >
                    <option value="">Escolha…</option>
                    {ESPECIES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="familiar-nascimento">Data de nascimento (opcional)</Label>
                <Input
                  id="familiar-nascimento"
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => setForm((f) => ({ ...f, dataNascimento: e.target.value }))}
                  disabled={isSalvando}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={fecharForm} disabled={isSalvando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSalvando}>
                {isSalvando ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Check aria-hidden="true" />}
                {isSalvando ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Meus dependentes */}
      <section aria-labelledby="titulo-dependentes">
        <h2 id="titulo-dependentes" className="mb-3 text-xl font-bold">
          Quem eu cuido
        </h2>
        {isCarregando ? (
          <CartoesCarregando quantidade={2} />
        ) : proprios.length === 0 ? (
          <div className="rounded-2xl bg-card shadow-card">
            <EstadoVazio
              icone={Users}
              titulo="Ninguém cadastrado ainda"
              texto="Cadastre sua mãe, seu filho ou seu pet para pedir remédios para eles com poucos toques."
              acao={
                !formAberto && (
                  <Button onClick={abrirNovo} size="lg" className="w-full">
                    <UserPlus aria-hidden="true" />
                    Cadastrar o primeiro
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-2xl bg-card shadow-card">
            {proprios.map((f) => (
              <li key={f.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar tipo={f.tipo} />
                  <div>
                    <p className="text-lg font-bold">{f.nome}</p>
                    <p className="text-muted-foreground">
                      {descricaoFamiliar(f)}
                      {f.dataNascimento && <> · nasceu em {formatarDataUTC(f.dataNascimento)}</>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 sm:justify-end">
                  <Button variant="ghost" onClick={() => abrirEdicao(f)} aria-label={`Editar ${f.nome}`}>
                    <Pencil aria-hidden="true" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:bg-destructive-soft"
                    onClick={() => setConfirmacao({ tipo: 'familiar', id: f.id, nome: f.nome })}
                    aria-label={`Remover ${f.nome}`}
                  >
                    <Trash2 aria-hidden="true" />
                    Remover
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Compartilhados comigo */}
      {compartilhados.length > 0 && (
        <section aria-labelledby="titulo-compartilhados">
          <h2 id="titulo-compartilhados" className="text-xl font-bold">
            Compartilhados com você
          </h2>
          <p className="mb-3 text-muted-foreground">
            Você pode pedir remédios e acompanhar os pedidos deles. Só quem cadastrou pode editar.
          </p>
          <ul className="divide-y overflow-hidden rounded-2xl bg-card shadow-card">
            {compartilhados.map((f) => (
              <li key={f.id} className="flex items-center gap-4 p-5">
                <Avatar tipo={f.tipo} />
                <div>
                  <p className="text-lg font-bold">{f.nome}</p>
                  <p className="text-muted-foreground">
                    {descricaoFamiliar(f)} · família de {f.titularEmail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            {gruposQueParticipo.map((g) => (
              <Button
                key={g.id}
                variant="ghost"
                className="text-destructive hover:bg-destructive-soft"
                onClick={() =>
                  setConfirmacao({
                    tipo: 'acesso',
                    id: g.id,
                    titulo: 'Sair desta família?',
                    texto: `Você deixa de ver os dependentes e pedidos da família de ${g.titularEmail}.`,
                    botao: 'Sair',
                  })
                }
              >
                Sair da família de {g.titularEmail}
              </Button>
            ))}
          </div>
        </section>
      )}

      {/* Compartilhar minha família */}
      <section aria-labelledby="titulo-compartilhar" className="rounded-2xl bg-card p-5 shadow-card sm:p-6">
        <h2 id="titulo-compartilhar" className="flex items-center gap-2 text-xl font-bold">
          <Share2 aria-hidden="true" className="size-6 text-primary" />
          Dividir os cuidados com alguém
        </h2>
        <p className="mt-1 text-muted-foreground">
          Convide outra pessoa da família (ex.: marido, esposa, irmã) pelo e-mail que ela usa no app. Quem
          aceitar pode pedir remédios e acompanhar os pedidos de quem você cuida. Seus pedidos pessoais
          continuam só seus.
        </p>
        <form onSubmit={handleConvidar} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="email-convite">E-mail da pessoa</Label>
            <Input
              id="email-convite"
              type="email"
              required
              autoComplete="off"
              value={emailConvite}
              onChange={(e) => setEmailConvite(e.target.value)}
              disabled={isConvidando}
              placeholder="nome@exemplo.com"
            />
          </div>
          <Button type="submit" disabled={isConvidando}>
            {isConvidando ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Mail aria-hidden="true" />}
            {isConvidando ? 'Enviando…' : 'Enviar convite'}
          </Button>
        </form>

        {concedidos.length > 0 && (
          <ul className="mt-5 divide-y border-t">
            {concedidos.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="break-all">{c.emailConvidado}</span>
                  <span
                    className={cn(
                      'rounded-full px-3 py-0.5 text-sm font-bold',
                      c.status === 'ACEITO'
                        ? 'bg-status-verde-soft text-status-verde'
                        : 'bg-status-laranja-soft text-status-laranja',
                    )}
                  >
                    {c.status === 'ACEITO' ? 'Com acesso' : 'Convite enviado'}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  className="self-start text-destructive hover:bg-destructive-soft sm:self-auto"
                  onClick={() =>
                    setConfirmacao({
                      tipo: 'acesso',
                      id: c.id,
                      titulo: c.status === 'ACEITO' ? 'Tirar o acesso?' : 'Cancelar convite?',
                      texto: `${c.emailConvidado} deixa de ver quem você cuida.`,
                      botao: c.status === 'ACEITO' ? 'Tirar acesso' : 'Cancelar convite',
                    })
                  }
                >
                  {c.status === 'ACEITO' ? 'Tirar acesso' : 'Cancelar convite'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        aberto={confirmacao !== null}
        titulo={confirmacao?.tipo === 'familiar' ? `Remover ${confirmacao.nome}?` : (confirmacao?.titulo ?? '')}
        mensagem={
          confirmacao?.tipo === 'familiar'
            ? 'O cadastro sai da sua família. Quem já tem pedidos no histórico não pode ser removido.'
            : (confirmacao?.texto ?? '')
        }
        textoConfirmar={confirmacao?.tipo === 'familiar' ? 'Remover' : (confirmacao?.botao ?? 'Confirmar')}
        processando={isConfirmando}
        onConfirmar={handleConfirmar}
        onCancelar={() => setConfirmacao(null)}
      />
    </div>
  );
}
