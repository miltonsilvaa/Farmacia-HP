import {
  Ban,
  BellRing,
  CircleCheckBig,
  Clock,
  FlaskConical,
  PackageCheck,
  CircleX,
  type LucideIcon,
} from 'lucide-react';

export type Cor = 'laranja' | 'amarelo' | 'azul' | 'verde' | 'cinza' | 'vermelho';

interface InfoStatus {
  rotulo: string; // como o cliente lê
  rotuloAdmin: string; // como a equipe lê
  cor: Cor;
  icone: LucideIcon;
}

// Vocabulário único de status: a mesma cor, ícone e nome em todas as telas
export const STATUS: Record<string, InfoStatus> = {
  PENDENTE: { rotulo: 'Aguardando orçamento', rotuloAdmin: 'Aguardando orçamento', cor: 'laranja', icone: Clock },
  AGUARDANDO_PAGAMENTO: { rotulo: 'Orçamento pronto: responda', rotuloAdmin: 'Orçamento enviado', cor: 'amarelo', icone: BellRing },
  PRODUCAO: { rotulo: 'Em manipulação', rotuloAdmin: 'Em manipulação', cor: 'azul', icone: FlaskConical },
  FINALIZADO: { rotulo: 'Pronto para retirada', rotuloAdmin: 'Pronto', cor: 'verde', icone: PackageCheck },
  ENTREGUE: { rotulo: 'Entregue', rotuloAdmin: 'Entregue', cor: 'cinza', icone: CircleCheckBig },
  RECUSADO: { rotulo: 'Não aprovado pela farmácia', rotuloAdmin: 'Recusado', cor: 'vermelho', icone: CircleX },
  CANCELADO: { rotulo: 'Cancelado', rotuloAdmin: 'Cancelado', cor: 'cinza', icone: Ban },
};

export const infoStatus = (status: string): InfoStatus =>
  STATUS[status] ?? { rotulo: status, rotuloAdmin: status, cor: 'cinza', icone: Clock };

// Classes estáticas (o Tailwind precisa enxergar o nome completo)
export const CLASSES_COR: Record<Cor, string> = {
  laranja: 'bg-status-laranja-soft text-status-laranja',
  amarelo: 'bg-status-amarelo-soft text-status-amarelo',
  azul: 'bg-status-azul-soft text-status-azul',
  verde: 'bg-status-verde-soft text-status-verde',
  cinza: 'bg-status-cinza-soft text-status-cinza',
  vermelho: 'bg-status-vermelho-soft text-status-vermelho',
};

// Ponto de cor sólido (filtros e legendas)
export const PONTO_COR: Record<Cor, string> = {
  laranja: 'bg-ponto-laranja',
  amarelo: 'bg-ponto-amarelo',
  azul: 'bg-ponto-azul',
  verde: 'bg-ponto-verde',
  cinza: 'bg-ponto-cinza',
  vermelho: 'bg-ponto-vermelho',
};

// Pedidos aprovados pelo cliente podem ser refeitos com 1 clique (mesma regra do backend)
export const STATUS_RENOVAVEIS = ['PRODUCAO', 'FINALIZADO', 'ENTREGUE'];
