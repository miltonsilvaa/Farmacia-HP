import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  const prisma = {
    usuario: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };
  const service = new UsuariosService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.usuario.findFirst.mockResolvedValue(null);
    prisma.usuario.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'u1', ...data }),
    );
  });

  it('guarda a senha com hash e o e-mail em minúsculas', async () => {
    const r = await service.criarUsuario(' Ana@X.com ', 'segredo123');

    const data = prisma.usuario.create.mock.calls[0][0].data;
    expect(data.email).toBe('ana@x.com');
    expect(data.senha).not.toBe('segredo123');
    await expect(bcrypt.compare('segredo123', data.senha)).resolves.toBe(true);
    expect(r).not.toHaveProperty('senha');
  });

  it.each([
    ['sem-arroba', 'segredo123', 'e-mail'],
    [undefined, 'segredo123', 'e-mail'],
    ['a@x.com', '123', '6 caracteres'],
    ['a@x.com', undefined, '6 caracteres'],
  ])('dados inválidos viram 400 (%s / %s)', async (email, senha, trecho) => {
    await expect(
      service.criarUsuario(email as any, senha as any),
    ).rejects.toThrow(trecho);
    await expect(
      service.criarUsuario(email as any, senha as any),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.usuario.create).not.toHaveBeenCalled();
  });

  it('e-mail já cadastrado (mesmo com outra caixa) vira 409', async () => {
    prisma.usuario.findFirst.mockResolvedValue({
      id: 'antigo',
      email: 'Ana@x.com',
    });
    await expect(
      service.criarUsuario('ana@x.com', 'segredo123'),
    ).rejects.toThrow(ConflictException);
  });

  it('corrida no cadastro (P2002 do banco) também vira 409', async () => {
    prisma.usuario.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 'x',
      }),
    );
    await expect(service.criarUsuario('a@x.com', 'segredo123')).rejects.toThrow(
      ConflictException,
    );
  });

  it('outros erros do banco não viram "e-mail já cadastrado"', async () => {
    prisma.usuario.create.mockRejectedValue(new Error('Banco fora do ar'));
    await expect(service.criarUsuario('a@x.com', 'segredo123')).rejects.toThrow(
      'Banco fora do ar',
    );
  });

  it('busca por e-mail ignora maiúsculas (contas antigas continuam entrando)', async () => {
    await service.buscarPorEmail(' Ana@X.com ');
    expect(prisma.usuario.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'Ana@X.com', mode: 'insensitive' } },
    });
  });
});
