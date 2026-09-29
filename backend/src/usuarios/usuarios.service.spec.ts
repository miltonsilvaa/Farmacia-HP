import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  const prisma = {
    usuario: {
      create: jest.fn(({ data }) => Promise.resolve({ id: 'u1', ...data })),
      findUnique: jest.fn(),
    },
  };
  const service = new UsuariosService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  it('guarda a senha com hash, nunca em texto puro', async () => {
    const r = await service.criarUsuario('a@x.com', 'segredo123');

    const salva = prisma.usuario.create.mock.calls[0][0].data.senha;
    expect(salva).not.toBe('segredo123');
    await expect(bcrypt.compare('segredo123', salva)).resolves.toBe(true);
    expect(r).not.toHaveProperty('senha');
  });

  it('e-mail já cadastrado vira 409', async () => {
    prisma.usuario.create.mockRejectedValueOnce(
      new Error('Unique constraint failed'),
    );
    await expect(service.criarUsuario('a@x.com', 'segredo123')).rejects.toThrow(
      ConflictException,
    );
  });
});
