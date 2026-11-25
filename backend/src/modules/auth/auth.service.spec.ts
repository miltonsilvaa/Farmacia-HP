import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const usuariosService = { buscarPorEmail: jest.fn() };
  const jwtService = { sign: jest.fn().mockReturnValue('token') };
  const service = new AuthService(usuariosService as any, jwtService as any);

  beforeEach(() => jest.clearAllMocks());

  it('login certo devolve token e papel', async () => {
    usuariosService.buscarPorEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@x.com',
      role: 'CLIENTE',
      senha: await bcrypt.hash('segredo123', 4),
    });
    await expect(service.login('a@x.com', 'segredo123')).resolves.toEqual({
      access_token: 'token',
      role: 'CLIENTE',
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'u1',
      email: 'a@x.com',
      role: 'CLIENTE',
    });
  });

  it('e-mail inexistente e senha errada têm a mesma resposta', async () => {
    usuariosService.buscarPorEmail.mockResolvedValue(null);
    const semConta = service.login('nao@x.com', 'qualquer');
    await expect(semConta).rejects.toThrow(UnauthorizedException);
    await expect(semConta).rejects.toThrow('E-mail ou senha inválidos.');

    usuariosService.buscarPorEmail.mockResolvedValue({
      senha: await bcrypt.hash('certa', 4),
    });
    await expect(service.login('a@x.com', 'errada')).rejects.toThrow(
      'E-mail ou senha inválidos.',
    );
  });

  it('sem e-mail ou senha vira 400, não 500', async () => {
    await expect(service.login('a@x.com', undefined as any)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.login('', 'x')).rejects.toThrow(BadRequestException);
  });
});
