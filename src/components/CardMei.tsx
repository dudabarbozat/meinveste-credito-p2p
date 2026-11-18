"use client";

import Link from "next/link";
import type { Mei } from "@/lib/dados";
import { captado, investidores, type Estado } from "@/lib/estado";
import { mensalParaAnual } from "@/lib/financas";
import { brl0, pct } from "@/lib/formato";
import { Icone } from "./Icone";
import { Barra } from "./ui";
import s from "./CardMei.module.css";

export function CardMei({ e, m, cdi, compacto }: { e: Estado; m: Mei; cdi?: number; compacto?: boolean }) {
  const cap = captado(e, m);
  const batida = cap >= m.meta;
  const p = Math.min(100, Math.round((cap / m.meta) * 100));
  const anual = mensalParaAnual(m.taxa);
  return (
    <Link className={s.card} href={`/negocio/?id=${encodeURIComponent(m.id)}`}>
      <div className={s.topo}>
        <span className="tag">{m.segmento}</span>
        <span className={`risco risco-${m.risco}`}>Risco {m.risco}</span>
        {m.novo && <span className="tag tag-novo">Seu negócio</span>}
      </div>
      <h3 className={s.nome}>{m.negocio}</h3>
      <p className="meta-linha">
        <Icone nome="pin" />
        {m.cidade} / {m.uf}
        {!compacto && <> · desde {m.desde}</>}
      </p>
      {!compacto && <p className={s.resumo}>{m.resumo}</p>}
      <div className={s.capt}>
        <Barra valor={cap} total={m.meta} rotulo={`Captação de ${m.negocio}`} />
        <p className={s.captNum}>
          <strong>{brl0(cap)}</strong> de {brl0(m.meta)}
          <span className={batida ? s.ok : ""}>{batida ? "Meta batida" : compacto ? `faltam ${brl0(m.meta - cap)}` : `${p}%`}</span>
        </p>
      </div>
      {!compacto && (
        <dl className={s.dados}>
          <div>
            <dt>Taxa</dt>
            <dd>{pct(m.taxa)} a.m.</dd>
          </div>
          <div>
            <dt>Prazo</dt>
            <dd>{m.prazo} meses</dd>
          </div>
          <div>
            <dt>Investidores</dt>
            <dd>{investidores(e, m)}</dd>
          </div>
        </dl>
      )}
      {!compacto && cdi !== undefined && (
        <p className={s.vsCdi}>
          ≈ {pct(anual)} ao ano, {pct(Math.abs(anual - cdi))} {anual >= cdi ? "acima" : "abaixo"} do CDI ({pct(cdi, 2)})
        </p>
      )}
    </Link>
  );
}
