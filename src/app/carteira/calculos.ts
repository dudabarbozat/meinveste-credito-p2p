import { HOJE, RELATORIOS, type Investimento, type Mei } from "@/lib/dados";
import { acharMei, metaBatida, type Estado } from "@/lib/estado";
import { parcela } from "@/lib/financas";
import { somaMeses } from "@/lib/formato";

export interface Linha {
  inv: Investimento;
  mei: Mei;
  parcela: number;
  batida: boolean;
  pagas: number;
  recebido: number;
  aReceber: number;
  status: string;
  /** mês (1 = próximo mês) da primeira parcela ainda não paga */
  inicio: number;
}

export function linhas(e: Estado): Linha[] {
  return e.investimentos
    .map((inv) => {
      const m = acharMei(e, inv.meiId);
      if (!m) return null;
      const p = parcela(inv.valor, m.taxa, m.prazo);
      const batida = metaBatida(e, m);
      const pagas = batida ? Math.min(inv.parcelasPagas, m.prazo) : 0;
      const status = !batida ? "Em captação" : pagas === 0 ? "Primeira parcela em breve" : pagas >= m.prazo ? "Quitado" : "Pagando";
      return {
        inv, mei: m, parcela: p, batida, pagas, recebido: p * pagas, aReceber: p * (m.prazo - pagas), status,
        inicio: batida ? 1 : 2,
      } satisfies Linha;
    })
    .filter((l): l is Linha => l !== null)
    .sort((a, b) => b.inv.data.localeCompare(a.inv.data));
}

export interface Mes {
  mes: string; // AAAA-MM
  confirmado: number;
  previsto: number;
  itens: { negocio: string; valor: number; confirmado: boolean }[];
}

/** Recebimentos dos próximos n meses a partir da data de referência. */
export function recebimentos(ls: Linha[], n: number): Mes[] {
  const meses: Mes[] = [];
  for (let k = 1; k <= n; k++) {
    const mes: Mes = { mes: somaMeses(HOJE, k), confirmado: 0, previsto: 0, itens: [] };
    ls.forEach((l) => {
      const restantes = l.mei.prazo - l.pagas;
      const idx = k - l.inicio + 1; // parcela de número idx entre as restantes
      if (idx < 1 || idx > restantes) return;
      if (l.batida) mes.confirmado += l.parcela;
      else mes.previsto += l.parcela;
      mes.itens.push({ negocio: l.mei.negocio, valor: l.parcela, confirmado: l.batida });
    });
    meses.push(mes);
  }
  return meses;
}

export function porSegmento(ls: Linha[]) {
  const acc: Record<string, number> = {};
  ls.forEach((l) => {
    acc[l.mei.segmento] = (acc[l.mei.segmento] ?? 0) + l.inv.valor;
  });
  return acc;
}

export function relatoriosDa(ls: Linha[]) {
  const ids = Array.from(new Set(ls.filter((l) => l.batida).map((l) => l.mei.id)));
  return ids
    .map((id) => ({
      mei: ls.find((l) => l.mei.id === id)!.mei,
      rels: RELATORIOS.filter((r) => r.meiId === id).sort((a, b) => a.periodo.localeCompare(b.periodo)),
    }))
    .sort((a, b) => b.rels.length - a.rels.length);
}
