import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async criarUsuario(email: string, senha: string) {
    const senhaHasheada = await bcrypt.hash(senha, 10);
    try {
      const usuario = await this.prisma.usuario.create({
        data: { email, senha: senhaHasheada },
      });
      return {
        mensagem: 'Usuário cadastrado com sucesso!',
        email: usuario.email,
      };
    } catch {
      throw new ConflictException('Esse e-mail já está cadastrado.');
    }
  }

  async buscarPorEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email } });
  }
}
