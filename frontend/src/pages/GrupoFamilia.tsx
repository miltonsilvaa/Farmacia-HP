import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiFetch } from '../lib/api';

interface Familiar {
  id: string;
  nome: string;
  parentesco: string;
  dataNascimento: string | null;
}

export default function GrupoFamilia() {
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [isCarregando, setIsCarregando] = useState(true);
  const [isAdicionando, setIsAdicionando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoParentesco, setNovoParentesco] = useState('');
  const [novaDataNascimento, setNovaDataNascimento] = useState('');
  const [isSalvando, setIsSalvando] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const response = await apiFetch('/familiares');
        if (response.ok) {
          setFamiliares(await response.json());
        } else {
          toast.error('Não foi possível carregar os familiares.');
        }
      } catch {
        toast.error('Erro de conexão ao carregar familiares.');
      } finally {
        setIsCarregando(false);
      }
    };
    carregar();
  }, []);

  const handleSalvarFamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSalvando(true);
    try {
      const response = await apiFetch('/familiares', {
        method: 'POST',
        body: JSON.stringify({
          nome: novoNome,
          parentesco: novoParentesco,
          dataNascimento: novaDataNascimento || undefined,
        }),
      });

      if (!response.ok) throw new Error('Falha ao comunicar com o servidor');

      const data = await response.json();
      const novoFamiliar: Familiar = {
        id: data.id,
        nome: novoNome,
        parentesco: novoParentesco,
        dataNascimento: novaDataNascimento || null,
      };

      setFamiliares((prev) => [...prev, novoFamiliar]);
      setIsAdicionando(false);
      setNovoNome('');
      setNovoParentesco('');
      setNovaDataNascimento('');
      toast.success('Dependente adicionado com sucesso!');
    } catch {
      toast.error('Erro ao salvar o familiar. Verifique se o servidor está rodando.');
    } finally {
      setIsSalvando(false);
    }
  };

  const handleRemover = async (familiarId: string) => {
    if (!confirm('Deseja realmente remover este familiar?')) return;
    try {
      const response = await apiFetch(`/familiares/${familiarId}`, { method: 'DELETE' });
      if (response.ok) {
        setFamiliares((prev) => prev.filter((f) => f.id !== familiarId));
        toast.success('Familiar removido.');
      } else {
        toast.error('Não foi possível remover o familiar.');
      }
    } catch {
      toast.error('Erro de conexão ao remover familiar.');
    }
  };

  const formatarData = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Grupo Família</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os dependentes para pedir orçamentos e renovar receitas para eles.
          </p>
        </div>
        {!isAdicionando && (
          <button
            onClick={() => setIsAdicionando(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>➕</span> Novo Familiar
          </button>
        )}
      </div>

      {isAdicionando && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Adicionar Dependente</h2>
          <form onSubmit={handleSalvarFamiliar} className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="grupofamilia-campo-1" className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                <input id="grupofamilia-campo-1"
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: Ana Souza"
                />
              </div>
              <div className="w-full md:w-48">
                <label htmlFor="grupofamilia-campo-2" className="block text-sm font-semibold text-gray-700 mb-1">Parentesco</label>
                <select id="grupofamilia-campo-2"
                  required
                  value={novoParentesco}
                  onChange={(e) => setNovoParentesco(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Pai/Mãe">Pai/Mãe</option>
                  <option value="Cônjuge">Cônjuge</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="w-full md:w-48">
                <label htmlFor="grupofamilia-campo-3" className="block text-sm font-semibold text-gray-700 mb-1">Data de Nascimento</label>
                <input id="grupofamilia-campo-3"
                  type="date"
                  value={novaDataNascimento}
                  onChange={(e) => setNovaDataNascimento(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdicionando(false)}
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
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isCarregando ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : familiares.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Você ainda não tem dependentes cadastrados.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {familiares.map((familiar) => (
              <div
                key={familiar.id}
                className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-full text-xl">👤</div>
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">{familiar.nome}</p>
                    <p className="text-sm text-gray-500">
                      {familiar.parentesco}
                      {familiar.dataNascimento && (
                        <span className="ml-2 text-gray-400">· Nascimento: {formatarData(familiar.dataNascimento)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleRemover(familiar.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
