/* Cliente da BrasilAPI (https://brasilapi.com.br). Pública, sem chave e com CORS liberado. */

const BASE = "https://brasilapi.com.br/api";

export class ErroApi extends Error {
  constructor(public tipo: "nao_encontrado" | "rede" | "tempo" | "servico", mensagem: string) {
    super(mensagem);
  }
}

async function buscar<T>(caminho: string, ms = 9000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  let resp: Response;
  try {
    resp = await fetch(BASE + caminho, { signal: ctrl.signal, headers: { Accept: "application/json" } });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw new ErroApi("tempo", "A consulta demorou demais. Tente de novo.");
    throw new ErroApi("rede", "Sem conexão com a BrasilAPI. Verifique a internet e tente de novo.");
  } finally {
    clearTimeout(timer);
  }
  if (resp.status === 404) throw new ErroApi("nao_encontrado", "Não encontrado.");
  if (!resp.ok) throw new ErroApi("servico", `A BrasilAPI respondeu com erro (${resp.status}). Tente em alguns minutos.`);
  return (await resp.json()) as T;
}

/* ---------- CNPJ ---------- */

interface CnpjResposta {
  cnpj: string;
  razao_social?: string;
  nome_fantasia?: string | null;
  cnae_fiscal?: number;
  cnae_fiscal_descricao?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  data_inicio_atividade?: string;
  opcao_pelo_mei?: boolean | null;
  porte?: string;
  descricao_situacao_cadastral?: string;
}

export interface EmpresaCnpj {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnae: string;
  atividade: string;
  municipio: string;
  uf: string;
  cep: string;
  abertura: string; // AAAA-MM-DD
  ehMei: boolean;
  porte: string;
  situacao: string;
}

function titulo(s: string) {
  return s.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase())
    .replace(/\s(De|Da|Do|Das|Dos|E)\s/g, (m) => m.toLowerCase());
}

export async function consultarCnpj(cnpj: string): Promise<EmpresaCnpj> {
  try {
    const r = await buscar<CnpjResposta>(`/cnpj/v1/${cnpj}`);
    return {
      cnpj: r.cnpj,
      razaoSocial: r.razao_social ?? "",
      nomeFantasia: r.nome_fantasia ?? "",
      cnae: r.cnae_fiscal ? String(r.cnae_fiscal) : "",
      atividade: r.cnae_fiscal_descricao ?? "",
      municipio: r.municipio ? titulo(r.municipio) : "",
      uf: r.uf ?? "",
      cep: r.cep ?? "",
      abertura: r.data_inicio_atividade ?? "",
      ehMei: r.opcao_pelo_mei === true,
      porte: r.porte ?? "",
      situacao: r.descricao_situacao_cadastral ?? "",
    };
  } catch (e) {
    if (e instanceof ErroApi && e.tipo === "nao_encontrado")
      throw new ErroApi("nao_encontrado", "CNPJ não encontrado na Receita Federal. Confira os números.");
    throw e;
  }
}

/* ---------- CEP ---------- */

interface CepResposta {
  cep: string;
  state: string;
  city: string;
  neighborhood?: string;
  street?: string;
}

export interface Endereco {
  cep: string;
  uf: string;
  cidade: string;
  bairro: string;
  rua: string;
}

export async function consultarCep(cep: string): Promise<Endereco> {
  try {
    const r = await buscar<CepResposta>(`/cep/v2/${cep}`);
    return { cep: r.cep, uf: r.state, cidade: r.city, bairro: r.neighborhood ?? "", rua: r.street ?? "" };
  } catch (e) {
    if (e instanceof ErroApi && e.tipo === "nao_encontrado") throw new ErroApi("nao_encontrado", "CEP não encontrado.");
    throw e;
  }
}

/* ---------- taxas (CDI, Selic, IPCA) ---------- */

export interface Taxas {
  cdi: number;
  selic: number;
  ipca: number;
}

let cacheTaxas: Promise<Taxas> | null = null;

export function buscarTaxas(): Promise<Taxas> {
  if (!cacheTaxas) {
    cacheTaxas = buscar<{ nome: string; valor: number }[]>("/taxas/v1", 8000).then((lista) => {
      const v = (n: string) => lista.find((t) => t.nome.toUpperCase() === n)?.valor;
      const cdi = v("CDI");
      if (typeof cdi !== "number") throw new ErroApi("servico", "Resposta sem CDI.");
      return { cdi, selic: v("SELIC") ?? cdi, ipca: v("IPCA") ?? 0 };
    });
    cacheTaxas.catch(() => {
      cacheTaxas = null;
    });
  }
  return cacheTaxas;
}
