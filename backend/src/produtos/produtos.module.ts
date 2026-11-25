import { Module } from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { ProdutosController } from './produtos.controller';
import { AuthModule } from '../modules/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProdutosController],
  providers: [ProdutosService],
})
export class ProdutosModule {}
