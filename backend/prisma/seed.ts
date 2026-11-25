import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';
import { gerarChaveFonetica } from '../src/busca/phonetic/metaphone-ptbr';

interface ItemCatalogo {
  id: number;
  nome: string;
  principio_ativo: string;
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

  await prisma.usuario.upsert({
    where: { email: 'admin@teste.com' },
    update: { senha: senhaAdmin, role: 'ADMIN' },
    create: { email: 'admin@teste.com', senha: senhaAdmin, role: 'ADMIN' },
  });

  await prisma.usuario.upsert({
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

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
