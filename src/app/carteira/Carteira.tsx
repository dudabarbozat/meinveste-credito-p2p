"use client";

import Link from "next/link";
import { useState } from "react";
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip, type ChartOptions } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { Icone } from "@/components/Icone";
import { Carregando, Dialogo, useAviso } from "@/components/ui";
import { FORMAS, HOJE, SEGMENTOS, type Relatorio } from "@/lib/dados";
import { captado, useEstado, useHidratado } from "@/lib/estado";
import { baixarCsv, num } from "@/lib/csv";
import { cronograma } from "@/lib/financas";
import { brl, brl0, dataBr, mesAno, pct, somaMeses } from "@/lib/formato";
import { linhas, porSegmento, recebimentos, relatoriosDa, type Linha } from "./calculos";
import s from "./carteira.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const CORES_SEG = ["#8E2121", "#F34868", "#2A3950", "#974063", "#00A69D", "#FF9678"];
const corSeg = (seg: string) => CORES_SEG[Math.max(0, SEGMENTOS.indexOf(seg as (typeof SEGMENTOS)[number])) % CORES_SEG.length] ?? "#8E2121";

function Mini({ rels }: { rels: Relatorio[] }) {
  const max = Math.max(...rels.map((r) => r.faturamento));
  const w = 22, gap = 6, h = 48;
  const largura = rels.length * (w + gap) - gap;
  return (
    <svg className={s.mini} viewBox={`0 0 ${largura} ${h}`} width={largura} height={h} role="img" aria-label={`Faturamento dos últimos ${rels.length} meses`}>
      {rels.map((r, i) => {
        const bh = Math.max(3, Math.round((r.faturamento / max) * h));
        return (
          <rect key={r.periodo} x={i * (w + gap)} y={h - bh} width={w} height={bh} rx={3} className={i === rels.length - 1 ? s.ult : undefined}>
            <title>{`${mesAno(r.periodo)}: ${brl0(r.faturamento)}`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

export function Carteira() {
  const e = useEstado();
  const pronto = useHidratado();
  const avisar = useAviso();
  const [detalhe, setDetalhe] = useState<Linha | null>(null);

  if (!pronto) return <Carregando texto="Carregando sua carteira" />;

  const ls = linhas(e);
  if (!ls.length) {
    return (
      <section className="cabeca-pagina">
        <p className="sobretitulo">Carteira</p>
        <h1>Sua carteira está vazia</h1>
        <p className="lead">Escolha um negócio na vitrine para fazer o primeiro empréstimo.</p>
        <p className="acoes"><Link className="btn btn-pri" href="/vitrine/">Ir para a vitrine</Link></p>
      </section>
    );
  }

  const total = ls.reduce((t, l) => t + l.inv.valor, 0);
  const recebido = ls.reduce((t, l) => t + l.recebido, 0);
  const aReceber = ls.reduce((t, l) => t + l.aReceber, 0);
  const negocios = new Set(ls.map((l) => l.mei.id)).size;
  const meses = recebimentos(ls, 12);
  const proximos = meses.slice(0, 3);
  const seg = porSegmento(ls);
  const nomesSeg = Object.keys(seg);
  const rels = relatoriosDa(ls);

  function exportarCarteira() {
    baixarCsv(
      "meinveste-carteira.csv",
      ["negocio", "cidade", "uf", "segmento", "risco", "data", "forma_pagamento", "valor", "taxa_am", "prazo_meses", "parcela", "parcelas_pagas", "recebido", "a_receber", "status"],
      ls.map((l) => [l.mei.negocio, l.mei.cidade, l.mei.uf, l.mei.segmento, l.mei.risco, l.inv.data, FORMAS[l.inv.forma], num(l.inv.valor), num(l.mei.taxa), l.mei.prazo, num(l.parcela), l.pagas, num(l.recebido), num(l.aReceber), l.status]),
    );
    avisar(`Carteira exportada (${ls.length} linhas).`);
  }

  function exportarRelatorios() {
    const todos = rels.flatMap((r) => r.rels.map((x) => ({ ...x, negocio: r.mei.negocio })));
    baixarCsv(
      "meinveste-relatorios.csv",
      ["negocio", "periodo", "faturamento", "parcela_em_dia", "observacao"],
      todos.map((r) => [r.negocio, r.periodo, num(r.faturamento), r.emDia ? "sim" : "não", r.nota]),
    );
    avisar(`Relatórios exportados (${todos.length} linhas).`);
  }

  const opcoesBarra: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, font: { family: "Inter" } } },
      tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${brl(Number(c.parsed.y))}` } },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 6, color: "#55545A" } },
      y: { stacked: true, beginAtZero: true, grid: { color: "#E8E8EA" }, ticks: { maxTicksLimit: 5, color: "#55545A", callback: (v) => brl0(Number(v)) } },
    },
  };

  return (
    <>
      <section className="cabeca-pagina">
        <p className="sobretitulo">Painel do investidor</p>
        <h1>Minha carteira</h1>
        <p className="lead">Valores até {dataBr(HOJE)}. Previsões não descontam impostos nem atrasos.</p>
      </section>

      <dl className={s.kpis}>
        <div className={s.kpiDestaque}><dt>Total emprestado</dt><dd>{brl(total)}</dd></div>
        <div><dt>Já recebido</dt><dd>{brl(recebido)}</dd></div>
        <div><dt>A receber</dt><dd>{brl(aReceber)}</dd></div>
        <div><dt>Negócios apoiados</dt><dd>{negocios}</dd></div>
      </dl>

      <section className="secao" aria-labelledby="prox">
        <h2 id="prox">Próximos recebimentos</h2>
        <ul className={s.proximos}>
          {proximos.map((m) => (
            <li key={m.mes}>
              <span className={s.mes}><Icone nome="calendario" /> {mesAno(m.mes)}</span>
              <span className={s.valorMes}>{brl(m.confirmado)}</span>
              <span className={s.detMes}>
                {m.itens.filter((i) => i.confirmado).length} parcelas confirmadas
                {m.previsto > 0 && ` · + ${brl(m.previsto)} se as metas fecharem`}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="secao" aria-labelledby="g1">
        <div className="cartao">
          <h2 id="g1" className={s.tituloGraf}>Recebimentos nos próximos 12 meses</h2>
          <p className="ajuda">Confirmados vêm de negócios que já bateram a meta.</p>
          <div className={s.grafArea}>
            <Bar
              aria-label="Gráfico de barras com recebimentos previstos por mês"
              role="img"
              data={{
                labels: meses.map((m) => mesAno(m.mes)),
                datasets: [
                  { label: "Confirmado", data: meses.map((m) => Math.round(m.confirmado * 100) / 100), backgroundColor: "#8E2121", borderRadius: 4, stack: "s" },
                  { label: "Se a meta fechar", data: meses.map((m) => Math.round(m.previsto * 100) / 100), backgroundColor: "#FF9678", borderRadius: 4, stack: "s" },
                ],
              }}
              options={opcoesBarra}
            />
          </div>
          <table className="sr">
            <caption>Recebimentos previstos por mês</caption>
            <thead><tr><th>Mês</th><th>Confirmado</th><th>Se a meta fechar</th></tr></thead>
            <tbody>{meses.map((m) => <tr key={m.mes}><td>{mesAno(m.mes)}</td><td>{brl(m.confirmado)}</td><td>{brl(m.previsto)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="secao" aria-labelledby="g2">
        <div className="cartao">
          <h2 id="g2" className={s.tituloGraf}>Por segmento</h2>
          <div className={s.grafPizza}>
            <Doughnut
              aria-label="Gráfico de rosca com a divisão da carteira por segmento"
              role="img"
              data={{ labels: nomesSeg, datasets: [{ data: nomesSeg.map((n) => seg[n] ?? 0), backgroundColor: nomesSeg.map(corSeg), borderColor: "#FFFFFF", borderWidth: 2 }] }}
              options={{ maintainAspectRatio: false, cutout: "62%", animation: { duration: 400 }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.label}: ${brl(Number(c.parsed))}` } } } }}
            />
          </div>
          <ul className={s.legenda}>
            {nomesSeg.map((n) => (
              <li key={n}>
                <span className={s.ponto} style={{ background: corSeg(n) }} />
                {n}
                <strong>{brl0(seg[n] ?? 0)}</strong>
                <span className={s.pctSeg}>{pct(((seg[n] ?? 0) / total) * 100, 0)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="secao" aria-labelledby="invs">
        <div className="cabeca-acoes">
          <h2 id="invs">Investimentos</h2>
          <button type="button" className="link-btn" onClick={exportarCarteira}><Icone nome="baixar" /> Exportar CSV</button>
        </div>
        <ul className={s.listaInv}>
          {ls.map((l) => (
            <li key={l.inv.id}>
              <button type="button" className={s.inv} onClick={() => setDetalhe(l)} aria-haspopup="dialog">
                <span className={s.invTopo}><strong>{l.mei.negocio}</strong><span>{brl(l.inv.valor)}</span></span>
                <span className={s.invLinha}>
                  <span className={l.batida ? s.ativa : s.capt}>{l.status}</span>
                  <span>{l.batida ? `${l.pagas} de ${l.mei.prazo} parcelas` : `${Math.round((captado(e, l.mei) / l.mei.meta) * 100)}% captado`}</span>
                </span>
                <span className={s.invLinha + " " + s.invSub}>
                  <span>{dataBr(l.inv.data)} · {FORMAS[l.inv.forma]}</span>
                  <span>Parcela {brl(l.parcela)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="secao" aria-labelledby="rels">
        <div className="cabeca-acoes">
          <h2 id="rels">Relatórios dos negócios</h2>
          {rels.some((r) => r.rels.length) && (
            <button type="button" className="link-btn" onClick={exportarRelatorios}><Icone nome="baixar" /> Exportar CSV</button>
          )}
        </div>
        <p className="ajuda">Quem bate a meta envia um relatório por mês: faturamento, pagamento da parcela e o que mudou.</p>
        {rels.length === 0 ? (
          <p className={s.vazio}>Nenhum negócio da sua carteira bateu a meta ainda.</p>
        ) : (
          <ul className={s.relatorios}>
            {rels.map(({ mei, rels: rs }) => {
              if (!rs.length)
                return (
                  <li key={mei.id} className={s.rel}>
                    <h3>{mei.negocio}</h3>
                    <p className="ajuda">Meta batida recentemente. O primeiro relatório chega junto com a primeira parcela.</p>
                  </li>
                );
              const ult = rs[rs.length - 1]!;
              const ant = rs[rs.length - 2];
              const varia = ant ? ((ult.faturamento - ant.faturamento) / ant.faturamento) * 100 : 0;
              return (
                <li key={mei.id} className={s.rel}>
                  <div className={s.relTopo}>
                    <div>
                      <h3>{mei.negocio}</h3>
                      <p className="meta-linha">{mei.cidade} / {mei.uf} · {mei.segmento}</p>
                    </div>
                    <span className={"status-pill " + (ult.emDia ? "aprovado" : "alerta")}>{ult.emDia ? "Parcelas em dia" : "Atraso regularizado"}</span>
                  </div>
                  <div className={s.relMeio}>
                    <Mini rels={rs} />
                    <div className={s.relNum}>
                      <span>Faturamento em {mesAno(ult.periodo)}</span>
                      <strong>{brl0(ult.faturamento)}</strong>
                      {ant && <span className={varia >= 0 ? s.sobe : s.desce}>{varia >= 0 ? "+" : ""}{pct(varia)} no mês</span>}
                    </div>
                  </div>
                  <blockquote>{ult.nota}</blockquote>
                  <details>
                    <summary>Todos os relatórios ({rs.length})</summary>
                    <ul className={s.relLista}>
                      {rs.slice().reverse().map((r) => (
                        <li key={r.periodo}><span className={s.relMes}>{mesAno(r.periodo)}</span><span className={s.relFat}>{brl0(r.faturamento)}</span><span className={s.relNota}>{r.nota}</span></li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialogo
        aberto={detalhe !== null}
        titulo={detalhe?.mei.negocio ?? ""}
        onFechar={() => setDetalhe(null)}
        acoes={
          detalhe && (
            <>
              <Link className="btn btn-sec" href={`/negocio/?id=${encodeURIComponent(detalhe.mei.id)}`}>Ver negócio</Link>
              <button type="button" className="btn btn-pri" onClick={() => setDetalhe(null)}>Fechar</button>
            </>
          )
        }
      >
        {detalhe && (
          <>
            <dl className="linhas">
              <div><dt>Emprestado</dt><dd>{brl(detalhe.inv.valor)} em {dataBr(detalhe.inv.data)}</dd></div>
              <div><dt>Situação</dt><dd>{detalhe.status}</dd></div>
              <div><dt>Recebido</dt><dd>{brl(detalhe.recebido)}</dd></div>
              <div><dt>A receber</dt><dd>{brl(detalhe.aReceber)}</dd></div>
              {detalhe.inv.recibo && <div><dt>Recibo</dt><dd>{detalhe.inv.recibo}</dd></div>}
            </dl>
            <div className="tabela-rolagem" tabIndex={0} role="region" aria-label="Cronograma do investimento">
              <table className="tabela">
                <thead><tr><th scope="col">Nº</th><th scope="col">Mês</th><th scope="col">Parcela</th><th scope="col">Situação</th></tr></thead>
                <tbody>
                  {cronograma(detalhe.inv.valor, detalhe.mei.taxa, detalhe.mei.prazo).map((c) => {
                    const paga = c.n <= detalhe.pagas;
                    const mes = paga ? somaMeses(HOJE, c.n - detalhe.pagas) : somaMeses(HOJE, c.n - detalhe.pagas + detalhe.inicio - 1);
                    return (
                      <tr key={c.n}>
                        <td>{c.n}</td>
                        <td>{mesAno(mes)}</td>
                        <td>{brl(c.parcela)}</td>
                        <td>{paga ? "Paga" : detalhe.batida ? "A receber" : "Prevista"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Dialogo>
    </>
  );
}
