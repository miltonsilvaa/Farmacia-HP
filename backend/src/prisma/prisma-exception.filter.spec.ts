import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('PrismaExceptionFilter', () => {
  const filtro = new PrismaExceptionFilter();
  const repassado = jest
    .spyOn(BaseExceptionFilter.prototype, 'catch')
    .mockImplementation(() => undefined);

  const erroPrisma = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('erro', {
      code,
      clientVersion: 'x',
    });

  beforeEach(() => repassado.mockClear());

  it.each([
    ['P2002', ConflictException],
    ['P2003', BadRequestException],
    ['P2025', NotFoundException],
  ])('%s vira %p', (code, Excecao) => {
    filtro.catch(erroPrisma(code), {} as any);
    expect(repassado.mock.calls[0][0]).toBeInstanceOf(Excecao);
  });

  it('erro de validação do Prisma vira 400', () => {
    filtro.catch(
      new Prisma.PrismaClientValidationError('campo errado', {
        clientVersion: 'x',
      }),
      {} as any,
    );
    expect(repassado.mock.calls[0][0]).toBeInstanceOf(BadRequestException);
  });

  it('código desconhecido segue como erro interno (500)', () => {
    const erro = erroPrisma('P1001');
    filtro.catch(erro, {} as any);
    expect(repassado.mock.calls[0][0]).toBe(erro);
  });
});
