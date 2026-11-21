"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { restaurar, useEstado } from "@/lib/estado";
import { Icone, type NomeIcone } from "./Icone";
import { AvisoProvider, BASE, Dialogo, useAviso } from "./ui";

const ABAS: { href: string; rotulo: string; icone: NomeIcone; ativo: (p: string) => boolean }[] = [
  { href: "/", rotulo: "Início", icone: "casa", ativo: (p) => p === "/" },
  { href: "/vitrine/", rotulo: "Vitrine", icone: "loja", ativo: (p) => /^\/(vitrine|negocio|investir)/.test(p) },
  { href: "/cadastro/", rotulo: "Sou MEI", icone: "arquivo", ativo: (p) => /^\/(cadastro|simulador)/.test(p) },
  { href: "/carteira/", rotulo: "Carteira", icone: "grafico", ativo: (p) => p.startsWith("/carteira") },
];

function Wordmark() {
  return (
    <span className="wm">
      <b>MEI</b>nveste
    </span>
  );
}

function Splash() {
  const [fase, setFase] = useState<"mostrar" | "saindo" | "fora">("fora");
  useEffect(() => {
    let jaViu = false;
    try {
      jaViu = window.sessionStorage.getItem("meinveste:splash") === "1";
      window.sessionStorage.setItem("meinveste:splash", "1");
    } catch {
      /* ignora */
    }
    if (jaViu || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setFase("mostrar");
    const t1 = setTimeout(() => setFase("saindo"), 1100);
    const t2 = setTimeout(() => setFase("fora"), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  if (fase === "fora") return null;
  return (
    <div className={"splash" + (fase === "saindo" ? " saindo" : "")} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${BASE}/img/logo-icone.png`} width={140} height={125} alt="" />
      <p className="wm">
        <b>MEI</b>nveste
      </p>
    </div>
  );
}

function Rodape() {
  const [confirmar, setConfirmar] = useState(false);
  const avisar = useAviso();
  return (
    <footer className="rodape">
      <p>Protótipo. Negócios, pessoas e valores são fictícios e nenhum pagamento é processado.</p>
      <button type="button" className="link-btn discreto" onClick={() => setConfirmar(true)}>
        <Icone nome="restaurar" />
        Restaurar dados de exemplo
      </button>
      <Dialogo
        aberto={confirmar}
        titulo="Restaurar dados de exemplo?"
        onFechar={() => setConfirmar(false)}
        acoes={
          <>
            <button type="button" className="btn btn-sec" onClick={() => setConfirmar(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-pri"
              onClick={() => {
                restaurar();
                setConfirmar(false);
                avisar("Dados de exemplo restaurados.");
              }}
            >
              Restaurar
            </button>
          </>
        }
      >
        <p>Seus investimentos, o cadastro em andamento e os negócios publicados nesta demo serão apagados.</p>
      </Dialogo>
    </footer>
  );
}

function Moldura({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const estado = useEstado();
  const tela = useRef<HTMLDivElement>(null);
  const primeira = useRef(true);
  const n = estado.investimentos.length;

  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    tela.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
    const h1 = document.querySelector<HTMLElement>("main h1");
    if (h1) {
      h1.setAttribute("tabindex", "-1");
      h1.focus({ preventScroll: true });
    }
  }, [pathname]);

  return (
    <>
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <div className="palco" aria-hidden="true">
        <svg className="palco-mancha" viewBox="0 0 700 760">
          <path d="M340 20c90 10 180 120 260 250 80 130 110 250 40 360-60 90-200 130-330 120C170 740 50 690 20 560-10 430 80 330 160 220 230 120 260 10 340 20z" />
        </svg>
        <span className="orn orn-anel" />
        <span className="orn orn-ponto" />
        <svg className="orn orn-x" viewBox="0 0 24 24">
          <path d="M4 4l16 16M20 4L4 20" />
        </svg>
        <div className="palco-marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE}/img/logo-icone.png`} width={150} height={134} alt="" />
          <p className="wm">
            <b>MEI</b>nveste
          </p>
          <p className="palco-slogan">Investindo em Sonhos</p>
        </div>
      </div>

      <aside className="lateral" aria-label="Sobre o protótipo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${BASE}/img/logo-icone.png`} width={72} height={64} alt="" />
        <p className="wm lateral-nome">
          <b>MEI</b>nveste
        </p>
        <p>
          Marketplace de empréstimo entre pessoas e MEIs: o investidor escolhe um negócio local aprovado, empresta direto para ele e
          recebe em parcelas mensais.
        </p>
        <p>
          <b>Para quem é:</b> MEIs sem crédito nos bancos e investidores que querem apoiar negócios locais.
        </p>
        <ul className="lateral-lista">
          <li><Icone nome="calculadora" /><span><b>Simulador de crédito</b> pela tabela Price.</span></li>
          <li><Icone nome="arquivo" /><span><b>Cadastro do MEI</b> com CNPJ e CEP consultados na BrasilAPI.</span></li>
          <li><Icone nome="escudo" /><span><b>Parecer de risco</b> por regras.</span></li>
          <li><Icone nome="grafico" /><span><b>Vitrine e carteira</b> com retorno comparado ao CDI do dia.</span></li>
        </ul>
        <a className="btn btn-sec btn-peq" href="https://github.com/dudabarbozat/meinveste-credito-p2p" target="_blank" rel="noreferrer">
          <Icone nome="github" />
          Ver o código no GitHub
        </a>
        <p className="lateral-nota">Projeto de pitch em equipe, reconstruído em 2026 como protótipo navegável.</p>
      </aside>

      <div className="aparelho">
        <div className="barra-status" aria-hidden="true">
          <span>9:41</span>
          <span className="notch" />
          <span className="bs-ic">
            <svg viewBox="0 0 18 12">
              <rect x="0" y="8" width="3" height="4" rx="1" />
              <rect x="5" y="6" width="3" height="6" rx="1" />
              <rect x="10" y="3" width="3" height="9" rx="1" />
              <rect x="15" y="0" width="3" height="12" rx="1" />
            </svg>
            <svg viewBox="0 0 26 12">
              <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" />
              <rect x="2.5" y="2.5" width="18" height="7" rx="1.5" />
              <rect x="24" y="4" width="2" height="4" rx="1" />
            </svg>
          </span>
        </div>

        <AvisoProvider>
          <div className="tela" ref={tela}>
            <header className="topo">
              <Link className="marca" href="/" aria-label="MEInveste, início">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${BASE}/img/logo-icone.png`} width={36} height={32} alt="" />
                <Wordmark />
              </Link>
            </header>

            <main id="conteudo" className="conteudo" tabIndex={-1}>
              {children}
            </main>

            <Rodape />

            <nav className="abas" aria-label="Principal">
              {ABAS.map((a) => {
                const ativo = a.ativo(pathname);
                return (
                  <Link key={a.href} href={a.href} aria-current={ativo ? "page" : undefined}>
                    <span className="aba-ic">
                      <Icone nome={a.icone} />
                      {a.href === "/carteira/" && n > 0 && (
                        <span className="badge" aria-hidden="true">
                          {n}
                        </span>
                      )}
                    </span>
                    {a.rotulo}
                    {a.href === "/carteira/" && n > 0 && <span className="sr"> ({n} investimentos)</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        </AvisoProvider>

        <Splash />
      </div>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return <Moldura>{children}</Moldura>;
}
