import { Body, Controller, Param, Put, UseGuards } from '@nestjs/common';
import { OrcamentoService } from '../../../orcamento.service';
import { ErpTokenGuard } from './erp-token.guard';

// Rotas chamadas PELO ERP legado (dados que voltam do ERP para o app)
@Controller('erp')
@UseGuards(ErpTokenGuard)
export class ErpEntradaController {
  constructor(private readonly orcamentoService: OrcamentoService) {}

  // PUT /erp/pedidos/:id/posologia  { "posologia": "Tomar 10 gotas 2x ao dia" }
  @Put('pedidos/:id/posologia')
  async definirPosologia(@Param('id') id: string, @Body() body: { posologia: string | null }) {
    return this.orcamentoService.definirPosologia(id, body.posologia);
  }
}
