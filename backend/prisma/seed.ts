import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';
import { Client as MinioClient } from 'minio';
import { gerarChaveFonetica } from '../src/busca/phonetic/metaphone-ptbr';

interface ItemCatalogo {
  id: number;
  nome: string;
  principio_ativo: string;
}

// Pequeno PNG 1x1 (verde), só pra "Ver receita" abrir algo de verdade nos pedidos mockados.
const RECEITA_EXEMPLO_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

async function enviarReceitaExemplo(): Promise<string> {
  const chaveArquivo = 'seed-receita-exemplo.png';
  try {
    const minio = new MinioClient({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
      secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
      region: process.env.MINIO_REGION || 'us-east-1',
    });
    const bucket = process.env.MINIO_BUCKET_NAME || 'receitas';
    await minio.putObject(bucket, chaveArquivo, RECEITA_EXEMPLO_PNG, RECEITA_EXEMPLO_PNG.length, {
      'Content-Type': 'image/png',
    });
    console.log('Receita de exemplo enviada ao armazenamento.');
  } catch (error) {
    console.warn('Não foi possível enviar a receita de exemplo ao armazenamento (seguindo mesmo assim):', error);
  }
  return chaveArquivo;
}

function diasAtras(dias: number): Date {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data;
}

async function main() {
  const pool = new pg.Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5433/homeoformula?schema=public',
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as any);

  const senhaAdmin = await bcrypt.hash('123456', 10);
  const senhaCliente = await bcrypt.hash('123456', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@teste.com' },
    update: { senha: senhaAdmin, role: 'ADMIN' },
    create: { email: 'admin@teste.com', senha: senhaAdmin, role: 'ADMIN' },
  });

  const cliente = await prisma.usuario.upsert({
    where: { email: 'cliente@teste.com' },
    update: { senha: senhaCliente, role: 'CLIENTE' },
    create: { email: 'cliente@teste.com', senha: senhaCliente, role: 'CLIENTE' },
  });

  console.log('✅ Seed concluído: admin@teste.com (ADMIN) e cliente@teste.com (CLIENTE) — senha: 123456');

  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS unaccent;');

  const caminhoCatalogo = join(process.cwd(), 'test', 'data', 'catalogo.json');
  const catalogo: ItemCatalogo[] = JSON.parse(readFileSync(caminhoCatalogo, 'utf-8'));

  await prisma.medicamento.deleteMany();

  for (const item of catalogo) {
    await prisma.medicamento.create({
      data: {
        id: item.id,
        nome: item.nome,
        principioAtivo: item.principio_ativo,
        chaveFonetica: gerarChaveFonetica(item.principio_ativo),
      },
    });
  }

  console.log(`Seed concluído: ${catalogo.length} medicamentos inseridos.`);

  // --- Dados de demonstração: catálogo, família e pedidos em vários status ---
  // Limpa só o que pertence aos usuários de teste, pra rodar de novo em cada deploy sem duplicar.
  const orcamentosAntigos = await prisma.orcamento.findMany({
    where: { clienteId: cliente.id },
    select: { id: true },
  });
  const idsOrcamentosAntigos = orcamentosAntigos.map((o) => o.id);
  await prisma.orcamentoItem.deleteMany({ where: { orcamentoId: { in: idsOrcamentosAntigos } } });
  await prisma.orcamento.deleteMany({ where: { clienteId: cliente.id } });
  await prisma.familiar.deleteMany({ where: { usuarioId: cliente.id } });
  await prisma.produto.deleteMany();

  const [vitaminaD, colageno, melatonina, omega3, magnesio, propolis] = await Promise.all([
    prisma.produto.create({
      data: { nome: 'Vitamina D3 2000 UI', descricao: 'Cápsulas, uso contínuo', preco: 39.9, estoque: 50, ativo: true },
    }),
    prisma.produto.create({
      data: { nome: 'Colágeno Hidrolisado + Vitamina C', descricao: 'Pó para diluir em água, sabor neutro', preco: 68.5, estoque: 30, ativo: true },
    }),
    prisma.produto.create({
      data: { nome: 'Melatonina 3mg', descricao: 'Cápsulas de liberação rápida', preco: 29.9, estoque: 40, ativo: true },
    }),
    prisma.produto.create({
      data: { nome: 'Ômega 3 1000mg', descricao: 'Cápsulas gel, alta concentração de EPA/DHA', preco: 54.9, estoque: 25, ativo: true },
    }),
    prisma.produto.create({
      data: { nome: 'Magnésio Dimalato 200mg', descricao: 'Cápsulas, uso contínuo', preco: 42.0, estoque: 35, ativo: true },
    }),
    prisma.produto.create({
      data: { nome: 'Própolis Verde Extrato Seco', descricao: 'Cápsulas', preco: 37.5, estoque: 20, ativo: true },
    }),
  ]);

  const mae = await prisma.familiar.create({
    data: {
      usuarioId: cliente.id,
      nome: 'Marta Oliveira',
      parentesco: 'Mãe',
      tipo: 'PESSOA',
      dataNascimento: new Date('1958-04-12'),
    },
  });

  await prisma.familiar.create({
    data: {
      usuarioId: cliente.id,
      nome: 'Rex',
      parentesco: 'Pet',
      tipo: 'PET',
      especie: 'Cão',
    },
  });

  const chaveReceita = await enviarReceitaExemplo();

  await prisma.orcamento.create({
    data: {
      clienteId: cliente.id,
      arquivoReceitaUrl: chaveReceita,
      status: 'PENDENTE',
      observacoes: 'Receita do clínico geral, uso contínuo.',
      criadoEm: diasAtras(1),
    },
  });

  await prisma.orcamento.create({
    data: {
      clienteId: cliente.id,
      arquivoReceitaUrl: chaveReceita,
      status: 'AGUARDANDO_PAGAMENTO',
      respostaAdmin: 'Orçamento pronto! Fórmula manipulada conforme a receita enviada.',
      preco: 87.5,
      criadoEm: diasAtras(2),
      itens: {
        create: [{ produtoId: vitaminaD.id, quantidade: 1, precoUnitario: vitaminaD.preco }],
      },
    },
  });

  await prisma.orcamento.create({
    data: {
      clienteId: cliente.id,
      arquivoReceitaUrl: chaveReceita,
      status: 'PRODUCAO',
      preco: 64.9,
      posologia: 'Tomar 1 cápsula ao dia, pela manhã, em jejum.',
      criadoEm: diasAtras(4),
      itens: {
        create: [{ produtoId: melatonina.id, quantidade: 1, precoUnitario: melatonina.preco }],
      },
    },
  });

  await prisma.orcamento.create({
    data: {
      clienteId: cliente.id,
      familiarId: mae.id,
      arquivoReceitaUrl: chaveReceita,
      status: 'FINALIZADO',
      preco: 123.4,
      posologia: 'Tomar 1 cápsula de cada no almoço e no jantar.',
      criadoEm: diasAtras(6),
      itens: {
        create: [
          { produtoId: omega3.id, quantidade: 1, precoUnitario: omega3.preco },
          { produtoId: magnesio.id, quantidade: 1, precoUnitario: magnesio.preco },
        ],
      },
    },
  });

  await prisma.orcamento.create({
    data: {
      clienteId: cliente.id,
      arquivoReceitaUrl: chaveReceita,
      status: 'ENTREGUE',
      preco: 37.5,
      posologia: 'Tomar 1 cápsula ao dia, após o almoço.',
      criadoEm: diasAtras(26),
      itens: {
        create: [{ produtoId: propolis.id, quantidade: 1, precoUnitario: propolis.preco }],
      },
    },
  });

  await prisma.orcamento.create({
    data: {
      clienteId: cliente.id,
      arquivoReceitaUrl: chaveReceita,
      status: 'RECUSADO',
      respostaAdmin: 'A receita está ilegível. Pode reenviar uma foto mais nítida, por favor?',
      criadoEm: diasAtras(3),
    },
  });

  await prisma.orcamento.create({
    data: {
      clienteId: cliente.id,
      arquivoReceitaUrl: chaveReceita,
      status: 'CANCELADO',
      observacoes: 'Pedido cancelado pelo cliente.',
      criadoEm: diasAtras(10),
    },
  });

  console.log('Seed concluído: 6 produtos, 2 familiares e 7 pedidos de exemplo para cliente@teste.com.');

  void admin;
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
