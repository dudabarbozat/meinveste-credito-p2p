"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icone } from "@/components/Icone";
import { SeloDemo } from "@/components/ui";
import { atualizar, cadastroVazio, type Cadastro } from "@/lib/estado";
import { parecerPelaRegra, type Parecer } from "@/lib/financas";
import { brl, brl0, dataBr, hojeLocal, pct } from "@/lib/formato";
import { EMPRESA_EXEMPLO, segmentoPorCnae } from "./regras";
import s from "./cadastro.module.css";

const PASSOS: [string, string][] = [
  ["Pedido recebido", "Dados, CNPJ e documentos chegaram completos."],
  ["Documentos conferidos", "Faturamento declarado bate com os extratos."],
  ["Avalista verificado", "Renda e vínculo do avalista confirmados."],
  ["Análise de risco", "Parcela x faturamento, tempo e situação do CNPJ, atividade e avalista."],
  ["Parecer", "Classe de risco, taxa e meta aprovada."],
];

export function Analise({ cad }: { cad: Cadastro }) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [animar, setAnimar] = useState(false);
  const resultadoRef = useRef<HTMLHeadingElement>(null);
  const c = cad.campos;
  const aprovado = cad.status === "aprovado" && cad.parecer;
  const feitos = aprovado ? PASSOS.length : carregando ? 4 : 1;

  const dados = {
    faturamento: Number(c.faturamento) || 1,
    meta: Number(c.meta) || 0,
    prazo: Number(c.prazo) || 12,
    desde: Number(c.desde) || 2026,
  };

  function concluir(p: Parecer) {
    atualizar((e) => ({ ...e, cadastro: { ...e.cadastro, status: "aprovado", parecer: p } }));
    setAnimar(true);
    requestAnimationFrame(() => resultadoRef.current?.focus());
  }

  const emp = cad.empresa;
  const empresaReal = Boolean(emp && emp !== EMPRESA_EXEMPLO && !emp.razaoSocial.includes("fictícios"));

  function gerar() {
    setCarregando(true);
    const p = parecerPelaRegra(dados, {
      abertura: emp?.abertura || undefined,
      situacao: emp?.situacao || undefined,
      cnae: emp?.cnae || undefined,
      atividade: emp?.atividade || undefined,
      segmentoInformado: c.segmento,
      segmentoDaAtividade: emp?.atividade ? segmentoPorCnae(emp.atividade) : undefined,
      rendaAvalista: c.avRenda ? Number(c.avRenda) : undefined,
      hoje: hojeLocal(),
      fonteCnpj: empresaReal,
    });
    /* pausa curta só para a linha do tempo ser percebida; o cálculo é imediato */
    const atraso = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;
    setTimeout(() => {
      setCarregando(false);
      concluir(p);
    }, atraso);
  }

  function publicar() {
    if (!cad.parecer) return;
    const p = cad.parecer;
    const id = "novo-" + Date.now().toString(36);
    atualizar((e) => ({
      ...e,
      meisNovos: [
        ...e.meisNovos,
        {
          id, novo: true, negocio: c.negocio ?? "", dono: c.dono ?? "", cidade: (c.cidade ?? "").trim(), uf: c.uf ?? "",
          segmento: c.segmento ?? "Serviços", desde: Number(c.desde) || 2026, resumo: c.resumo ?? "",
          descricao: c.descricao || c.resumo || "", finalidade: c.finalidade ?? "",
          meta: p.metaRecomendada, captadoBase: 0, investidoresBase: 0, taxa: p.taxa, prazo: Number(c.prazo) || 12, risco: p.classe,
          faturamento: Number(c.faturamento) || 0, avalista: `${c.avRelacao ?? ""}, ${(c.avOcupacao ?? "").toLowerCase()}`,
        },
      ],
      cadastro: { ...e.cadastro, publicadoId: id },
    }));
    router.push(`/negocio/?id=${id}`);
  }

  const p = cad.parecer;

  return (
    <>
      <section className="cabeca-pagina">
        <p className="sobretitulo">Sou MEI</p>
        <h1>{c.negocio}</h1>
        <p className="lead">
          Pedido de {brl0(Number(c.meta) || 0)} em {c.prazo} meses{cad.enviadoEm ? `, enviado em ${dataBr(cad.enviadoEm)}` : ""}.
        </p>
        <p style={{ marginTop: 12 }}>
          <span className={"status-pill " + (aprovado ? "aprovado" : "analise")} role="status">
            <Icone nome={aprovado ? "check" : "relogio"} />
            {aprovado ? "Aprovado" : carregando ? "Gerando parecer" : "Em análise"}
          </span>
        </p>
      </section>

      <div className={"cartao " + s.cartaoForm}>
        <ol className={s.linhaTempo + (animar ? " " + s.animar : "")}>
          {PASSOS.map(([t, d], i) => {
            const feito = i < feitos;
            const atual = i === feitos;
            return (
              <li key={t} className={feito ? s.feito : atual ? s.atual : ""} style={{ ["--i" as string]: i }}>
                <span className={s.ltIc}><Icone nome={feito ? "check" : "relogio"} /></span>
                <div>
                  <strong>{t}</strong>
                  <span>{d}</span>
                </div>
              </li>
            );
          })}
        </ol>

        {!aprovado && (
          <div className={s.gerar}>
            <p className="caixa-info">
              <Icone nome="escudo" />
              <span>
                O parecer cruza o peso da parcela no faturamento com {empresaReal ? "os dados públicos do seu CNPJ (data de abertura, situação cadastral e atividade)" : "o tempo de negócio informado"} e a renda do avalista. A taxa sai da tabela da plataforma para a classe de risco.
              </span>
            </p>

            {carregando && (
              <div role="status" aria-live="polite">
                <span className="sr">Analisando o pedido</span>
                <div className="skeleton" aria-hidden="true"><span style={{ height: 22, width: "50%" }} /><span /><span /><span style={{ width: "70%" }} /></div>
              </div>
            )}

            <button type="button" className="btn btn-pri btn-largo" onClick={gerar} disabled={carregando}>
              <Icone nome="escudo" />
              {carregando ? "Analisando…" : "Gerar parecer"}
            </button>
            <p className="ajuda" style={{ textAlign: "center" }}>
              Num produto real, a análise leva alguns dias úteis e passa por pessoas do time.
            </p>
          </div>
        )}

        {aprovado && p && (
          <div className={s.resultado + (animar ? " " + s.animarRes : "")}>
            <div className={s.resTopo}>
              <p className="sobretitulo">Parecer</p>
              <SeloDemo texto={p.fonteCnpj ? "regras + dados públicos do CNPJ" : "análise simulada por regras"} />
            </div>
            <h2 tabIndex={-1} ref={resultadoRef}>{p.condicionado ? "Aprovado com condição" : `Aprovado${p.ajustada ? " com meta ajustada" : ""}`}</h2>
            <dl className="numeros">
              <div><dt>Meta aprovada</dt><dd>{brl0(p.metaRecomendada)}</dd></div>
              <div><dt>Classe de risco</dt><dd>{p.classe}</dd></div>
              <div><dt>Taxa</dt><dd>{pct(p.taxa)} <small>ao mês</small></dd></div>
              <div><dt>Parcela</dt><dd>{brl(p.parcela)}</dd></div>
            </dl>
            <p className="ajuda">A parcela representa {pct(p.comprometimento * 100, 0)} do faturamento médio informado.</p>

            {p.pontosFortes.length > 0 && (
              <div>
                <h3 className={s.subtit}>Pontos fortes</h3>
                <ul className={s.pontos + " " + s.fortes}>
                  {p.pontosFortes.map((t) => <li key={t}><Icone nome="check" />{t}</li>)}
                </ul>
              </div>
            )}
            {p.pontosAtencao.length > 0 && (
              <div>
                <h3 className={s.subtit}>Pontos de atenção</h3>
                <ul className={s.pontos + " " + s.atencao}>
                  {p.pontosAtencao.map((t) => <li key={t}><Icone nome="alerta" />{t}</li>)}
                </ul>
              </div>
            )}
            <p className="caixa-info">
              <Icone nome="info" />
              <span><strong>Recomendação:</strong> {p.recomendacao}</span>
            </p>
            <p className="ajuda">A taxa vem da tabela da plataforma para a classe {p.classe}, e a meta nunca deixa a parcela passar de 35% do faturamento.</p>

            {cad.publicadoId ? (
              <div className="acoes-col">
                <Link className="btn btn-pri btn-largo" href={`/negocio/?id=${cad.publicadoId}`}>
                  Ver meu negócio na vitrine <Icone nome="seta" />
                </Link>
                <button type="button" className="btn btn-sec btn-largo" onClick={() => atualizar((e) => ({ ...e, cadastro: cadastroVazio() }))}>
                  Começar novo cadastro
                </button>
              </div>
            ) : (
              <div className="acoes-col">
                <button type="button" className="btn btn-pri btn-largo" onClick={publicar}>
                  Publicar na vitrine <Icone nome="seta" />
                </button>
                <p className="ajuda" style={{ textAlign: "center" }}>
                  Ao bater a meta, você recebe o valor e passa a enviar um relatório curto por mês aos investidores.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
