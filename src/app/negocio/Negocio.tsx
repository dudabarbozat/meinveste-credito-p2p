"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Icone } from "@/components/Icone";
import { Barra, Carregando } from "@/components/ui";
import { useTaxas } from "@/components/useTaxas";
import { RELATORIOS, RISCO_TXT } from "@/lib/dados";
import { acharMei, captado, investidores, useEstado, useHidratado } from "@/lib/estado";
import { mensalParaAnual, parcela } from "@/lib/financas";
import { brl, brl0, mesAno, pct } from "@/lib/formato";
import s from "./negocio.module.css";

export function Negocio() {
  const id = useSearchParams().get("id") ?? "";
  const e = useEstado();
  const pronto = useHidratado();
  const taxas = useTaxas();
  const m = acharMei(e, id);

  useEffect(() => {
    if (m) document.title = `${m.negocio} · MEInveste`;
  }, [m]);

  if (!pronto) return <Carregando texto="Carregando negócio" />;
  if (!m) {
    return (
      <section className="cabeca-pagina">
        <h1>Negócio não encontrado</h1>
        <p className="lead">O link pode estar errado ou o negócio foi removido ao restaurar os dados de exemplo.</p>
        <p className="acoes"><Link className="btn btn-pri" href="/vitrine/">Ir para a vitrine</Link></p>
      </section>
    );
  }

  const cap = captado(e, m);
  const resta = Math.max(0, m.meta - cap);
  const anual = mensalParaAnual(m.taxa);
  const cdi = taxas.taxas.cdi;
  const rels = RELATORIOS.filter((r) => r.meiId === m.id).sort((a, b) => a.periodo.localeCompare(b.periodo));
  const ult = rels[rels.length - 1];

  return (
    <>
      <Link className={s.voltar} href="/vitrine/"><Icone nome="voltar" /> Vitrine</Link>
      <article>
        <div className={s.tags}>
          <span className="tag">{m.segmento}</span>
          <span className={`risco risco-${m.risco}`}>Risco {m.risco}</span>
          {m.novo && <span className="tag tag-novo">Cadastrado por você</span>}
        </div>
        <h1 className={s.titulo}>{m.negocio}</h1>
        <p className="meta-linha">
          <Icone nome="pin" /> {m.cidade} / {m.uf} · {m.dono} · MEI desde {m.desde}
        </p>

        <div className={s.capt}>
          <Barra valor={cap} total={m.meta} rotulo={`Captação de ${m.negocio}`} />
          <p>
            <strong>{brl0(cap)}</strong> de {brl0(m.meta)} · {investidores(e, m)} investidores
          </p>
        </div>

        <dl className="numeros">
          <div><dt>Taxa</dt><dd>{pct(m.taxa)} <small>ao mês</small></dd></div>
          <div><dt>Prazo</dt><dd>{m.prazo} <small>parcelas</small></dd></div>
          <div><dt>Faturamento médio</dt><dd>{brl0(m.faturamento)}<small>/mês</small></dd></div>
          <div><dt>A cada R$ 100</dt><dd>{brl(parcela(100, m.taxa, m.prazo))}<small>/mês</small></dd></div>
        </dl>

        <section className={s.comparacao} aria-labelledby="rr">
          <h2 id="rr">Risco e retorno</h2>
          <div className={s.barrasComp} role="img" aria-label={`Retorno de ${pct(anual)} ao ano contra CDI de ${pct(cdi, 2)} ao ano`}>
            <div>
              <span className={s.rotComp}>Este negócio</span>
              <span className={s.trilho}><span className={s.valNeg} style={{ width: `${Math.min(100, (anual / Math.max(anual, cdi)) * 100)}%` }} /></span>
              <strong>{pct(anual)} a.a.</strong>
            </div>
            <div>
              <span className={s.rotComp}>CDI {taxas.aoVivo ? "hoje" : "(ref.)"}</span>
              <span className={s.trilho}><span className={s.valCdi} style={{ width: `${Math.min(100, (cdi / Math.max(anual, cdi)) * 100)}%` }} /></span>
              <strong>{pct(cdi, 2)} a.a.</strong>
            </div>
          </div>
          <p className="ajuda">
            {RISCO_TXT[m.risco]} O retorno é bruto e não tem garantia: se o negócio atrasar, o avalista é acionado.
            {taxas.aoVivo ? " CDI via BrasilAPI." : taxas.status === "erro" ? " CDI de referência (BrasilAPI indisponível)." : ""}
          </p>
        </section>

        <h2 className={s.h2}>Sobre o negócio</h2>
        <p>{m.descricao}</p>
        <h2 className={s.h2}>Para que é o dinheiro</h2>
        <p>{m.finalidade}</p>
        <h2 className={s.h2}>Análise</h2>
        <ul className={s.verificados}>
          <li><Icone nome="check" /> Documentos financeiros conferidos</li>
          <li><Icone nome="escudo" /> Avalista: {m.avalista}</li>
          <li><Icone nome="info" /> Sem garantia de imóvel ou veículo</li>
        </ul>

        {ult && (
          <>
            <h2 className={s.h2}>Último relatório</h2>
            <div className={s.relatorio}>
              <p className="ajuda">{mesAno(ult.periodo)} · faturamento {brl0(ult.faturamento)} · {ult.emDia ? "parcela em dia" : "atraso regularizado"}</p>
              <blockquote>{ult.nota}</blockquote>
            </div>
          </>
        )}
      </article>

      <div className={s.cta}>
        {resta > 0 ? (
          <>
            <p className="ajuda">Faltam <strong>{brl0(resta)}</strong> para a meta. Mínimo R$ 50.</p>
            <Link className="btn btn-pri btn-largo" href={`/investir/?id=${encodeURIComponent(m.id)}`}>
              Investir neste negócio <Icone nome="seta" />
            </Link>
          </>
        ) : (
          <p className={s.encerrado}><Icone nome="check" /> Meta atingida. A captação foi encerrada e o negócio já paga as parcelas.</p>
        )}
      </div>
    </>
  );
}
