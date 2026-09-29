import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { JwtAuthGuard } from '../modules/auth/core/guards/jwt-auth.guard';
import { RolesGuard } from '../modules/auth/core/guards/roles.guard';
import { Roles } from '../modules/auth/core/guards/roles.decorator';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  // Rota pública — lista apenas ativos (para uso futuro no catálogo do cliente)
  @Get()
  listarAtivos() {
    return this.produtosService.listarAtivos();
  }

  // Rota pública — complementares dos produtos do pedido (?ids=a,b)
  @Get('sugestoes')
  sugestoes(@Query('ids') ids = '') {
    return this.produtosService.sugestoes(ids.split(',').filter(Boolean));
  }

  // ── Rotas de Admin ─────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  criar(@Body() body: any) {
    return this.produtosService.criar(body);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  listarAdmin() {
    return this.produtosService.listarAdmin();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  buscarUm(@Param('id') id: string) {
    return this.produtosService.buscarUm(id);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  atualizar(@Param('id') id: string, @Body() body: any) {
    return this.produtosService.atualizar(id, body);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  inativar(@Param('id') id: string) {
    return this.produtosService.inativar(id);
  }
}
