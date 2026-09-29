import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrcamentoController } from './adapters/in/http/orcamento.controller';
import { OrcamentoService } from './orcamento.service';
import { ENVIAR_RECEITA_USE_CASE } from './core/ports/in/enviar-receita.use-case.port';
import { EnviarReceitaUseCase } from './core/use-cases/enviar-receita.use-case';
import { ORCAMENTO_REPOSITORY } from './core/ports/out/orcamento.repository.port';
import { OrcamentoRepositoryAdapter } from './adapters/out/database/orcamento.repository.adapter';
import { STORAGE_PORT } from './core/ports/out/storage.port';
import { MinioStorageAdapter } from './adapters/out/storage/minio-storage.adapter';
import { NOTIFICACAO_PORT } from './core/ports/out/notificacao.port';
import { EmailNotificacaoAdapter } from './adapters/out/notificacao/email-notificacao.adapter';

import { FamiliarModule } from '../familiar/familiar.module';
import { ErpService } from './erp.service';
import { LembreteRecompraService } from './lembrete-recompra.service';
import { ErpEntradaController } from './adapters/in/erp/erp-entrada.controller';
import { ERP_PORT } from './core/ports/out/erp.port';
import { escolherErpAdapter } from './adapters/out/erp/erp-adapter.factory';

@Module({
  imports: [AuthModule, FamiliarModule],
  controllers: [OrcamentoController, ErpEntradaController],
  providers: [
    OrcamentoService,
    ErpService,
    LembreteRecompraService,
    // ERP_MODO=mock|arquivo|http (ver erp-adapter.factory.ts)
    { provide: ERP_PORT, useClass: escolherErpAdapter() },
    { provide: ENVIAR_RECEITA_USE_CASE, useClass: EnviarReceitaUseCase },
    { provide: ORCAMENTO_REPOSITORY, useClass: OrcamentoRepositoryAdapter },
    { provide: STORAGE_PORT, useClass: MinioStorageAdapter },
    { provide: NOTIFICACAO_PORT, useClass: EmailNotificacaoAdapter },
  ],
})
export class OrcamentoModule {}
