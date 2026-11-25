import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async criarUsuario(email: string, senha: string) {
    const emailNormalizado = email?.trim().toLowerCase();
    if (!emailNormalizado?.includes('@')) {
      throw new BadRequestException('Informe um e-mail válido.');
    }
    if (typeof senha !== 'string' || senha.length < 6) {
      throw new BadRequestException(
        'A senha deve ter pelo menos 6 caracteres.',
      );
    }

    // Contas antigas podem ter maiúsculas no e-mail; a checagem ignora a caixa
    if (await this.buscarPorEmail(emailNormalizado)) {
      throw new ConflictException('Esse e-mail já está cadastrado.');
    }

    const senhaHasheada = await bcrypt.hash(senha, 10);
    try {
      const usuario = await this.prisma.usuario.create({
        data: { email: emailNormalizado, senha: senhaHasheada },
      });
      return {
        mensagem: 'Usuário cadastrado com sucesso!',
        email: usuario.email,
      };
    } catch (error) {
      // Só o e-mail repetido vira 409; qualquer outro erro (ex.: banco fora do ar) sobe como está
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Esse e-mail já está cadastrado.');
      }
      throw error;
    }
  }

  // Sem diferenciar maiúsculas: contas criadas antes da normalização continuam entrando
  async buscarPorEmail(email: string) {
    return this.prisma.usuario.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });
  }
}
