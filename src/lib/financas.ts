import { TAXA_POR_RISCO, type Risco } from "./dados";

/** Parcela fixa pela tabela Price. taxa em % ao mês. */
export function parcela(valor: number, taxa: number, prazo: number) {
  const i = taxa / 100;
  if (!i) return valor / prazo;
  return (valor * i) / (1 - Math.pow(1 + i, -prazo));
}

export interface LinhaCronograma {
  n: number;
  parcela: number;
  juros: number;
  amortizacao: number;
  saldo: number;
}

export function cronograma(valor: number, taxa: number, prazo: number): LinhaCronograma[] {
  const p = parcela(valor, taxa, prazo);
  const i = taxa / 100;
  let saldo = valor;
  const linhas: LinhaCronograma[] = [];
  for (let n = 1; n <= prazo; n++) {
    const juros = saldo * i;
    const amortizacao = p - juros;
    saldo = Math.max(0, saldo - amortizacao);
    linhas.push({ n, parcela: p, juros, amortizacao, saldo });
  }
  return linhas;
}

/** Converte taxa anual em mensal equivalente (ambas em %). */
export function anualParaMensal(anual: number) {
  return (Math.pow(1 + anual / 100, 1 / 12) - 1) * 100;
}

/** Converte taxa mensal em anual equivalente (ambas em %). */
export function mensalParaAnual(mensal: number) {
  return (Math.pow(1 + mensal / 100, 12) - 1) * 100;
}

export interface DadosAnalise {
  faturamento: number;
  meta: number;
  prazo: number;
  desde: number;
}

export interface Parecer {
  classe: Risco;
  taxa: number;
  metaRecomendada: number;
  ajustada: boolean;
  condicionado: boolean; // aprovação depende de regularizar o CNPJ
  parcela: number;
  comprometimento: number; // fração do faturamento
  pontosFortes: string[];
  pontosAtencao: string[];
  recomendacao: string;
  fonteCnpj: boolean; // true quando usou dados da consulta pública do CNPJ
}

/** Dados extras para enriquecer o parecer (vindos da consulta do CNPJ e do cadastro). */
export interface ContextoAnalise {
  abertura?: string; // AAAA-MM-DD, data de início de atividade no CNPJ
  situacao?: string; // situação cadastral
  cnae?: string;
  atividade?: string; // descrição do CNAE
  segmentoInformado?: string;
  segmentoDaAtividade?: string;
  rendaAvalista?: number;
  hoje?: string; // AAAA-MM-DD
  fonteCnpj?: boolean;
}

/** Peso da parcela (taxa da classe B) no faturamento. */
export function previa(d: Pick<DadosAnalise, "faturamento" | "meta" | "prazo">) {
  const p = parcela(d.meta, TAXA_POR_RISCO.B, d.prazo);
  return { parcela: p, comprometimento: d.faturamento > 0 ? p / d.faturamento : 1 };
}

/** Classe pela regra fixa: peso da parcela e tempo de negócio. */
export function classePelaRegra(d: DadosAnalise, anoAtual = 2026): Risco {
  const anos = anoAtual - d.desde;
  const { comprometimento } = previa(d);
  if (comprometimento <= 0.15 && anos >= 3) return "A";
  if (comprometimento <= 0.25 && anos >= 1) return "B";
  return "C";
}

/** Maior meta cuja parcela cabe em 35% do faturamento, arredondada para baixo em R$ 500. */
export function metaQueCabe(faturamento: number, taxa: number, prazo: number) {
  return Math.floor((0.35 * faturamento) / parcela(1, taxa, prazo) / 500) * 500;
}

const PIORA: Record<Risco, Risco> = { A: "B", B: "C", C: "C" };
const MELHORA: Record<Risco, Risco> = { A: "A", B: "A", C: "B" };

function mesesEntre(de: string, ate: string) {
  const [a1, m1, d1] = de.split("-").map(Number) as [number, number, number];
  const [a2, m2, d2] = ate.split("-").map(Number) as [number, number, number];
  return (a2 - a1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}

function cnaeFormatado(c: string) {
  const d = c.replace(/\D/g, "");
  return d.length === 7 ? `${d.slice(0, 4)}-${d.slice(4, 5)}/${d.slice(5)}` : c;
}

/** Segmentos com venda recorrente no bairro e os mais sensíveis a sazonalidade. */
const SEG_RECORRENTE = ["Alimentação", "Comércio"];
const SEG_SAZONAL = ["Moda", "Beleza"];

/**
 * Parecer de risco por regras fixas:
 * peso da parcela no faturamento, tempo de CNPJ (data de abertura real quando houver consulta),
 * situação cadastral, atividade (CNAE) e renda do avalista.
 */
export function parecerPelaRegra(d: DadosAnalise, ctx: ContextoAnalise = {}, anoAtual = 2026): Parecer {
  const hoje = ctx.hoje ?? `${anoAtual}-11-17`;
  const meses = ctx.abertura ? Math.max(0, mesesEntre(ctx.abertura, hoje)) : Math.max(0, (anoAtual - d.desde) * 12);
  const anos = Math.floor(meses / 12);
  const desdeEfetivo = anoAtual - anos;

  let classe = classePelaRegra({ ...d, desde: desdeEfetivo }, anoAtual);
  const fortes: string[] = [];
  const atencao: string[] = [];

  /* tempo de CNPJ */
  const origemTempo = ctx.abertura ? "pela data de abertura no CNPJ" : "pelo ano informado";
  if (anos >= 5) fortes.push(`${anos} anos de atividade (${origemTempo}).`);
  else if (anos >= 3) fortes.push(`${anos} anos de atividade (${origemTempo}), o mínimo para a classe A.`);
  else if (meses >= 12) atencao.push(`${anos} ano(s) de atividade (${origemTempo}); histórico ainda curto.`);
  else atencao.push(`Menos de 1 ano de CNPJ (${meses} meses); sem histórico para medir sazonalidade.`);

  /* situação cadastral */
  const situacao = (ctx.situacao ?? "").trim().toUpperCase();
  const condicionado = situacao !== "" && situacao !== "ATIVA";
  if (situacao === "ATIVA") fortes.push("Situação cadastral ativa na Receita Federal.");
  else if (condicionado) {
    atencao.push(`Situação cadastral ${situacao.toLowerCase()}: a captação só abre depois da regularização.`);
    classe = PIORA[classe];
  }

  /* atividade (CNAE) */
  if (ctx.atividade) {
    const rotulo = ctx.cnae ? `CNAE ${cnaeFormatado(ctx.cnae)}` : "Atividade";
    const seg = ctx.segmentoDaAtividade ?? "";
    if (SEG_RECORRENTE.includes(seg)) fortes.push(`${rotulo} (${ctx.atividade.toLowerCase()}): demanda recorrente no bairro.`);
    else if (SEG_SAZONAL.includes(seg)) atencao.push(`${rotulo} (${ctx.atividade.toLowerCase()}): vendas sensíveis a sazonalidade.`);
    else fortes.push(`${rotulo} (${ctx.atividade.toLowerCase()}) compatível com o pedido.`);
    if (ctx.segmentoInformado && seg && ctx.segmentoInformado !== seg)
      atencao.push(`Segmento informado (${ctx.segmentoInformado}) diferente do sugerido pela atividade do CNPJ (${seg}).`);
  }

  /* avalista */
  const pBase = parcela(d.meta, TAXA_POR_RISCO[classe], d.prazo);
  if (ctx.rendaAvalista !== undefined) {
    if (ctx.rendaAvalista >= pBase * 3) {
      fortes.push("Renda do avalista cobre com folga mais de 3 parcelas.");
      if (classe === "B" && !condicionado && meses >= 36 && pBase / d.faturamento <= 0.18) classe = MELHORA[classe];
    } else if (ctx.rendaAvalista >= pBase) fortes.push("Renda do avalista cobre a parcela, sem exigência de garantia real.");
    else atencao.push("Renda do avalista menor que a parcela: o aval vale pouco num atraso.");
  } else fortes.push("Avalista indicado, sem exigência de garantia real.");

  /* peso da parcela e teto de 35% */
  const taxa = TAXA_POR_RISCO[classe];
  let meta = d.meta;
  let ajustada = false;
  if (parcela(meta, taxa, d.prazo) / d.faturamento > 0.35) {
    meta = Math.max(500, metaQueCabe(d.faturamento, taxa, d.prazo));
    ajustada = true;
  }
  const p = parcela(meta, taxa, d.prazo);
  const comp = p / d.faturamento;
  if (comp <= 0.15) fortes.unshift("Parcela abaixo de 15% do faturamento médio.");
  else if (comp <= 0.25) atencao.unshift("Parcela entre 15% e 25% do faturamento: pouca folga em meses fracos.");
  else atencao.unshift("Parcela acima de 25% do faturamento: risco de aperto no caixa.");
  if (ajustada) atencao.push("O valor pedido daria parcela acima de 35% do faturamento.");

  let recomendacao = ajustada
    ? `Aprovar com meta reduzida para ${meta.toLocaleString("pt-BR")} reais, para a parcela caber no caixa.`
    : "Aprovar no valor pedido.";
  if (condicionado) recomendacao += " Captação condicionada à regularização do CNPJ.";

  return {
    classe, taxa, metaRecomendada: meta, ajustada, condicionado, parcela: p, comprometimento: comp,
    pontosFortes: fortes.slice(0, 5), pontosAtencao: atencao.slice(0, 5), recomendacao, fonteCnpj: Boolean(ctx.fonteCnpj),
  };
}
