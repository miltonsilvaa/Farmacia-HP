import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

// Autentica chamadas do ERP legado pelo token compartilhado (ERP_TOKEN).
// Sem ERP_TOKEN configurado, a entrada do ERP fica desligada.
@Injectable()
export class ErpTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const esperado = process.env.ERP_TOKEN;
    const header: string = context.switchToHttp().getRequest().headers.authorization ?? '';
    const recebido = header.replace(/^Bearer\s+/i, '');
    if (!esperado || !recebido) throw new UnauthorizedException();

    const a = Buffer.from(recebido);
    const b = Buffer.from(esperado);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException();
    return true;
  }
}
