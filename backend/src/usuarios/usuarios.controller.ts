import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  async criarUsuario(@Body() body: { email: string; senha: string }) {
    try {
      return await this.usuariosService.criarUsuario(body.email, body.senha);
    } catch (error: any) {
      throw new HttpException(
        error?.message || 'Erro ao cadastrar usuário.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
