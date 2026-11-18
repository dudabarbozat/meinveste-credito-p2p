"use client";

import { useSyncExternalStore } from "react";
import { CARTEIRA, MEIS, type Forma, type Investimento, type Mei } from "./dados";
import type { Parecer } from "./financas";
import type { EmpresaCnpj } from "./brasilapi";
import { hojeLocal } from "./formato";

const CHAVE = "meinveste:v2";

export type StatusCadastro = "rascunho" | "em_analise" | "aprovado";

export interface Cadastro {
  etapa: number;
  campos: Record<string, string>;
  docs: Record<string, { nome: string; tamanho: string }>;
  empresa: EmpresaCnpj | null;
  status: StatusCadastro;
  parecer: Parecer | null;
  enviadoEm: string | null;
  publicadoId: string | null;
}

export interface Estado {
  versao: 2;
  investimentos: Investimento[];
  meisNovos: Mei[];
  cadastro: Cadastro;
  guiaVisto: boolean;
}

export const cadastroVazio = (): Cadastro => ({
  etapa: 1, campos: {}, docs: {}, empresa: null, status: "rascunho", parecer: null, enviadoEm: null, publicadoId: null,
});

function inicial(): Estado {
  return {
    versao: 2,
    investimentos: CARTEIRA.map((i) => ({ ...i })),
    meisNovos: [],
    cadastro: cadastroVazio(),
    guiaVisto: false,
  };
}

const ESTADO_SERVIDOR = inicial();
let estado: Estado = ESTADO_SERVIDOR;
let carregado = false;
const ouvintes = new Set<() => void>();

function carregar() {
  if (carregado || typeof window === "undefined") return;
  carregado = true;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    const lido = bruto ? (JSON.parse(bruto) as Estado) : null;
    if (lido && lido.versao === 2 && Array.isArray(lido.investimentos)) estado = { ...inicial(), ...lido };
  } catch {
    /* sem armazenamento: segue com o estado inicial */
  }
}

function salvar() {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    /* segue em memória */
  }
}

function emitir() {
  ouvintes.forEach((f) => f());
}

export function atualizar(fn: (e: Estado) => Estado) {
  carregar();
  estado = fn(estado);
  salvar();
  emitir();
}

export function restaurar() {
  estado = inicial();
  try {
    window.localStorage.removeItem(CHAVE);
  } catch {
    /* ignora */
  }
  emitir();
}

function assinar(f: () => void) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

function obter() {
  carregar();
  return estado;
}

/** Estado reativo. No servidor (export estático) devolve o estado inicial. */
export function useEstado(): Estado {
  return useSyncExternalStore(assinar, obter, () => ESTADO_SERVIDOR);
}

/** true depois que o cliente leu o localStorage (para mostrar skeleton antes). */
export function useHidratado(): boolean {
  return useSyncExternalStore(assinar, () => true, () => false);
}

/* ---------- derivados ---------- */

export const todosMeis = (e: Estado) => MEIS.concat(e.meisNovos);
export const acharMei = (e: Estado, id: string) => todosMeis(e).find((m) => m.id === id) ?? null;

const novosDe = (e: Estado, meiId: string) => e.investimentos.filter((i) => i.novo && i.meiId === meiId);
export const captado = (e: Estado, m: Mei) => m.captadoBase + novosDe(e, m.id).reduce((s, i) => s + i.valor, 0);
export const investidores = (e: Estado, m: Mei) => m.investidoresBase + novosDe(e, m.id).length;
export const metaBatida = (e: Estado, m: Mei) => captado(e, m) >= m.meta;

export function investir(meiId: string, valor: number, forma: Forma): Investimento {
  const agora = new Date();
  const inv: Investimento = {
    id: "inv-" + agora.getTime().toString(36),
    meiId, valor, forma,
    data: hojeLocal(),
    parcelasPagas: 0, novo: true,
    recibo: "MEI-" + agora.getTime().toString(36).toUpperCase().slice(-8),
  };
  atualizar((e) => ({ ...e, investimentos: [...e.investimentos, inv] }));
  return inv;
}
