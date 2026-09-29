import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface DadosFamiliar {
  nome: string;
  parentesco?: string;
  tipo?: string;
  especie?: string;
  dataNascimento?: string;
}

@Injectable()
export class FamiliarService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizar(dados: Partial<DadosFamiliar>) {
    const tipo = dados.tipo === 'PET' ? 'PET' : 'PESSOA';
    return {
      ...(dados.nome !== undefined && { nome: dados.nome.trim() }),
      tipo,
      parentesco: tipo === 'PET' ? 'Pet' : (dados.parentesco ?? 'Outro'),
      especie: tipo === 'PET' ? (dados.especie || null) : null,
      ...(dados.dataNascimento !== undefined && {
        dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : null,
      }),
    };
  }

  async adicionar(usuarioId: string, dados: DadosFamiliar) {
    if (!dados.nome?.trim()) throw new BadRequestException('Informe o nome.');
    return this.prisma.familiar.create({
      data: { usuarioId, nome: dados.nome.trim(), ...this.normalizar(dados) },
    });
  }

  async atualizar(familiarId: string, usuarioId: string, dados: Partial<DadosFamiliar>) {
    await this.buscarProprio(familiarId, usuarioId);
    return this.prisma.familiar.update({
      where: { id: familiarId },
      data: this.normalizar(dados),
    });
  }

  // Dependentes próprios + os compartilhados por titulares que convidaram este usuário
  async listarPorUsuario(usuarioId: string) {
    const titulares = await this.titularesAcessiveis(usuarioId);
    const familiares = await this.prisma.familiar.findMany({
      where: { usuarioId: { in: [usuarioId, ...titulares] } },
      include: { usuario: { select: { email: true } } },
      orderBy: { nome: 'asc' },
    });
    return familiares.map(({ usuario, ...f }) => ({
      ...f,
      proprio: f.usuarioId === usuarioId,
      titularEmail: f.usuarioId === usuarioId ? null : usuario.email,
    }));
  }

  async remover(familiarId: string, usuarioId: string) {
    await this.buscarProprio(familiarId, usuarioId);
    const pedidos = await this.prisma.orcamento.count({ where: { familiarId } });
    if (pedidos > 0) {
      throw new BadRequestException(
        'Este dependente tem pedidos no histórico e não pode ser removido.',
      );
    }
    await this.prisma.familiar.delete({ where: { id: familiarId } });
    return { sucesso: true };
  }

  private async buscarProprio(familiarId: string, usuarioId: string) {
    const familiar = await this.prisma.familiar.findFirst({
      where: { id: familiarId, usuarioId },
    });
    if (!familiar) {
      throw new NotFoundException('Familiar não encontrado ou não pertence ao usuário.');
    }
    return familiar;
  }

  // ── Compartilhamento do Grupo Família ─────────────────────────────────────

  async titularesAcessiveis(usuarioId: string): Promise<string[]> {
    const acessos = await this.prisma.familiaAcesso.findMany({
      where: { membroId: usuarioId, status: 'ACEITO' },
      select: { titularId: true },
    });
    return acessos.map((a) => a.titularId);
  }

  // O usuário pode usar o dependente se for o titular ou um membro com acesso aceito
  async podeAcessarFamiliar(usuarioId: string, familiarId: string): Promise<boolean> {
    const familiar = await this.prisma.familiar.findUnique({ where: { id: familiarId } });
    if (!familiar) return false;
    if (familiar.usuarioId === usuarioId) return true;
    const titulares = await this.titularesAcessiveis(usuarioId);
    return titulares.includes(familiar.usuarioId);
  }

  async listarAcessos(usuarioId: string, email: string) {
    const [concedidos, recebidos] = await Promise.all([
      this.prisma.familiaAcesso.findMany({
        where: { titularId: usuarioId },
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.familiaAcesso.findMany({
        where: { emailConvidado: email.toLowerCase() },
        include: { titular: { select: { email: true } } },
        orderBy: { criadoEm: 'desc' },
      }),
    ]);
    return {
      concedidos,
      recebidos: recebidos.map(({ titular, ...a }) => ({ ...a, titularEmail: titular.email })),
    };
  }

  async convidar(usuarioId: string, emailTitular: string, emailConvidado: string) {
    const email = emailConvidado?.trim().toLowerCase();
    if (!email || !email.includes('@')) throw new BadRequestException('Informe um e-mail válido.');
    if (email === emailTitular.toLowerCase()) {
      throw new BadRequestException('Você não pode convidar a si mesmo.');
    }
    const existente = await this.prisma.familiaAcesso.findUnique({
      where: { titularId_emailConvidado: { titularId: usuarioId, emailConvidado: email } },
    });
    if (existente) throw new BadRequestException('Este e-mail já foi convidado.');

    return this.prisma.familiaAcesso.create({
      data: { titularId: usuarioId, emailConvidado: email },
    });
  }

  async aceitar(acessoId: string, usuarioId: string, email: string) {
    const acesso = await this.prisma.familiaAcesso.findUnique({ where: { id: acessoId } });
    if (!acesso || acesso.emailConvidado !== email.toLowerCase()) {
      throw new NotFoundException('Convite não encontrado.');
    }
    return this.prisma.familiaAcesso.update({
      where: { id: acessoId },
      data: { status: 'ACEITO', membroId: usuarioId },
    });
  }

  // O titular revoga o acesso, ou o convidado recusa/sai do grupo
  async removerAcesso(acessoId: string, usuarioId: string, email: string) {
    const acesso = await this.prisma.familiaAcesso.findUnique({ where: { id: acessoId } });
    if (!acesso) throw new NotFoundException('Convite não encontrado.');
    const ehTitular = acesso.titularId === usuarioId;
    const ehConvidado = acesso.emailConvidado === email.toLowerCase();
    if (!ehTitular && !ehConvidado) throw new ForbiddenException();
    await this.prisma.familiaAcesso.delete({ where: { id: acessoId } });
    return { sucesso: true };
  }
}
