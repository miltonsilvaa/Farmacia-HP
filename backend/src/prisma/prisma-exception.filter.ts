import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';

// Códigos do Prisma que são culpa da requisição, não do servidor
const TRADUCAO: Record<string, () => HttpException> = {
  P2002: () => new ConflictException('Já existe um registro com esses dados.'),
  P2003: () => new BadRequestException('O registro referenciado não existe.'),
  P2025: () => new NotFoundException('Registro não encontrado.'),
};

// Converte erros do Prisma nas exceções nativas do Nest, para a interface
// receber 400/404/409 em vez de um 500 genérico. O resto segue o padrão do Nest.
@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(
    erro:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientValidationError,
    host: ArgumentsHost,
  ) {
    if (erro instanceof Prisma.PrismaClientValidationError) {
      return super.catch(new BadRequestException('Dados inválidos.'), host);
    }
    const traduzir = TRADUCAO[erro.code];
    return super.catch(traduzir ? traduzir() : erro, host);
  }
}
