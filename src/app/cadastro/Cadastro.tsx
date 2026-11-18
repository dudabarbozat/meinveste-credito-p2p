"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Icone } from "@/components/Icone";
import { Campo, Carregando, Etapas, SeloDemo, useAviso } from "@/components/ui";
import { consultarCep, consultarCnpj, ErroApi, type Endereco } from "@/lib/brasilapi";
import { SEGMENTOS } from "@/lib/dados";
import { atualizar, useEstado, useHidratado, type Cadastro as TCadastro } from "@/lib/estado";
import { previa } from "@/lib/financas";
import { hojeLocal, brl, brl0, dataBr, mascaraCep, mascaraCnpj, mascaraCpf, mascaraTelefone, pct, soDigitos, tamanhoArquivo, cnpjValido } from "@/lib/formato";
import { Analise } from "./Analise";
import { CAMPOS_EXEMPLO, DOCS, EMPRESA_EXEMPLO, ETAPAS, RELACOES, UFS, segmentoPorCnae, validarEtapa, type Erros } from "./regras";
import s from "./cadastro.module.css";

const TITULOS = ["Comece pelo CNPJ", "Sobre o negócio", "O que você precisa", "Documentos financeiros", "Quem é seu avalista", "Revise e envie"];

function mudarCad(fn: (c: TCadastro) => TCadastro) {
  atualizar((e) => ({ ...e, cadastro: fn(e.cadastro) }));
}

function setCampo(k: string, v: string) {
  mudarCad((c) => ({ ...c, campos: { ...c.campos, [k]: v } }));
}

export function Cadastro() {
  const e = useEstado();
  const pronto = useHidratado();
  if (!pronto) return <Carregando texto="Carregando seu cadastro" />;
  return e.cadastro.status === "rascunho" ? <Formulario cad={e.cadastro} /> : <Analise cad={e.cadastro} />;
}

/* ---------------- formulário em etapas ---------------- */

function Formulario({ cad }: { cad: TCadastro }) {
  const [erros, setErros] = useState<Erros>({});
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const avisar = useAviso();
  const n = cad.etapa;
  const c = cad.campos;

  function irPara(etapa: number) {
    setErros({});
    mudarCad((x) => ({ ...x, etapa }));
    requestAnimationFrame(() => tituloRef.current?.focus());
  }

  function avancar(ev: React.FormEvent) {
    ev.preventDefault();
    if (n < 6) {
      const er = validarEtapa(n, c, cad.docs, cad.empresa);
      setErros(er);
      const primeiro = Object.keys(er)[0];
      if (primeiro) {
        document.getElementById(primeiro === "docs" ? "docs-lista" : primeiro)?.focus();
        return;
      }
      irPara(n + 1);
      return;
    }
    for (let i = 1; i <= 5; i++) {
      const er = validarEtapa(i, c, cad.docs, cad.empresa);
      if (Object.keys(er).length) {
        irPara(i);
        setErros(er);
        return;
      }
    }
    mudarCad((x) => ({ ...x, status: "em_analise", enviadoEm: hojeLocal() }));
  }

  function exemplo() {
    mudarCad((x) => {
      const campos = { ...x.campos };
      Object.entries(CAMPOS_EXEMPLO).forEach(([k, v]) => {
        if (!campos[k]) campos[k] = v;
      });
      const usarExemplo = !x.empresa?.ehMei;
      if (usarExemplo) campos.cnpj = mascaraCnpj(EMPRESA_EXEMPLO.cnpj);
      const docs = { ...x.docs };
      const nomes = ["ccmei-2026.pdf", "dasn-simei-2025.pdf", "extratos-ago-out.pdf", "documento-titular.jpg"];
      const tam = ["212 KB", "188 KB", "1,4 MB", "640 KB"];
      DOCS.forEach((d, i) => {
        if (!docs[d.id]) docs[d.id] = { nome: nomes[i] ?? "arquivo.pdf", tamanho: tam[i] ?? "100 KB" };
      });
      return { ...x, campos, docs, empresa: usarExemplo ? EMPRESA_EXEMPLO : x.empresa };
    });
    setErros({});
    avisar("Campos vazios preenchidos com dados fictícios.");
  }

  return (
    <>
      <section className="cabeca-pagina">
        <p className="sobretitulo">Sou MEI</p>
        <h1>Peça crédito para o seu negócio</h1>
        <p className="lead">
          Sem garantia de bens. Não sabe quanto pedir? <Link href="/simulador/">Simule a parcela</Link>.
        </p>
      </section>

      <div className={"cartao " + s.cartaoForm}>
        <Etapas nomes={ETAPAS} atual={n} rotulo="Etapas do cadastro" />
        <form onSubmit={avancar} noValidate>
          <div className={s.formCabeca}>
            <h2 tabIndex={-1} ref={tituloRef}>{TITULOS[n - 1]}</h2>
            {n < 6 && (
              <button type="button" className="link-btn" onClick={exemplo}>
                Preencher com exemplo
              </button>
            )}
          </div>

          {n === 1 && <EtapaEmpresa cad={cad} erro={erros.cnpj} limparErro={() => setErros({})} />}
          {n === 2 && <EtapaNegocio c={c} erros={erros} />}
          {n === 3 && <EtapaPedido c={c} erros={erros} />}
          {n === 4 && <EtapaDocs cad={cad} erro={erros.docs} />}
          {n === 5 && <EtapaAvalista c={c} erros={erros} />}
          {n === 6 && <EtapaRevisao cad={cad} />}

          <div className="form-acoes">
            {n > 1 && (
              <button type="button" className="btn btn-sec" onClick={() => irPara(n - 1)}>
                <Icone nome="voltar" /> Voltar
              </button>
            )}
            <button type="submit" className="btn btn-pri" disabled={n === 1 && cad.empresa !== null && !cad.empresa.ehMei}>
              {n === 6 ? "Enviar para análise" : "Continuar"} <Icone nome="seta" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* ---------------- etapa 1: CNPJ ---------------- */

function EtapaEmpresa({ cad, erro, limparErro }: { cad: TCadastro; erro?: string; limparErro: () => void }) {
  const [estado, setEstado] = useState<"ocioso" | "carregando" | "erro">("ocioso");
  const [msg, setMsg] = useState("");
  const [erroRede, setErroRede] = useState(false);
  const cnpj = cad.campos.cnpj ?? "";
  const emp = cad.empresa;

  async function consultar() {
    limparErro();
    if (!cnpjValido(cnpj)) {
      setEstado("erro");
      setErroRede(false);
      setMsg(soDigitos(cnpj).length === 14 ? "CNPJ inválido: confira os dígitos." : "Digite os 14 números do CNPJ.");
      document.getElementById("cnpj")?.focus();
      return;
    }
    setEstado("carregando");
    setMsg("");
    try {
      const empresa = await consultarCnpj(soDigitos(cnpj));
      mudarCad((x) => {
        if (!empresa.ehMei) return { ...x, empresa };
        const campos = { ...x.campos };
        campos.negocio = empresa.nomeFantasia ? titulo(empresa.nomeFantasia) : campos.negocio ?? "";
        campos.cidade = empresa.municipio || campos.cidade || "";
        campos.uf = empresa.uf || campos.uf || "";
        if (empresa.cep) campos.cep = mascaraCep(empresa.cep);
        if (empresa.abertura) campos.desde = empresa.abertura.slice(0, 4);
        if (empresa.atividade) campos.segmento = segmentoPorCnae(empresa.atividade);
        return { ...x, empresa, campos };
      });
      setEstado("ocioso");
    } catch (e) {
      setEstado("erro");
      setErroRede(!(e instanceof ErroApi && e.tipo === "nao_encontrado"));
      setMsg(e instanceof ErroApi ? e.message : "Não foi possível consultar agora. Tente de novo.");
    }
  }

  return (
    <div className={s.etapa}>
      <p className={s.texto}>Buscamos razão social, atividade, cidade e data de abertura na base pública do CNPJ. Sem um CNPJ de MEI à mão? Use “Preencher com exemplo”.</p>
      <Campo id="cnpj" rotulo="CNPJ do MEI" erro={erro ?? (estado === "erro" && !erroRede ? msg : undefined)}>
        {(a) => (
          <div className="entrada-botao">
            <input
              {...a} type="text" inputMode="numeric" autoComplete="off" placeholder="00.000.000/0000-00" maxLength={18}
              value={cnpj}
              onChange={(ev) => {
                setCampo("cnpj", mascaraCnpj(ev.target.value));
                if (emp) mudarCad((x) => ({ ...x, empresa: null }));
                if (estado === "erro") setEstado("ocioso");
              }}
              onKeyDown={(ev) => {
                if (ev.key === "Enter") {
                  ev.preventDefault();
                  void consultar();
                }
              }}
            />
            <button type="button" className="btn btn-pri" onClick={() => void consultar()} disabled={estado === "carregando"}>
              <Icone nome="lupa" /> Consultar
            </button>
          </div>
        )}
      </Campo>

      {estado === "carregando" && (
        <div role="status" aria-live="polite">
          <span className="sr">Consultando o CNPJ</span>
          <div className="skeleton" aria-hidden="true"><span style={{ height: 22 }} /><span /><span /><span style={{ width: "60%" }} /></div>
        </div>
      )}

      {estado === "erro" && erroRede && (
        <div className="caixa-info caixa-alerta" role="alert">
          <Icone nome="alerta" />
          <div>
            <p>{msg}</p>
            <button type="button" className="link-btn" onClick={() => void consultar()}>Tentar de novo</button>
          </div>
        </div>
      )}

      {emp && estado !== "carregando" && (
        <div className={s.empresa} aria-live="polite">
          <div className={s.empresaTopo}>
            <strong>{emp.nomeFantasia ? titulo(emp.nomeFantasia) : emp.razaoSocial}</strong>
            {emp.ehMei ? (
              <span className="status-pill aprovado"><Icone nome="check" /> Optante pelo MEI</span>
            ) : (
              <span className="status-pill alerta"><Icone nome="alerta" /> Não é MEI</span>
            )}
          </div>
          <dl className="linhas">
            <div><dt>Razão social</dt><dd>{emp.razaoSocial}</dd></div>
            <div><dt>Atividade</dt><dd>{emp.cnae ? `${emp.cnae} · ` : ""}{emp.atividade || "não informada"}</dd></div>
            <div><dt>Município</dt><dd>{emp.municipio} / {emp.uf}</dd></div>
            {emp.abertura && <div><dt>Abertura</dt><dd>{dataBr(emp.abertura)}</dd></div>}
            <div><dt>Situação</dt><dd>{emp.situacao || "não informada"}</dd></div>
            <div><dt>Porte</dt><dd>{emp.porte || "não informado"}</dd></div>
          </dl>
          {emp === EMPRESA_EXEMPLO || emp.razaoSocial.includes("fictícios") ? (
            <p className="ajuda">Empresa de exemplo, sem consulta à Receita.</p>
          ) : (
            <p className="ajuda">Fonte: BrasilAPI (dados públicos do CNPJ).</p>
          )}
          {!emp.ehMei && (
            <div className="caixa-info caixa-alerta" role="alert">
              <Icone nome="alerta" />
              <p>
                <strong>Este CNPJ não é optante pelo MEI.</strong> O MEInveste atende só microempreendedores individuais. Confira se digitou o CNPJ certo.
              </p>
            </div>
          )}
          {emp.ehMei && emp.situacao && emp.situacao.toUpperCase() !== "ATIVA" && (
            <div className="caixa-info caixa-alerta" role="alert">
              <Icone nome="alerta" />
              <p>O CNPJ está com situação <strong>{emp.situacao.toLowerCase()}</strong>. A análise vai pedir a regularização antes de liberar a captação.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function titulo(t: string) {
  return t.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
}

/* ---------------- etapa 2: negócio + CEP ---------------- */

function EtapaNegocio({ c, erros }: { c: Record<string, string>; erros: Erros }) {
  const [cep, setCep] = useState<{ status: "ocioso" | "carregando" | "ok" | "erro"; msg?: string; end?: Endereco }>({ status: "ocioso" });

  async function buscarCep(valor: string) {
    const d = soDigitos(valor);
    if (d.length !== 8) return;
    setCep({ status: "carregando" });
    try {
      const end = await consultarCep(d);
      setCep({ status: "ok", end });
      mudarCad((x) => ({ ...x, campos: { ...x.campos, cidade: end.cidade, uf: end.uf, bairro: end.bairro } }));
    } catch (e) {
      setCep({ status: "erro", msg: e instanceof ErroApi ? e.message : "Não foi possível consultar o CEP." });
    }
  }

  return (
    <div className={s.grade}>
      <Campo id="negocio" rotulo="Nome do negócio" erro={erros.negocio} className={s.largo}>
        {(a) => <input {...a} type="text" autoComplete="organization" value={c.negocio ?? ""} onChange={(ev) => setCampo("negocio", ev.target.value)} />}
      </Campo>
      <Campo id="dono" rotulo="Seu nome" erro={erros.dono} className={s.largo}>
        {(a) => <input {...a} type="text" autoComplete="name" value={c.dono ?? ""} onChange={(ev) => setCampo("dono", ev.target.value)} />}
      </Campo>
      <Campo id="segmento" rotulo="Segmento" erro={erros.segmento} dica={c.segmento ? "Sugerido pela atividade do CNPJ; ajuste se precisar." : undefined} className={s.largo}>
        {(a) => (
          <select {...a} value={c.segmento ?? ""} onChange={(ev) => setCampo("segmento", ev.target.value)}>
            <option value="">Selecione</option>
            {SEGMENTOS.map((x) => <option key={x}>{x}</option>)}
          </select>
        )}
      </Campo>
      <Campo id="cep" rotulo="CEP do ponto" opcional erro={erros.cep} className={s.largo}
        dica={cep.status === "ok" && cep.end ? `${[cep.end.rua, cep.end.bairro].filter(Boolean).join(", ") || cep.end.cidade} · ${cep.end.cidade}/${cep.end.uf}` : cep.status === "erro" ? undefined : "Preenche cidade e UF."}>
        {(a) => (
          <input
            {...a} type="text" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" maxLength={9}
            value={c.cep ?? ""}
            onChange={(ev) => {
              const v = mascaraCep(ev.target.value);
              setCampo("cep", v);
              if (soDigitos(v).length === 8) void buscarCep(v);
              else setCep({ status: "ocioso" });
            }}
          />
        )}
      </Campo>
      {cep.status === "carregando" && <p className={"ajuda " + s.largo} role="status">Buscando o CEP…</p>}
      {cep.status === "erro" && (
        <p className={"erro " + s.largo} role="alert">
          {cep.msg} Preencha cidade e UF à mão.
        </p>
      )}
      <Campo id="cidade" rotulo="Cidade" erro={erros.cidade} className={s.dois}>
        {(a) => <input {...a} type="text" autoComplete="address-level2" value={c.cidade ?? ""} onChange={(ev) => setCampo("cidade", ev.target.value)} />}
      </Campo>
      <Campo id="uf" rotulo="UF" erro={erros.uf}>
        {(a) => (
          <select {...a} value={c.uf ?? ""} onChange={(ev) => setCampo("uf", ev.target.value)}>
            <option value="">--</option>
            {UFS.map((u) => <option key={u}>{u}</option>)}
          </select>
        )}
      </Campo>
      <Campo id="desde" rotulo="Ano de abertura" erro={erros.desde} className={s.metade}>
        {(a) => <input {...a} type="number" inputMode="numeric" min={2009} max={2026} value={c.desde ?? ""} onChange={(ev) => setCampo("desde", ev.target.value)} />}
      </Campo>
      <Campo id="faturamento" rotulo="Faturamento/mês (R$)" erro={erros.faturamento} className={s.metade}>
        {(a) => <input {...a} type="number" inputMode="numeric" min={500} max={13500} value={c.faturamento ?? ""} onChange={(ev) => setCampo("faturamento", ev.target.value)} />}
      </Campo>
      <Campo id="resumo" rotulo="O que o negócio faz, em uma frase" erro={erros.resumo} className={s.largo}>
        {(a) => <textarea {...a} rows={2} maxLength={140} value={c.resumo ?? ""} onChange={(ev) => setCampo("resumo", ev.target.value)} />}
      </Campo>
    </div>
  );
}

/* ---------------- etapa 3: pedido ---------------- */

function EtapaPedido({ c, erros }: { c: Record<string, string>; erros: Erros }) {
  const meta = Number(c.meta) || 0;
  const prazo = Number(c.prazo) || 12;
  const fat = Number(c.faturamento) || 0;
  const pv = meta >= 2000 && fat > 0 ? previa({ faturamento: fat, meta, prazo }) : null;
  return (
    <div className={s.grade}>
      <Campo id="meta" rotulo="Quanto você precisa (R$)" erro={erros.meta} dica="Entre R$ 2.000 e R$ 30.000." className={s.largo}>
        {(a) => <input {...a} type="number" inputMode="numeric" min={2000} max={30000} step={500} value={c.meta ?? ""} onChange={(ev) => setCampo("meta", ev.target.value)} />}
      </Campo>
      <fieldset className={"campo " + s.largo}>
        <legend>Prazo para pagar</legend>
        <div className="segmentos">
          {["6", "12", "18", "24"].map((p) => (
            <label key={p}>
              <input type="radio" name="prazo" value={p} checked={(c.prazo ?? "") === p} onChange={() => setCampo("prazo", p)} />
              <span>{p} meses</span>
            </label>
          ))}
        </div>
        {erros.prazo && <p className="erro">{erros.prazo}</p>}
      </fieldset>
      {pv && (
        <p className={"caixa-info " + s.largo + (pv.comprometimento > 0.35 ? " caixa-alerta" : "")} aria-live="polite">
          <Icone nome="calculadora" />
          <span>
            Parcela estimada de <strong>{brl(pv.parcela)}</strong>, {pct(pv.comprometimento * 100, 0)} do seu faturamento.
            {pv.comprometimento > 0.35 && " Acima de 35%: a análise deve reduzir a meta."}
          </span>
        </p>
      )}
      <Campo id="finalidade" rotulo="Para que é o dinheiro" erro={erros.finalidade} dica="Investidores leem isso antes de decidir." className={s.largo}>
        {(a) => <textarea {...a} rows={2} maxLength={200} value={c.finalidade ?? ""} onChange={(ev) => setCampo("finalidade", ev.target.value)} />}
      </Campo>
      <Campo id="descricao" rotulo="Conte a história do negócio" opcional className={s.largo}>
        {(a) => <textarea {...a} rows={3} maxLength={400} value={c.descricao ?? ""} onChange={(ev) => setCampo("descricao", ev.target.value)} />}
      </Campo>
    </div>
  );
}

/* ---------------- etapa 4: documentos (simulado) ---------------- */

function EtapaDocs({ cad, erro }: { cad: TCadastro; erro?: string }) {
  return (
    <div className={s.etapa}>
      <p className={s.texto}>
        Os arquivos não saem do seu navegador: a demo guarda só o nome e o tamanho. <SeloDemo texto="envio simulado" />
      </p>
      <ul className={s.docs} id="docs-lista" tabIndex={-1} aria-describedby={erro ? "docs-erro" : undefined}>
        {DOCS.map((d) => {
          const f = cad.docs[d.id];
          return (
            <li key={d.id} className={s.doc + (f ? " " + s.enviado : "")}>
              <span className={s.docIc}><Icone nome={f ? "check" : "arquivo"} /></span>
              <div className={s.docTxt}>
                <strong>{d.nome}</strong>
                <span>{f ? `${f.nome} · ${f.tamanho}` : d.dica}</span>
              </div>
              <input
                className={"sr " + s.arquivoIn} type="file" id={"up-" + d.id} accept=".pdf,.jpg,.jpeg,.png"
                onChange={(ev) => {
                  const file = ev.target.files?.[0];
                  if (file) mudarCad((x) => ({ ...x, docs: { ...x.docs, [d.id]: { nome: file.name, tamanho: tamanhoArquivo(file.size) } } }));
                }}
              />
              <label className="btn btn-sec btn-peq" htmlFor={"up-" + d.id}>
                <Icone nome="upload" /> {f ? "Trocar" : "Anexar"}
                <span className="sr"> {d.nome}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {erro && <p className="erro" id="docs-erro" role="alert">{erro}</p>}
    </div>
  );
}

/* ---------------- etapa 5: avalista ---------------- */

function EtapaAvalista({ c, erros }: { c: Record<string, string>; erros: Erros }) {
  return (
    <div className={s.grade}>
      <p className={s.texto + " " + s.largo}>Você não dá imóvel nem carro como garantia. Só precisa de alguém que se comprometa a pagar se o negócio não puder.</p>
      <Campo id="avNome" rotulo="Nome do avalista" erro={erros.avNome} className={s.largo}>
        {(a) => <input {...a} type="text" value={c.avNome ?? ""} onChange={(ev) => setCampo("avNome", ev.target.value)} />}
      </Campo>
      <Campo id="avCpf" rotulo="CPF do avalista" erro={erros.avCpf} dica="Use um CPF fictício válido na demo." className={s.metade}>
        {(a) => <input {...a} type="text" inputMode="numeric" placeholder="000.000.000-00" maxLength={14} value={c.avCpf ?? ""} onChange={(ev) => setCampo("avCpf", mascaraCpf(ev.target.value))} />}
      </Campo>
      <Campo id="avTelefone" rotulo="Telefone" erro={erros.avTelefone} className={s.metade}>
        {(a) => <input {...a} type="tel" inputMode="tel" placeholder="(00) 00000-0000" maxLength={15} value={c.avTelefone ?? ""} onChange={(ev) => setCampo("avTelefone", mascaraTelefone(ev.target.value))} />}
      </Campo>
      <Campo id="avRelacao" rotulo="Relação com você" erro={erros.avRelacao} className={s.largo}>
        {(a) => (
          <select {...a} value={c.avRelacao ?? ""} onChange={(ev) => setCampo("avRelacao", ev.target.value)}>
            <option value="">Selecione</option>
            {RELACOES.map((r) => <option key={r}>{r}</option>)}
          </select>
        )}
      </Campo>
      <Campo id="avOcupacao" rotulo="Ocupação" erro={erros.avOcupacao} className={s.metade}>
        {(a) => <input {...a} type="text" value={c.avOcupacao ?? ""} onChange={(ev) => setCampo("avOcupacao", ev.target.value)} />}
      </Campo>
      <Campo id="avRenda" rotulo="Renda mensal (R$)" erro={erros.avRenda} className={s.metade}>
        {(a) => <input {...a} type="number" inputMode="numeric" min={0} value={c.avRenda ?? ""} onChange={(ev) => setCampo("avRenda", ev.target.value)} />}
      </Campo>
    </div>
  );
}

/* ---------------- etapa 6: revisão ---------------- */

function EtapaRevisao({ cad }: { cad: TCadastro }) {
  const c = cad.campos;
  const pv = previa({ faturamento: Number(c.faturamento) || 1, meta: Number(c.meta) || 0, prazo: Number(c.prazo) || 12 });
  const linhas: [string, string][] = [
    ["CNPJ", c.cnpj ?? ""],
    ["Negócio", c.negocio ?? ""],
    ["Titular", c.dono ?? ""],
    ["Local", `${c.cidade ?? ""} / ${c.uf ?? ""}`],
    ["Segmento", c.segmento ?? ""],
    ["Faturamento médio", brl0(Number(c.faturamento) || 0)],
    ["Pedido", `${brl0(Number(c.meta) || 0)} em ${c.prazo} meses`],
    ["Documentos", `${Object.keys(cad.docs).length} de ${DOCS.length} anexados`],
    ["Avalista", `${c.avNome ?? ""} (${(c.avRelacao ?? "").toLowerCase()})`],
  ];
  return (
    <div className={s.etapa}>
      <dl className={s.revisao}>
        {linhas.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      <p className="caixa-info">
        <Icone nome="info" />
        <span>Parcela estimada de <strong>{brl(pv.parcela)}</strong> por mês, {pct(pv.comprometimento * 100, 0)} do faturamento. A taxa final sai da análise.</span>
      </p>
    </div>
  );
}
