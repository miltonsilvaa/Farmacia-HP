import { Controller, Post, Body } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // Erros do service já saem com o código HTTP certo (400 dados inválidos, 409 e-mail repetido)
  @Post()
  async criarUsuario(@Body() body: { email: string; senha: string }) {
    return this.usuariosService.criarUsuario(body?.email, body?.senha);
  }
}
