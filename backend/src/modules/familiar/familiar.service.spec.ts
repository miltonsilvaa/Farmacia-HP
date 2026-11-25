import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FamiliarService } from './familiar.service';

function criarPrisma() {
  return {
    familiar: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(({ data }) => Promise.resolve({ id: 'f-novo', ...data })),
      update: jest.fn(({ data }) => Promise.resolve(data)),
      delete: jest.fn(),
    },
    familiaAcesso: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn(({ data }) => Promise.resolve({ id: 'a1', ...data })),
      update: jest.fn(({ data }) => Promise.resolve(data)),
      delete: jest.fn(),
    },
    orcamento: { count: jest.fn().mockResolvedValue(0) },
  };
}

describe('FamiliarService', () => {
  let prisma: ReturnType<typeof criarPrisma>;
  let service: FamiliarService;

  beforeEach(() => {
    prisma = criarPrisma();
    service = new FamiliarService(prisma as any);
  });

  describe('cadastro de dependentes', () => {
    it('pet recebe parentesco "Pet" e guarda a espécie', async () => {
      await service.adicionar('u1', {
        nome: ' Thor ',
        tipo: 'PET',
        especie: 'Cão',
        parentesco: 'Filho(a)',
      });
      expect(prisma.familiar.create.mock.calls[0][0].data).toMatchObject({
        usuarioId: 'u1',
        nome: 'Thor',
        tipo: 'PET',
        parentesco: 'Pet',
        especie: 'Cão',
      });
    });

    it('pessoa não guarda espécie', async () => {
      await service.adicionar('u1', {
        nome: 'Ana',
        parentesco: 'Filho(a)',
        especie: 'Cão',
      });
      expect(prisma.familiar.create.mock.calls[0][0].data).toMatchObject({
        tipo: 'PESSOA',
        especie: null,
      });
    });

    it('exige nome', async () => {
      await expect(service.adicionar('u1', { nome: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('não remove dependente com pedidos no histórico', async () => {
      prisma.familiar.findFirst.mockResolvedValue({
        id: 'f1',
        usuarioId: 'u1',
      });
      prisma.orcamento.count.mockResolvedValue(2);
      await expect(service.remover('f1', 'u1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.familiar.delete).not.toHaveBeenCalled();
    });

    it('não edita dependente de outra conta', async () => {
      prisma.familiar.findFirst.mockResolvedValue(null);
      await expect(
        service.atualizar('f1', 'intruso', { nome: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listagem do Grupo Família', () => {
    it('junta os próprios e os compartilhados, marcando a origem de cada um', async () => {
      prisma.familiaAcesso.findMany.mockResolvedValue([
        { titularId: 'titular-A' },
      ]);
      prisma.familiar.findMany.mockResolvedValue([
        {
          id: 'f1',
          usuarioId: 'u1',
          nome: 'Thor',
          usuario: { email: 'eu@x.com' },
        },
        {
          id: 'f2',
          usuarioId: 'titular-A',
          nome: 'Vó Lia',
          usuario: { email: 'a@x.com' },
        },
      ]);

      const lista = await service.listarPorUsuario('u1');

      expect(prisma.familiar.findMany.mock.calls[0][0].where).toEqual({
        usuarioId: { in: ['u1', 'titular-A'] },
      });
      expect(lista).toEqual([
        expect.objectContaining({
          id: 'f1',
          proprio: true,
          titularEmail: null,
        }),
        expect.objectContaining({
          id: 'f2',
          proprio: false,
          titularEmail: 'a@x.com',
        }),
      ]);
      // O objeto do usuário (com dados da conta) não vaza para a resposta
      expect(lista[0]).not.toHaveProperty('usuario');
    });

    it('sem convites aceitos, só vê os próprios', async () => {
      prisma.familiar.findMany.mockResolvedValue([]);
      await service.listarPorUsuario('u1');
      expect(prisma.familiar.findMany.mock.calls[0][0].where).toEqual({
        usuarioId: { in: ['u1'] },
      });
    });

    it('editar um pet para pessoa limpa a espécie', async () => {
      prisma.familiar.findFirst.mockResolvedValue({
        id: 'f1',
        usuarioId: 'u1',
      });
      await service.atualizar('f1', 'u1', {
        tipo: 'PESSOA',
        parentesco: 'Filho(a)',
        especie: 'Cão',
      });
      expect(prisma.familiar.update.mock.calls[0][0].data).toMatchObject({
        tipo: 'PESSOA',
        parentesco: 'Filho(a)',
        especie: null,
      });
    });

    it('membro com acesso compartilhado não edita nem remove dependente do titular', async () => {
      // A edição só procura entre os dependentes do próprio usuário
      prisma.familiar.findFirst.mockResolvedValue(null);
      await expect(
        service.atualizar('f2', 'membro', { nome: 'X' }),
      ).rejects.toThrow(NotFoundException);
      await expect(service.remover('f2', 'membro')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.familiar.findFirst).toHaveBeenCalledWith({
        where: { id: 'f2', usuarioId: 'membro' },
      });
    });
  });

  describe('podeAcessarFamiliar', () => {
    beforeEach(() => {
      prisma.familiar.findUnique.mockResolvedValue({
        id: 'f1',
        usuarioId: 'titular',
      });
    });

    it('titular acessa', async () => {
      await expect(service.podeAcessarFamiliar('titular', 'f1')).resolves.toBe(
        true,
      );
    });

    it('membro com convite aceito acessa', async () => {
      prisma.familiaAcesso.findMany.mockResolvedValue([
        { titularId: 'titular' },
      ]);
      await expect(service.podeAcessarFamiliar('membro', 'f1')).resolves.toBe(
        true,
      );
      expect(prisma.familiaAcesso.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { membroId: 'membro', status: 'ACEITO' },
        }),
      );
    });

    it('convite ainda pendente não dá acesso', async () => {
      // A consulta só considera convites ACEITO; um pendente não aparece nela
      prisma.familiaAcesso.findMany.mockResolvedValue([]);
      await expect(
        service.podeAcessarFamiliar('convidado', 'f1'),
      ).resolves.toBe(false);
    });

    it('acesso a outro titular não vale para este dependente', async () => {
      prisma.familiaAcesso.findMany.mockResolvedValue([
        { titularId: 'outro-titular' },
      ]);
      await expect(service.podeAcessarFamiliar('membro', 'f1')).resolves.toBe(
        false,
      );
    });

    it('estranho não acessa', async () => {
      await expect(service.podeAcessarFamiliar('estranho', 'f1')).resolves.toBe(
        false,
      );
    });

    it('dependente inexistente não é acessível', async () => {
      prisma.familiar.findUnique.mockResolvedValue(null);
      await expect(
        service.podeAcessarFamiliar('titular', 'nao-existe'),
      ).resolves.toBe(false);
    });
  });

  describe('convites', () => {
    it('normaliza o e-mail convidado', async () => {
      prisma.familiaAcesso.findUnique.mockResolvedValue(null);
      await service.convidar('u1', 'titular@x.com', '  Conjuge@X.com ');
      expect(
        prisma.familiaAcesso.create.mock.calls[0][0].data.emailConvidado,
      ).toBe('conjuge@x.com');
    });

    it('não deixa convidar a si mesmo', async () => {
      await expect(
        service.convidar('u1', 'Eu@x.com', 'eu@X.com'),
      ).rejects.toThrow('a si mesmo');
    });

    it('não duplica convite', async () => {
      prisma.familiaAcesso.findUnique.mockResolvedValue({ id: 'a1' });
      await expect(
        service.convidar('u1', 'titular@x.com', 'c@x.com'),
      ).rejects.toThrow('já foi convidado');
    });

    it('só o e-mail convidado aceita', async () => {
      prisma.familiaAcesso.findUnique.mockResolvedValue({
        id: 'a1',
        emailConvidado: 'c@x.com',
      });
      await expect(
        service.aceitar('a1', 'outro', 'outro@x.com'),
      ).rejects.toThrow(NotFoundException);

      await service.aceitar('a1', 'membro', 'C@x.com');
      expect(prisma.familiaAcesso.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: { status: 'ACEITO', membroId: 'membro' },
      });
    });

    it('titular e convidado podem remover o acesso; terceiros não', async () => {
      prisma.familiaAcesso.findUnique.mockResolvedValue({
        id: 'a1',
        titularId: 't',
        emailConvidado: 'c@x.com',
      });

      await expect(
        service.removerAcesso('a1', 'terceiro', 'z@x.com'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.removerAcesso('a1', 't', 't@x.com'),
      ).resolves.toEqual({ sucesso: true });
      await expect(
        service.removerAcesso('a1', 'membro', 'c@x.com'),
      ).resolves.toEqual({ sucesso: true });
    });
  });
});
