import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <section className="cabeca-pagina">
      <p className="sobretitulo">Erro 404</p>
      <h1>Página não encontrada</h1>
      <p className="lead">O endereço pode ter mudado. Volte para o início ou para a vitrine.</p>
      <div className="acoes">
        <Link className="btn btn-pri" href="/">Início</Link>
        <Link className="btn btn-sec" href="/vitrine/">Vitrine</Link>
      </div>
    </section>
  );
}
