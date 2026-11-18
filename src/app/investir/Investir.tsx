"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Icone } from "@/components/Icone";
import { Carregando, Etapas, SeloDemo, useAviso } from "@/components/ui";
import { useTaxas } from "@/components/useTaxas";
import { FORMAS, type Forma, type Investimento } from "@/lib/dados";
import { acharMei, captado, investir, metaBatida, useEstado, useHidratado } from "@/lib/estado";
import { baixarCsv, num } from "@/lib/csv";
import { cronograma, mensalParaAnual, parcela } from "@/lib/financas";
import { brl, brl0, dataBr, hojeLocal, mesAno, pct, somaMeses } from "@/lib/formato";
import s from "./investir.module.css";

const ETAPAS = ["Valor", "Pagamento", "Confirmar", "Recibo"];
const ICONE_FORMA: Record<Forma, "cartao" | "boleto"> = { credito: "cartao", debito: "cartao", boleto: "boleto" };

export function Investir() {
  const id = useSearchParams().get("id") ?? "";
  const e = useEstado();
  const pronto = useHidratado();
  const taxas = useTaxas();
  const avisar = useAviso();
  const m = acharMei(e, id);

  const [etapa, setEtapa] = useState(1);
  const [valorTxt, setValorTxt] = useState("500");
  const [forma, setForma] = useState<Forma>("credito");
  const [ciente, setCiente] = useState(false);
  const [erro, setErro] = useState("");
  const [recibo, setRecibo] = useState<{ inv: Investimento; bateu: boolean; quando: string } | null>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  if (!pronto) return <Carregando texto="Carregando" />;
  if (!m) {
    return (
      <section className="cabeca-pagina">
        <h1>Negócio não encontrado</h1>
        <p className="acoes"><Link className="btn btn-pri" href="/vitrine/">Ir para a vitrine</Link></p>
      </section>
    );
  }

  const resta = Math.max(0, m.meta - captado(e, m));
  if (resta <= 0 && !recibo) {
    return (
      <section className="cabeca-pagina">
        <h1>Captação encerrada</h1>
        <p className="lead">{m.negocio} já bateu a meta.</p>
        <p className="acoes"><Link className="btn btn-pri" href="/vitrine/">Ver outros negócios</Link></p>
      </section>
    );
  }

  const valor = Math.round(Number(valorTxt.replace(",", ".")) * 100) / 100;
  const valido = valor >= 50 && valor <= (recibo ? Infinity : resta);
  const p = valido ? parcela(valor, m.taxa, m.prazo) : 0;
  const total = p * m.prazo;
  const anual = mensalParaAnual(m.taxa);
  const sugestoes = [100, 250, 500, 1000].filter((v) => v <= resta);
  /* previsão: meta fecha neste mês, primeira parcela no mês seguinte ao repasse */
  const hojeIso = hojeLocal();
  const linhas = valido ? cronograma(valor, m.taxa, m.prazo) : [];

  function ir(n: number) {
    setErro("");
    setEtapa(n);
    requestAnimationFrame(() => tituloRef.current?.focus());
  }

  function avancarValor() {
    if (!(valor >= 50)) return setErro("O valor mínimo é R$ 50.");
    if (valor > resta) return setErro(`O valor passa do que falta para a meta (${brl(resta)}).`);
    ir(2);
  }

  function confirmar() {
    if (!ciente) return setErro("Confirme que entendeu o risco do empréstimo.");
    if (!m) return;
    const inv = investir(m.id, valor, forma);
    const quando = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    setRecibo({ inv, bateu: metaBatida({ ...e, investimentos: [...e.investimentos, inv] }, m), quando });
    ir(4);
    avisar("Investimento registrado.");
  }

  function baixarCronograma() {
    if (!m || !recibo) return;
    baixarCsv(
      `meinveste-cronograma-${recibo.inv.recibo ?? recibo.inv.id}.csv`,
      ["parcela", "mes_previsto", "valor", "juros", "amortizacao", "saldo"],
      cronograma(recibo.inv.valor, m.taxa, m.prazo).map((l) => [l.n, somaMeses(recibo.inv.data, l.n + 1), num(l.parcela), num(l.juros), num(l.amortizacao), num(l.saldo)]),
    );
  }

  return (
    <>
      {etapa < 4 && (
        <Link className={s.voltar} href={`/negocio/?id=${encodeURIComponent(m.id)}`}><Icone nome="voltar" /> {m.negocio}</Link>
      )}
      <section className="cabeca-pagina">
        <p className="sobretitulo">Investir</p>
        <h1>{etapa === 4 ? "Pronto, investimento feito" : `Emprestar para ${m.negocio}`}</h1>
      </section>

      <div className={"cartao " + s.cartao}>
        <Etapas nomes={ETAPAS} atual={etapa} rotulo="Etapas do investimento" />

        {etapa === 1 && (
          <form className={s.etapa} noValidate onSubmit={(ev) => { ev.preventDefault(); avancarValor(); }}>
            <h2 tabIndex={-1} ref={tituloRef}>Quanto você quer emprestar?</h2>
            <div className="campo">
              <label htmlFor="valor">Valor</label>
              <div className="entrada-moeda">
                <span aria-hidden="true">R$</span>
                <input
                  id="valor" type="number" inputMode="decimal" min={50} max={resta} step={10} value={valorTxt}
                  onChange={(ev) => { setValorTxt(ev.target.value); setErro(""); }}
                  aria-invalid={Boolean(erro)} aria-describedby={"valor-dica" + (erro ? " valor-erro" : "")}
                />
              </div>
              <p className="ajuda" id="valor-dica">Mínimo R$ 50. Faltam {brl(resta)} para a meta.</p>
              {erro && <p className="erro" id="valor-erro" role="alert">{erro}</p>}
              <div className="chips" role="group" aria-label="Valores rápidos">
                {sugestoes.map((v) => (
                  <button key={v} type="button" className="chip" aria-pressed={valor === v} onClick={() => setValorTxt(String(v))}>{brl0(v)}</button>
                ))}
                {resta < 1000 && <button type="button" className="chip" aria-pressed={valor === resta} onClick={() => setValorTxt(String(resta))}>O que falta</button>}
              </div>
            </div>

            {valido && (
              <dl className={"linhas " + s.simulacao} aria-live="polite">
                <div><dt>Você recebe por mês</dt><dd>{brl(p)}</dd></div>
                <div><dt>Total em {m.prazo} meses</dt><dd>{brl(total)}</dd></div>
                <div><dt>Juros no período</dt><dd>{brl(total - valor)}</dd></div>
                <div><dt>Retorno equivalente</dt><dd>{pct(anual)} a.a.</dd></div>
                <div>
                  <dt>CDI {taxas.aoVivo ? "hoje" : "(referência)"}</dt>
                  <dd>{taxas.status === "carregando" ? "…" : `${pct(taxas.taxas.cdi, 2)} a.a.`}</dd>
                </div>
              </dl>
            )}
            <p className="ajuda">Previsão bruta, sem impostos e sem considerar atrasos. Risco {m.risco}: espalhe seu dinheiro entre vários negócios.</p>
            <button type="submit" className="btn btn-pri btn-largo">Continuar <Icone nome="seta" /></button>
          </form>
        )}

        {etapa === 2 && (
          <form className={s.etapa} onSubmit={(ev) => { ev.preventDefault(); ir(3); }}>
            <h2 tabIndex={-1} ref={tituloRef}>Como você vai pagar?</h2>
            <fieldset className="campo">
              <legend className="sr">Forma de pagamento</legend>
              <div className={s.formas}>
                {(Object.keys(FORMAS) as Forma[]).map((f) => (
                  <label key={f} className={s.forma}>
                    <input type="radio" name="forma" value={f} checked={forma === f} onChange={() => setForma(f)} />
                    <span>
                      <Icone nome={ICONE_FORMA[f]} />
                      {FORMAS[f]}
                      <small>{f === "boleto" ? "Compensa em até 3 dias úteis" : "Confirmação na hora"}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="caixa-info">
              <Icone nome="info" />
              <span>Nesta demo nenhum dado de cartão é pedido e nada é cobrado. <SeloDemo texto="pagamento simulado" /></span>
            </p>
            <div className="form-acoes">
              <button type="button" className="btn btn-sec" onClick={() => ir(1)}><Icone nome="voltar" /> Voltar</button>
              <button type="submit" className="btn btn-pri">Revisar <Icone nome="seta" /></button>
            </div>
          </form>
        )}

        {etapa === 3 && (
          <form className={s.etapa} noValidate onSubmit={(ev) => { ev.preventDefault(); confirmar(); }}>
            <h2 tabIndex={-1} ref={tituloRef}>Confira antes de confirmar</h2>
            <dl className="linhas">
              <div><dt>Negócio</dt><dd>{m.negocio}</dd></div>
              <div><dt>Valor</dt><dd>{brl(valor)}</dd></div>
              <div><dt>Pagamento</dt><dd>{FORMAS[forma]}</dd></div>
              <div><dt>Taxa</dt><dd>{pct(m.taxa)} a.m. · risco {m.risco}</dd></div>
              <div><dt>Você recebe</dt><dd>{m.prazo}x {brl(p)}</dd></div>
            </dl>
            <details className={s.cronograma} open>
              <summary>Cronograma de recebimentos</summary>
              <p className="ajuda">Meses previstos se a meta fechar neste mês. A primeira parcela vem no mês seguinte ao repasse.</p>
              <div className="tabela-rolagem" tabIndex={0} role="region" aria-label="Cronograma de recebimentos">
                <table className="tabela">
                  <thead><tr><th scope="col">Nº</th><th scope="col">Mês</th><th scope="col">Parcela</th><th scope="col">Juros</th><th scope="col">Saldo</th></tr></thead>
                  <tbody>
                    {linhas.map((l) => (
                      <tr key={l.n}><td>{l.n}</td><td>{mesAno(somaMeses(hojeIso, l.n + 1))}</td><td>{brl(l.parcela)}</td><td>{brl(l.juros)}</td><td>{brl(l.saldo)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            <label className="checa">
              <input type="checkbox" checked={ciente} onChange={(ev) => { setCiente(ev.target.checked); setErro(""); }} aria-describedby={erro ? "ciente-erro" : undefined} />
              Entendo que é um empréstimo, sem garantia de bens, e que posso não receber se o negócio deixar de pagar.
            </label>
            {erro && <p className="erro" id="ciente-erro" role="alert">{erro}</p>}
            <div className="form-acoes">
              <button type="button" className="btn btn-sec" onClick={() => ir(2)}><Icone nome="voltar" /> Voltar</button>
              <button type="submit" className="btn btn-pri">Confirmar {brl0(valor)}</button>
            </div>
          </form>
        )}

        {etapa === 4 && recibo && (
          <div className={s.etapa}>
            <div className={s.ok}><Icone nome="check" /></div>
            <h2 tabIndex={-1} ref={tituloRef} className={s.centro}>Recibo {recibo.inv.recibo}</h2>
            {recibo.bateu && <p className={s.destaque}>Com o seu aporte, {m.negocio} bateu a meta.</p>}
            <dl className="linhas">
              <div><dt>Data</dt><dd>{recibo.quando}</dd></div>
              <div><dt>Negócio</dt><dd>{m.negocio}</dd></div>
              <div><dt>Valor emprestado</dt><dd>{brl(recibo.inv.valor)}</dd></div>
              <div><dt>Pagamento</dt><dd>{FORMAS[recibo.inv.forma]}</dd></div>
              <div><dt>Recebimentos</dt><dd>{m.prazo}x {brl(parcela(recibo.inv.valor, m.taxa, m.prazo))}</dd></div>
              <div><dt>Primeira parcela</dt><dd>{mesAno(somaMeses(recibo.inv.data, 2))} (prevista)</dd></div>
            </dl>
            {recibo.inv.forma === "boleto" && (
              <p className="ajuda">Num produto real, o boleto seria gerado aqui e o valor ficaria reservado até a compensação. Na demo ele é dado como pago.</p>
            )}
            <p className={s.centro}><SeloDemo texto="pagamento simulado" /></p>
            <div className="acoes-col nao-imprimir">
              <Link className="btn btn-pri btn-largo" href="/carteira/">Ver minha carteira</Link>
              <div className={s.acoesSec}>
                <button type="button" className="btn btn-sec" onClick={() => window.print()}><Icone nome="impressora" /> Imprimir</button>
                <button type="button" className="btn btn-sec" onClick={baixarCronograma}><Icone nome="baixar" /> Cronograma</button>
              </div>
            </div>
            <p className="ajuda">Emitido em {dataBr(recibo.inv.data)} · MEInveste (protótipo)</p>
          </div>
        )}
      </div>
    </>
  );
}
