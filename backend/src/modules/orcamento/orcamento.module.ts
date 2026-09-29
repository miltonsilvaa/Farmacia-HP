import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FamiliarModule } from '../familiar/familiar.module';
import { OrcamentoController } from './adapters/in/http/orcamento.controller';
import { ErpEntradaController } from './adapters/in/erp/erp-entrada.controller';
import { OrcamentoService } from './orcamento.service';
import { MinioService } from './minio.service';
import { EmailService } from './email.service';
import { ErpService } from './erp.service';
import { LembreteRecompraService } from './lembrete-recompra.service';
import { ERP_PORT } from './core/ports/out/erp.port';
import { escolherErpAdapter } from './adapters/out/erp/erp-adapter.factory';

@Module({
  imports: [AuthModule, FamiliarModule],
  controllers: [OrcamentoController, ErpEntradaController],
  providers: [
    OrcamentoService,
    MinioService,
    EmailService,
    ErpService,
    LembreteRecompraService,
    // Só o ERP legado fica atrás de uma porta: ERP_MODO=mock|arquivo|http
    { provide: ERP_PORT, useClass: escolherErpAdapter() },
  ],
})
export class OrcamentoModule {}
