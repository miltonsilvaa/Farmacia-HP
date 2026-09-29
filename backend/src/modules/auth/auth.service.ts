import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../../usuarios/usuarios.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, senha: string) {
    if (
      typeof email !== 'string' ||
      typeof senha !== 'string' ||
      !email ||
      !senha
    ) {
      throw new BadRequestException('Informe e-mail e senha.');
    }

    // Mesma mensagem para e-mail inexistente e senha errada: não revela quem tem conta
    const usuario = await this.usuariosService.buscarPorEmail(email);
    const senhaValida = usuario && (await bcrypt.compare(senha, usuario.senha));
    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      role: usuario.role,
    };
  }
}
