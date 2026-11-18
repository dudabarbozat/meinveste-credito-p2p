import type { EmpresaCnpj } from "@/lib/brasilapi";
import { SEGMENTOS } from "@/lib/dados";
import { cnpjValido, cpfValido, soDigitos } from "@/lib/formato";

export const ETAPAS = ["Empresa", "Negócio", "Pedido", "Documentos", "Avalista", "Revisão"];

export const DOCS = [
  { id: "ccmei", nome: "Certificado do MEI (CCMEI)", dica: "PDF emitido no portal do empreendedor" },
  { id: "dasn", nome: "Declaração anual (DASN-SIMEI)", dica: "Última declaração entregue" },
  { id: "extratos", nome: "Extratos dos últimos 3 meses", dica: "Conta usada pelo negócio" },
  { id: "identidade", nome: "Documento com foto", dica: "RG ou CNH do titular" },
];

export const UFS = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO"];

export const RELACOES = ["Cônjuge", "Pai ou mãe", "Irmão ou irmã", "Filho ou filha", "Outro parente", "Amigo ou sócio"];

/** Segmento provável a partir da descrição do CNAE. */
export function segmentoPorCnae(atividade: string): string {
  const a = atividade.toLowerCase();
  if (/aliment|restaurante|lanchonete|padaria|confeitaria|bebida|doce|marmita|refei/.test(a)) return "Alimentação";
  if (/cabeleire|beleza|est[ée]tic|manicure|maquiagem/.test(a)) return "Beleza";
  if (/confec|vestu|roupa|costura|cal[çc]ado|moda/.test(a)) return "Moda";
  if (/repara|manuten|conserto|instala/.test(a)) return "Reparos";
  if (/com[ée]rcio varejista|com[ée]rcio atacadista|mercearia|minimercado/.test(a)) return "Comércio";
  return "Serviços";
}

/* Empresa fictícia usada no botão de exemplo (não consulta a API). */
export const EMPRESA_EXEMPLO: EmpresaCnpj = {
  cnpj: "12345678000195",
  razaoSocial: "DOCES DA PRACA (dados fictícios)",
  nomeFantasia: "Doces da Praça",
  cnae: "1091102",
  atividade: "Fabricação de produtos de padaria e confeitaria com predominância de produção própria",
  municipio: "São Luís",
  uf: "MA",
  cep: "65010000",
  abertura: "2019-03-11",
  ehMei: true,
  porte: "MICRO EMPRESA",
  situacao: "ATIVA",
};

export const CAMPOS_EXEMPLO: Record<string, string> = {
  negocio: "Doces da Praça", dono: "Marta V.", segmento: "Alimentação", cep: "65010-000",
  cidade: "São Luís", uf: "MA", desde: "2019", faturamento: "6200",
  resumo: "Bolos e doces de festa sob encomenda, com retirada no ponto ou entrega.",
  meta: "9000", prazo: "12",
  finalidade: "Forno turbo e uma vitrine refrigerada para vender fatias no balcão.",
  descricao: "Começou fazendo bolos para vizinhos e hoje atende cerca de 30 festas por mês. O forno doméstico limita a produção nos fins de semana.",
  avNome: "Joana V.", avCpf: "111.444.777-35", avTelefone: "(98) 98888-0000", avRelacao: "Irmão ou irmã",
  avOcupacao: "Auxiliar administrativa", avRenda: "3100",
};

export type Erros = Record<string, string>;

const obrig = (c: Record<string, string>, k: string, erros: Erros, msg = "Campo obrigatório.") => {
  if (!(c[k] ?? "").trim()) erros[k] = msg;
};

const numEntre = (c: Record<string, string>, k: string, min: number, max: number, erros: Erros, msgMax?: string) => {
  if (erros[k]) return;
  const n = Number(c[k]);
  if (!Number.isFinite(n)) erros[k] = "Digite um número.";
  else if (n < min) erros[k] = `O mínimo é ${min.toLocaleString("pt-BR")}.`;
  else if (n > max) erros[k] = msgMax ?? `O máximo é ${max.toLocaleString("pt-BR")}.`;
};

export function validarEtapa(etapa: number, c: Record<string, string>, docs: Record<string, unknown>, empresa: EmpresaCnpj | null): Erros {
  const e: Erros = {};
  if (etapa === 1) {
    if (!empresa) {
      if (!cnpjValido(c.cnpj ?? "")) e.cnpj = soDigitos(c.cnpj ?? "").length === 14 ? "CNPJ inválido: confira os dígitos." : "Digite os 14 números do CNPJ.";
      else e.cnpj = "Consulte o CNPJ para continuar.";
    } else if (!empresa.ehMei) e.cnpj = "Este CNPJ não é MEI.";
  }
  if (etapa === 2) {
    ["negocio", "dono", "segmento", "cidade", "uf", "desde", "faturamento", "resumo"].forEach((k) => obrig(c, k, e));
    if (!e.segmento && !SEGMENTOS.includes(c.segmento as (typeof SEGMENTOS)[number])) e.segmento = "Escolha um segmento.";
    if (!e.desde) {
      const ano = Number(c.desde);
      if (!Number.isInteger(ano) || ano < 2009 || ano > 2026) e.desde = "Ano entre 2009 (criação do MEI) e 2026.";
    }
    numEntre(c, "faturamento", 500, 13500, e, "Acima do limite de faturamento do MEI (R$ 81 mil por ano).");
    if ((c.cep ?? "") && soDigitos(c.cep ?? "").length !== 8) e.cep = "O CEP tem 8 números.";
  }
  if (etapa === 3) {
    ["meta", "prazo", "finalidade"].forEach((k) => obrig(c, k, e));
    numEntre(c, "meta", 2000, 30000, e);
  }
  if (etapa === 4) {
    const faltam = DOCS.filter((d) => !docs[d.id]).length;
    if (faltam) e.docs = `Anexe ${faltam === 1 ? "o documento que falta" : `os ${faltam} documentos que faltam`}.`;
  }
  if (etapa === 5) {
    ["avNome", "avCpf", "avTelefone", "avRelacao", "avOcupacao", "avRenda"].forEach((k) => obrig(c, k, e));
    if (!e.avCpf && !cpfValido(c.avCpf ?? "")) e.avCpf = "CPF inválido: confira os dígitos.";
    if (!e.avTelefone && soDigitos(c.avTelefone ?? "").length < 10) e.avTelefone = "Telefone com DDD, 10 ou 11 números.";
    numEntre(c, "avRenda", 0, 1000000, e);
  }
  return e;
}
