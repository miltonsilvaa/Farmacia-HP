import { UnauthorizedException } from '@nestjs/common';
import { ErpTokenGuard } from './erp-token.guard';

// Monta o contexto HTTP mínimo que o guard lê
const contexto = (authorization?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization } }),
    }),
  }) as any;

describe('ErpTokenGuard (entrada de dados do ERP)', () => {
  const guard = new ErpTokenGuard();
  const envOriginal = process.env;

  beforeEach(() => {
    process.env = { ...envOriginal, ERP_TOKEN: 'segredo-do-erp' };
  });
  afterAll(() => {
    process.env = envOriginal;
  });

  it('aceita o token certo no formato Bearer (sem diferenciar a caixa do prefixo)', () => {
    expect(guard.canActivate(contexto('Bearer segredo-do-erp'))).toBe(true);
    expect(guard.canActivate(contexto('bearer segredo-do-erp'))).toBe(true);
  });

  it.each([
    ['sem cabeçalho', undefined],
    ['token errado do mesmo tamanho', 'Bearer segredo-do-xxx'],
    ['token de outro tamanho', 'Bearer abc'],
    ['só o prefixo', 'Bearer '],
  ])('recusa %s', (_caso, header) => {
    expect(() => guard.canActivate(contexto(header))).toThrow(
      UnauthorizedException,
    );
  });

  it('sem ERP_TOKEN configurado, a entrada do ERP fica fechada', () => {
    delete process.env.ERP_TOKEN;
    expect(() => guard.canActivate(contexto('Bearer qualquer'))).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.canActivate(contexto('Bearer '))).toThrow(
      UnauthorizedException,
    );
  });
});
