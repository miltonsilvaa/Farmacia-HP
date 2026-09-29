import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ProdutosModule } from './produtos/produtos.module';
import { OrcamentoModule } from './modules/orcamento/orcamento.module';
import { FamiliarModule } from './modules/familiar/familiar.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    UsuariosModule,
    ProdutosModule,
    OrcamentoModule,
    FamiliarModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
