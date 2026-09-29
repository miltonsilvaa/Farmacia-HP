import 'multer';
import {
  Controller,
  Get,
  Post,
  Patch,
  UseInterceptors,
  UploadedFile,
  Body,
  Inject,
  Param,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../../auth/core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/core/guards/roles.guard';
import { Roles } from '../../../../auth/core/guards/roles.decorator';
import { OrcamentoService } from '../../../orcamento.service';
import {
  ENVIAR_RECEITA_USE_CASE,
  EnviarReceitaUseCasePort,
} from '../../../core/ports/in/enviar-receita.use-case.port';

@Controller('orcamentos')
export class OrcamentoController {
  constructor(
    @Inject(ENVIAR_RECEITA_USE_CASE)
    private readonly enviarReceitaUseCase: EnviarReceitaUseCasePort,

    private readonly orcamentoService: OrcamentoService,
  ) {}

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async listarTodos() {
    return this.orcamentoService.listarTodos();
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async avaliarOrcamento(
    @Param('id') id: string,
    @Body() body: { status: string; preco?: number; respostaAdmin?: string },
  ) {
    return this.orcamentoService.avaliarOrcamento(
      id,
      body.status,
      body.preco,
      body.respostaAdmin,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listarMeusPedidos(@Request() req: any) {
    return this.orcamentoService.listarPorUsuario(req.user.id);
  }

  @Post('receita')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('arquivo', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
        cb(ok ? null : new BadRequestException('Envie apenas imagem ou PDF.'), ok);
      },
    }),
  )
  async enviarReceita(
    @UploadedFile() arquivo: Express.Multer.File,
    @Body() body: { observacoes?: string; itens?: string; familiarId?: string },
    @Request() req: any,
  ) {
    if (!arquivo) {
      throw new BadRequestException('O arquivo da receita é obrigatório.');
    }

    let itens: Array<{ produtoId: string; quantidade: number }> | undefined;
    if (body.itens) {
      try {
        itens = JSON.parse(body.itens);
      } catch {
        throw new BadRequestException('Formato inválido para itens.');
      }
    }

    const resultado = await this.enviarReceitaUseCase.executar({
      clienteId: req.user.id,
      nomeArquivo: arquivo.originalname,
      buffer: arquivo.buffer,
      mimetype: arquivo.mimetype,
      observacoes: body.observacoes,
      itens,
      familiarId: body.familiarId || undefined,
    });

    return {
      sucesso: true,
      id: resultado.id,
      mensagem: 'Receita enviada com sucesso! Nossa equipe analisará e você receberá o orçamento em breve.',
    };
  }

  @Patch(':id/responder-cliente')
  @UseGuards(JwtAuthGuard)
  async responderCliente(
    @Param('id') id: string,
    @Body() body: { acao: 'APROVAR' | 'RECUSAR' },
    @Request() req: any,
  ) {
    return this.orcamentoService.responderCliente(id, body.acao, req.user.id);
  }

  @Post(':id/renovar')
  @UseGuards(JwtAuthGuard)
  async renovarPedido(@Param('id') id: string, @Request() req: any) {
    return this.orcamentoService.renovarPedido(id, req.user.id);
  }
}
