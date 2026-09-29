import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';

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

const formVazio: FormState = {
  tipo: 'PESSOA',
  nome: '',
  parentesco: '',
  especie: '',
  dataNascimento: '',
};

type Confirmacao =
  | { tipo: 'familiar'; id: string; nome: string }
  | { tipo: 'acesso'; id: string; texto: string };

const inputClass =
  'w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100';

function descricaoFamiliar(f: Familiar) {
  if (f.tipo === 'PET') return f.especie ? `Pet · ${f.especie}` : 'Pet';
  return f.parentesco;
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
            toast.error('Não foi possível carregar os familiares.');
          }
          if (resAcessos.ok) {
            const acessos = await resAcessos.json();
            setConcedidos(acessos.concedidos);
            setRecebidos(acessos.recebidos);
          }
        })
        .catch(() => toast.error('Erro de conexão ao carregar o Grupo Família.'))
        .finally(() => setIsCarregando(false)),
    [],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const proprios = familiares.filter((f) => f.proprio);
  const compartilhados = familiares.filter((f) => !f.proprio);

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
        editandoId
          ? 'Dados atualizados!'
          : form.tipo === 'PET'
            ? 'Pet adicionado com sucesso!'
            : 'Dependente adicionado com sucesso!',
      );
      fecharForm();
    } catch {
      toast.error('Erro ao salvar. Verifique os dados e tente novamente.');
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
        toast.error(erro.message ?? 'Não foi possível enviar o convite.');
        return;
      }
      setEmailConvite('');
      await carregar();
      toast.success('Convite enviado! A pessoa verá o convite ao entrar na conta dela.');
    } catch {
      toast.error('Erro de conexão ao enviar convite.');
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
      toast.error('Não foi possível aceitar o convite.');
    } finally {
      setProcessandoAcesso(null);
    }
  };

  const handleConfirmar = async () => {
    if (!confirmacao) return;
    setIsConfirmando(true);
    try {
      const url =
        confirmacao.tipo === 'familiar'
          ? `/familiares/${confirmacao.id}`
          : `/familia/acessos/${confirmacao.id}`;
      const response = await apiFetch(url, { method: 'DELETE' });
      if (!response.ok) {
        const erro = await response.json().catch(() => ({}));
        toast.error(erro.message ?? 'Não foi possível concluir a ação.');
        return;
      }
      await carregar();
      toast.success(confirmacao.tipo === 'familiar' ? 'Removido do Grupo Família.' : 'Acesso removido.');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setIsConfirmando(false);
      setConfirmacao(null);
    }
  };

  const formatarData = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const convitesPendentes = recebidos.filter((r) => r.status === 'PENDENTE');
  const gruposQueParticipo = recebidos.filter((r) => r.status === 'ACEITO');

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Grupo Família</h1>
          <p className="text-gray-600 mt-2">
            Cadastre parentes e pets para pedir orçamentos e renovar receitas para eles.
          </p>
        </div>
        {!formAberto && (
          <button
            onClick={abrirNovo}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span aria-hidden="true">➕</span> Novo Dependente
          </button>
        )}
      </div>

      {/* Convites recebidos */}
      {convitesPendentes.length > 0 && (
        <section aria-labelledby="titulo-convites" className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 id="titulo-convites" className="font-bold text-gray-800 mb-3">
            Convites para participar de um Grupo Família
          </h2>
          <div className="flex flex-col gap-3">
            {convitesPendentes.map((c) => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{c.titularEmail}</span> quer compartilhar os
                  dependentes com você.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAceitar(c.id)}
                    disabled={processandoAcesso === c.id}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processandoAcesso === c.id ? 'Aceitando...' : 'Aceitar'}
                  </button>
                  <button
                    onClick={() => setConfirmacao({ tipo: 'acesso', id: c.id, texto: `Recusar o convite de ${c.titularEmail}?` })}
                    disabled={processandoAcesso === c.id}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Formulário de cadastro/edição */}
      {formAberto && (
        <section aria-labelledby="titulo-form" className="bg-blue-50 border border-blue-100 rounded-xl p-6">
          <h2 id="titulo-form" className="text-xl font-bold text-gray-800 mb-4">
            {editandoId ? 'Editar Dependente' : 'Adicionar Dependente'}
          </h2>
          <form onSubmit={handleSalvar} className="flex flex-col gap-4">
            <fieldset>
              <legend className="block text-sm font-semibold text-gray-700 mb-2">Tipo</legend>
              <div className="flex gap-2">
                {(['PESSOA', 'PET'] as const).map((tipo) => (
                  <label
                    key={tipo}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer transition-colors ${
                      form.tipo === tipo
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={tipo}
                      checked={form.tipo === tipo}
                      onChange={() => setForm((f) => ({ ...f, tipo }))}
                      className="sr-only"
                    />
                    <span aria-hidden="true">{tipo === 'PESSOA' ? '👤' : '🐾'}</span>{' '}
                    {tipo === 'PESSOA' ? 'Parente' : 'Pet'}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="familiar-nome" className="block text-sm font-semibold text-gray-700 mb-1">
                  {form.tipo === 'PET' ? 'Nome do Pet' : 'Nome Completo'}
                </label>
                <input
                  id="familiar-nome"
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  disabled={isSalvando}
                  className={inputClass}
                  placeholder={form.tipo === 'PET' ? 'Ex: Thor' : 'Ex: Ana Souza'}
                />
              </div>

              {form.tipo === 'PESSOA' ? (
                <div className="w-full md:w-48">
                  <label htmlFor="familiar-parentesco" className="block text-sm font-semibold text-gray-700 mb-1">
                    Parentesco
                  </label>
                  <select
                    id="familiar-parentesco"
                    required
                    value={form.parentesco}
                    onChange={(e) => setForm((f) => ({ ...f, parentesco: e.target.value }))}
                    disabled={isSalvando}
                    className={inputClass}
                  >
                    <option value="">Selecione...</option>
                    <option value="Filho(a)">Filho(a)</option>
                    <option value="Pai/Mãe">Pai/Mãe</option>
                    <option value="Cônjuge">Cônjuge</option>
                    <option value="Irmão(ã)">Irmão(ã)</option>
                    <option value="Avô/Avó">Avô/Avó</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              ) : (
                <div className="w-full md:w-48">
                  <label htmlFor="familiar-especie" className="block text-sm font-semibold text-gray-700 mb-1">
                    Espécie
                  </label>
                  <select
                    id="familiar-especie"
                    required
                    value={form.especie}
                    onChange={(e) => setForm((f) => ({ ...f, especie: e.target.value }))}
                    disabled={isSalvando}
                    className={inputClass}
                  >
                    <option value="">Selecione...</option>
                    <option value="Cão">Cão</option>
                    <option value="Gato">Gato</option>
                    <option value="Ave">Ave</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              )}

              <div className="w-full md:w-48">
                <label htmlFor="familiar-nascimento" className="block text-sm font-semibold text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  id="familiar-nascimento"
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => setForm((f) => ({ ...f, dataNascimento: e.target.value }))}
                  disabled={isSalvando}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={fecharForm}
                disabled={isSalvando}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSalvando}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isSalvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Meus dependentes */}
      <section aria-labelledby="titulo-dependentes">
        <h2 id="titulo-dependentes" className="text-lg font-bold text-gray-800 mb-3">
          Meus dependentes
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {isCarregando ? (
            <div className="p-8 text-center text-gray-500" role="status">Carregando...</div>
          ) : proprios.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Você ainda não tem dependentes cadastrados.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {proprios.map((familiar) => (
                <li
                  key={familiar.id}
                  className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-full text-xl ${
                        familiar.tipo === 'PET' ? 'bg-amber-100' : 'bg-blue-100'
                      }`}
                      aria-hidden="true"
                    >
                      {familiar.tipo === 'PET' ? '🐾' : '👤'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">{familiar.nome}</p>
                      <p className="text-sm text-gray-500">
                        {descricaoFamiliar(familiar)}
                        {familiar.dataNascimento && (
                          <span className="ml-2 text-gray-400">
                            · Nascimento: {formatarData(familiar.dataNascimento)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => abrirEdicao(familiar)}
                      aria-label={`Editar ${familiar.nome}`}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmacao({ tipo: 'familiar', id: familiar.id, nome: familiar.nome })}
                      aria-label={`Remover ${familiar.nome}`}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Dependentes compartilhados comigo */}
      {compartilhados.length > 0 && (
        <section aria-labelledby="titulo-compartilhados">
          <h2 id="titulo-compartilhados" className="text-lg font-bold text-gray-800 mb-1">
            Compartilhados com você
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Você pode pedir orçamentos e acompanhar os pedidos destes dependentes. Só o titular pode
            editá-los.
          </p>
          <ul className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {compartilhados.map((familiar) => (
              <li key={familiar.id} className="p-5 flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-full text-xl" aria-hidden="true">
                  {familiar.tipo === 'PET' ? '🐾' : '👤'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{familiar.nome}</p>
                  <p className="text-sm text-gray-500">
                    {descricaoFamiliar(familiar)} · titular: {familiar.titularEmail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            {gruposQueParticipo.map((g) => (
              <button
                key={g.id}
                onClick={() => setConfirmacao({ tipo: 'acesso', id: g.id, texto: `Sair do Grupo Família de ${g.titularEmail}? Você deixará de ver os dependentes e os pedidos desse grupo.` })}
                className="text-xs text-red-600 hover:underline"
              >
                Sair do grupo de {g.titularEmail}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Compartilhar meu grupo */}
      <section aria-labelledby="titulo-compartilhar" className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 id="titulo-compartilhar" className="text-lg font-bold text-gray-800">
          Compartilhar com a família
        </h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Convide outro membro da família (ex.: cônjuge) pelo e-mail cadastrado no app. Quem aceitar poderá
          pedir orçamentos e acompanhar os pedidos dos seus dependentes. Seus pedidos pessoais
          continuam visíveis só para você.
        </p>
        <form onSubmit={handleConvidar} className="flex flex-col sm:flex-row gap-3">
          <label htmlFor="email-convite" className="sr-only">
            E-mail do membro da família
          </label>
          <input
            id="email-convite"
            type="email"
            required
            value={emailConvite}
            onChange={(e) => setEmailConvite(e.target.value)}
            disabled={isConvidando}
            placeholder="email@exemplo.com"
            className={`${inputClass} sm:flex-1`}
          />
          <button
            type="submit"
            disabled={isConvidando}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {isConvidando ? 'Enviando...' : 'Enviar convite'}
          </button>
        </form>

        {concedidos.length > 0 && (
          <ul className="mt-5 divide-y divide-gray-100 border-t border-gray-100">
            {concedidos.map((c) => (
              <li key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-800">{c.emailConvidado}</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      c.status === 'ACEITO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {c.status === 'ACEITO' ? 'Com acesso' : 'Convite pendente'}
                  </span>
                </div>
                <button
                  onClick={() => setConfirmacao({ tipo: 'acesso', id: c.id, texto: `Remover o acesso de ${c.emailConvidado} ao seu Grupo Família?` })}
                  className="self-start sm:self-auto px-3 py-1 text-sm text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors"
                >
                  {c.status === 'ACEITO' ? 'Revogar acesso' : 'Cancelar convite'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        aberto={confirmacao !== null}
        titulo={confirmacao?.tipo === 'familiar' ? 'Remover dependente' : 'Confirmar'}
        mensagem={
          confirmacao?.tipo === 'familiar'
            ? `Deseja realmente remover ${confirmacao.nome} do Grupo Família?`
            : (confirmacao?.texto ?? '')
        }
        textoConfirmar={confirmacao?.tipo === 'familiar' ? 'Remover' : 'Confirmar'}
        processando={isConfirmando}
        onConfirmar={handleConfirmar}
        onCancelar={() => setConfirmacao(null)}
      />
    </div>
  );
}
