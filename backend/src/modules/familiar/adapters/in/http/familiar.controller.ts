import { Controller, Post, Get, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../auth/core/guards/jwt-auth.guard';
import { FamiliarService } from '../../../familiar.service';

type DadosFamiliar = {
  nome: string;
  parentesco?: string;
  tipo?: string;
  especie?: string;
  dataNascimento?: string;
};

@Controller('familiares')
@UseGuards(JwtAuthGuard)
export class FamiliarController {
  constructor(private readonly familiarService: FamiliarService) {}

  @Post()
  async adicionar(@Body() body: DadosFamiliar, @Request() req: any) {
    return this.familiarService.adicionar(req.user.id, body);
  }

  @Get()
  async listar(@Request() req: any) {
    return this.familiarService.listarPorUsuario(req.user.id);
  }

  @Patch(':id')
  async atualizar(
    @Param('id') id: string,
    @Body() body: Partial<DadosFamiliar>,
    @Request() req: any,
  ) {
    return this.familiarService.atualizar(id, req.user.id, body);
  }

  @Delete(':id')
  async remover(@Param('id') id: string, @Request() req: any) {
    return this.familiarService.remover(id, req.user.id);
  }
}

// Convites para compartilhar o Grupo Família com outro usuário
@Controller('familia/acessos')
@UseGuards(JwtAuthGuard)
export class FamiliaAcessoController {
  constructor(private readonly familiarService: FamiliarService) {}

  @Get()
  async listar(@Request() req: any) {
    return this.familiarService.listarAcessos(req.user.id, req.user.email);
  }

  @Post()
  async convidar(@Body() body: { email: string }, @Request() req: any) {
    return this.familiarService.convidar(req.user.id, req.user.email, body.email);
  }

  @Post(':id/aceitar')
  async aceitar(@Param('id') id: string, @Request() req: any) {
    return this.familiarService.aceitar(id, req.user.id, req.user.email);
  }

  @Delete(':id')
  async remover(@Param('id') id: string, @Request() req: any) {
    return this.familiarService.removerAcesso(id, req.user.id, req.user.email);
  }
}
