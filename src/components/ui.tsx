"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icone } from "./Icone";

export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/* ---------- aviso (toast) ---------- */

const AvisoCtx = createContext<(texto: string) => void>(() => {});
export const useAviso = () => useContext(AvisoCtx);

export function AvisoProvider({ children }: { children: ReactNode }) {
  const [texto, setTexto] = useState("");
  const [visivel, setVisivel] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const avisar = useCallback((t: string) => {
    setTexto(t);
    setVisivel(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisivel(false), 3200);
  }, []);
  return (
    <AvisoCtx.Provider value={avisar}>
      {children}
      <div className={"aviso" + (visivel ? " visivel" : "")} role="status" aria-live="polite">
        {texto}
      </div>
    </AvisoCtx.Provider>
  );
}

/* ---------- selos e barras ---------- */

export function SeloDemo({ texto = "simulado na demo" }: { texto?: string }) {
  return (
    <span className="selo-sim">
      <Icone nome="info" />
      {texto}
    </span>
  );
}

export function Barra({ valor, total, rotulo }: { valor: number; total: number; rotulo: string }) {
  const p = Math.min(100, Math.round((valor / total) * 100));
  return (
    <div className="barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} aria-label={rotulo}>
      <span style={{ width: p + "%" }} />
    </div>
  );
}

export function Skeleton({ linhas = 3, altura }: { linhas?: number; altura?: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: linhas }, (_, i) => (
        <span key={i} style={altura ? { height: altura } : undefined} />
      ))}
    </div>
  );
}

export function Carregando({ texto = "Carregando" }: { texto?: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr">{texto}</span>
      <Skeleton linhas={3} altura={110} />
    </div>
  );
}

/* ---------- etapas ---------- */

export function Etapas({ nomes, atual, rotulo }: { nomes: string[]; atual: number; rotulo: string }) {
  return (
    <ol className="stepper" aria-label={rotulo}>
      {nomes.map((n, i) => {
        const num = i + 1;
        const cls = num < atual ? "feito" : num === atual ? "atual" : "";
        return (
          <li key={n} className={cls} aria-current={num === atual ? "step" : undefined}>
            <span className="nome">
              {num}. {n}
            </span>
            {num !== atual && <span className="sr">{num < atual ? " (concluída)" : " (pendente)"}</span>}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- campo de formulário ---------- */

interface CampoProps {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  opcional?: boolean;
  className?: string;
  children: (a11y: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => ReactNode;
}

export function Campo({ id, rotulo, erro, dica, opcional, className, children }: CampoProps) {
  const desc = [dica ? id + "-dica" : "", erro ? id + "-erro" : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={"campo" + (className ? " " + className : "")}>
      <label htmlFor={id}>
        {rotulo}
        {opcional && <span className="opcional"> (opcional)</span>}
      </label>
      {children({ id, "aria-invalid": Boolean(erro), "aria-describedby": desc })}
      {dica && (
        <p className="ajuda" id={id + "-dica"}>
          {dica}
        </p>
      )}
      {erro && (
        <p className="erro" id={id + "-erro"}>
          {erro}
        </p>
      )}
    </div>
  );
}

/* ---------- diálogo acessível ---------- */

interface DialogoProps {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  acoes?: ReactNode;
}

export function Dialogo({ aberto, titulo, onFechar, children, acoes }: DialogoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tituloId = useId();
  const voltarFoco = useRef<HTMLElement | null>(null);
  const fechar = useRef(onFechar);
  useEffect(() => {
    fechar.current = onFechar;
  });

  useEffect(() => {
    if (!aberto) return;
    voltarFoco.current = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focaveis = () =>
      el ? Array.from(el.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')) : [];
    (focaveis()[0] ?? el)?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        fechar.current();
      } else if (e.key === "Tab") {
        const f = focaveis();
        if (!f.length) return;
        const primeiro = f[0]!;
        const ultimo = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    };
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("keydown", tecla);
      voltarFoco.current?.focus();
    };
  }, [aberto]);

  if (!aberto) return null;
  return (
    <div className="dialogo-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="dialogo" role="dialog" aria-modal="true" aria-labelledby={tituloId} ref={ref} tabIndex={-1}>
        <div className="dialogo-topo">
          <h2 id={tituloId}>{titulo}</h2>
          <button type="button" className="icone-btn" onClick={onFechar} aria-label="Fechar">
            <Icone nome="x" />
          </button>
        </div>
        <div className="dialogo-corpo">{children}</div>
        {acoes && <div className="dialogo-acoes">{acoes}</div>}
      </div>
    </div>
  );
}
