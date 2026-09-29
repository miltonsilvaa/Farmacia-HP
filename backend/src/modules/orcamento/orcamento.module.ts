import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrcamentoController } from './adapters/in/http/orcamento.controller';
import { OrcamentoService } from './orcamento.service';
import { ENVIAR_RECEITA_USE_CASE } from './core/ports/in/enviar-receita.use-case.port';
import { RENOVAR_RECEITA_USE_CASE } from './core/ports/in/renovar-receita.use-case.port';
import { EnviarReceitaUseCase } from './core/use-cases/enviar-receita.use-case';
import { RenovarReceitaUseCase } from './core/use-cases/renovar-receita.use-case';
import { ORCAMENTO_REPOSITORY } from './core/ports/out/orcamento.repository.port';
import { OrcamentoRepositoryAdapter } from './adapters/out/database/orcamento.repository.adapter';
import { STORAGE_PORT } from './core/ports/out/storage.port';
import { MinioStorageAdapter } from './adapters/out/storage/minio-storage.adapter';
import { NOTIFICACAO_PORT } from './core/ports/out/notificacao.port';
import { EmailNotificacaoAdapter } from './adapters/out/notificacao/email-notificacao.adapter';

import { FamiliarModule } from '../familiar/familiar.module';
import { ErpService } from './erp.service';
import { LembreteRecompraService } from './lembrete-recompra.service';
import { ERP_PORT } from './core/ports/out/erp.port';
import { HttpErpAdapter } from './adapters/out/erp/http-erp.adapter';
import { ArquivoErpAdapter } from './adapters/out/erp/arquivo-erp.adapter';

@Module({
  imports: [AuthModule, FamiliarModule],
  controllers: [OrcamentoController],
  providers: [
    OrcamentoService,
    ErpService,
    LembreteRecompraService,
    // Com ERP_URL envia por HTTP; sem ela, grava arquivos na pasta de saída
    { provide: ERP_PORT, useClass: process.env.ERP_URL ? HttpErpAdapter : ArquivoErpAdapter },
    { provide: ENVIAR_RECEITA_USE_CASE, useClass: EnviarReceitaUseCase },
    { provide: RENOVAR_RECEITA_USE_CASE, useClass: RenovarReceitaUseCase },
    { provide: ORCAMENTO_REPOSITORY, useClass: OrcamentoRepositoryAdapter },
    { provide: STORAGE_PORT, useClass: MinioStorageAdapter },
    { provide: NOTIFICACAO_PORT, useClass: EmailNotificacaoAdapter },
  ],
})
export class OrcamentoModule {}
