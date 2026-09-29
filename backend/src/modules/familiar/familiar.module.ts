import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FamiliarController, FamiliaAcessoController } from './adapters/in/http/familiar.controller';
import { FamiliarService } from './familiar.service';
import { SalvarFamiliarUseCase } from './core/use-cases/salvar-familiar.use-case';
import { ListarFamiliaresUseCase } from './core/use-cases/listar-familiares.use-case';
import { FamiliarRepositoryAdapter } from './adapters/out/database/familiar.repository.adapter';
import { SALVAR_FAMILIAR_USE_CASE } from './core/ports/in/salvar-familiar.use-case.port';
import { LISTAR_FAMILIARES_USE_CASE } from './core/ports/in/listar-familiares.use-case.port';
import { FAMILIAR_REPOSITORY } from './core/ports/out/familiar.repository.port';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FamiliarController, FamiliaAcessoController],
  providers: [
    FamiliarService,
    { provide: SALVAR_FAMILIAR_USE_CASE, useClass: SalvarFamiliarUseCase },
    { provide: LISTAR_FAMILIARES_USE_CASE, useClass: ListarFamiliaresUseCase },
    { provide: FAMILIAR_REPOSITORY, useClass: FamiliarRepositoryAdapter },
  ],
  exports: [FamiliarService],
})
export class FamiliarModule {}
