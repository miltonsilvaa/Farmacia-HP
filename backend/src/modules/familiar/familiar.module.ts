import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import {
  FamiliarController,
  FamiliaAcessoController,
} from './adapters/in/http/familiar.controller';
import { FamiliarService } from './familiar.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [FamiliarController, FamiliaAcessoController],
  providers: [FamiliarService],
  exports: [FamiliarService],
})
export class FamiliarModule {}
