const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatarMoeda = (valor: number | string | null | undefined) =>
  valor === null || valor === undefined || valor === '' ? '—' : moeda.format(Number(valor));

export const formatarData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

// Data de nascimento vem sem fuso: mostra o dia gravado, sem voltar um dia
export const formatarDataUTC = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

// O mesmo número aparece no app, no e-mail e na mensagem do WhatsApp
export const numeroPedido = (id: string) => id.substring(0, 8).toUpperCase();
