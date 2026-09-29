import 'multer';
import {
  Controller,
  Get,
  Post,
  Patch,
  UseInterceptors,
  UploadedFiles,
  Body,
  Inject,
  Param,
  Request,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ErpService } from '../../../erp.service';
import { CONTENT_TYPE } from '../../../core/erp/erp-serializador';
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

    private readonly erpService: ErpService,
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

  // Reenvio manual ao ERP (ex.: depois de uma falha)
  @Post('admin/:id/erp')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async enviarAoErp(@Param('id') id: string) {
    return this.erpService.sincronizar(id);
  }

  // Download do pedido no formato do ERP (?formato=json|xml)
  @Get('admin/:id/erp')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async exportarErp(
    @Param('id') id: string,
    @Query('formato') formato: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const fmt = formato === 'xml' ? 'xml' : 'json';
    const { conteudo, nomeArquivo } = await this.erpService.exportar(id, fmt);
    res.set({
      'Content-Type': CONTENT_TYPE[fmt],
      'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
    });
    return conteudo;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listarMeusPedidos(@Request() req: any) {
    return this.orcamentoService.listarPorUsuario(req.user.id);
  }

  @Post('receita')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'arquivo', maxCount: 1 },
        { name: 'anexos', maxCount: 5 },
      ],
      {
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
          const ok = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
          cb(ok ? null : new BadRequestException('Envie apenas imagem ou PDF.'), ok);
        },
      },
    ),
  )
  async enviarReceita(
    @UploadedFiles()
    arquivos: { arquivo?: Express.Multer.File[]; anexos?: Express.Multer.File[] },
    @Body() body: { observacoes?: string; itens?: string; familiarId?: string },
    @Request() req: any,
  ) {
    const arquivo = arquivos?.arquivo?.[0];
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
      anexos: (arquivos.anexos ?? []).map((a) => ({
        nomeArquivo: a.originalname,
        buffer: a.buffer,
        mimetype: a.mimetype,
      })),
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
