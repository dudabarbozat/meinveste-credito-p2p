/* Dados fictícios da demo. Nenhum negócio ou pessoa aqui existe. */

export type Risco = "A" | "B" | "C";
export type Forma = "credito" | "debito" | "boleto";

export const SEGMENTOS = ["Alimentação", "Beleza", "Comércio", "Moda", "Reparos", "Serviços"] as const;
export type Segmento = (typeof SEGMENTOS)[number];

export interface Mei {
  id: string;
  negocio: string;
  dono: string;
  cidade: string;
  uf: string;
  segmento: string;
  desde: number;
  resumo: string;
  descricao: string;
  finalidade: string;
  meta: number;
  captadoBase: number;
  investidoresBase: number;
  taxa: number; // % ao mês
  prazo: number; // meses
  risco: Risco;
  faturamento: number;
  avalista: string;
  novo?: boolean;
}

export interface Investimento {
  id: string;
  meiId: string;
  valor: number;
  data: string; // AAAA-MM-DD
  forma: Forma;
  parcelasPagas: number;
  novo?: boolean;
  recibo?: string;
}

export interface Relatorio {
  meiId: string;
  periodo: string; // AAAA-MM
  faturamento: number;
  emDia: boolean;
  nota: string;
}

export const FORMAS: Record<Forma, string> = {
  credito: "Cartão de crédito",
  debito: "Cartão de débito",
  boleto: "Boleto",
};

export const TAXA_POR_RISCO: Record<Risco, number> = { A: 1.4, B: 1.7, C: 1.9 };

export const RISCO_TXT: Record<Risco, string> = {
  A: "Risco baixo: faturamento estável e parcela abaixo de 15% da receita.",
  B: "Risco moderado: parcela entre 15% e 25% da receita mensal.",
  C: "Risco alto: negócio mais novo ou parcela acima de 25% da receita.",
};

/* Data de referência fixa para a carteira de exemplo ficar previsível. */
export const HOJE = "2026-11-17";

export const MEIS: Mei[] = [
  {
    id: "cozinha-da-vila", negocio: "Cozinha da Vila", dono: "Rosângela T.",
    cidade: "Recife", uf: "PE", segmento: "Alimentação", desde: 2017,
    resumo: "Marmitas caseiras para escritórios e obras do bairro.",
    descricao: "Produz cerca de 120 marmitas por dia, com entrega de bicicleta num raio de 3 km. Começou vendendo na porta de casa e hoje atende quatro empresas fixas.",
    finalidade: "Segundo freezer horizontal e uma seladora para ampliar a linha congelada.",
    meta: 18000, captadoBase: 18000, investidoresBase: 31, taxa: 1.6, prazo: 18, risco: "B",
    faturamento: 9400, avalista: "Irmã, servidora pública",
  },
  {
    id: "bike-conserto-ladeira", negocio: "Bike Conserto Ladeira", dono: "Josué A.",
    cidade: "Salvador", uf: "BA", segmento: "Reparos", desde: 2019,
    resumo: "Oficina de bicicletas para entregadores, com conserto no mesmo dia.",
    descricao: "Atende principalmente entregadores de aplicativo, que não podem ficar dias sem a bicicleta. Mantém estoque de peças de reposição rápida.",
    finalidade: "Estoque de peças e um suporte de montagem profissional.",
    meta: 9000, captadoBase: 6200, investidoresBase: 14, taxa: 1.8, prazo: 12, risco: "B",
    faturamento: 5200, avalista: "Pai, aposentado",
  },
  {
    id: "atelie-linha-fina", negocio: "Ateliê Linha Fina", dono: "Cleide R.",
    cidade: "Belo Horizonte", uf: "MG", segmento: "Moda", desde: 2015,
    resumo: "Ajustes, consertos e uniformes sob medida para pequenas empresas.",
    descricao: "Faz ajustes de roupa e produz uniformes para padarias, clínicas e salões da região. Duas costureiras parceiras trabalham por produção.",
    finalidade: "Máquina overloque industrial e reforma da bancada de corte.",
    meta: 12000, captadoBase: 12000, investidoresBase: 22, taxa: 1.4, prazo: 15, risco: "A",
    faturamento: 7800, avalista: "Cônjuge, assalariado",
  },
  {
    id: "pao-de-quintal", negocio: "Pão de Quintal", dono: "Everton L.",
    cidade: "Curitiba", uf: "PR", segmento: "Alimentação", desde: 2020,
    resumo: "Pães de fermentação natural vendidos por assinatura semanal.",
    descricao: "Tem 140 assinantes que recebem pão toda sexta. A fila de espera passa de 60 pessoas porque o forno atual não dá conta.",
    finalidade: "Forno de lastro de duas câmaras e uma masseira maior.",
    meta: 25000, captadoBase: 14300, investidoresBase: 26, taxa: 1.5, prazo: 24, risco: "A",
    faturamento: 11200, avalista: "Sócio informal da família",
  },
  {
    id: "studio-cachos", negocio: "Studio Cachos & Cia", dono: "Tainá B.",
    cidade: "Fortaleza", uf: "CE", segmento: "Beleza", desde: 2018,
    resumo: "Salão especializado em cabelos cacheados e crespos.",
    descricao: "Atende com hora marcada e vende kits de finalização próprios. A agenda fica cheia com três semanas de antecedência.",
    finalidade: "Segunda cadeira com lavatório e capital de giro para os kits.",
    meta: 15000, captadoBase: 4100, investidoresBase: 9, taxa: 1.7, prazo: 18, risco: "B",
    faturamento: 6900, avalista: "Mãe, comerciante",
  },
  {
    id: "mercearia-dois-irmaos", negocio: "Mercearia Dois Irmãos", dono: "Valdir S.",
    cidade: "Porto Alegre", uf: "RS", segmento: "Comércio", desde: 2012,
    resumo: "Mercearia de esquina com entrega por mensagem para o bairro.",
    descricao: "Funciona há mais de dez anos no mesmo ponto. Metade das vendas já chega por mensagem e é entregue no mesmo dia.",
    finalidade: "Geladeira expositora e compra de estoque à vista com desconto.",
    meta: 20000, captadoBase: 17800, investidoresBase: 35, taxa: 1.3, prazo: 18, risco: "A",
    faturamento: 14500, avalista: "Irmão, motorista",
  },
  {
    id: "refrigeracao-polo-norte", negocio: "Refrigeração Polo Norte", dono: "Gilmar F.",
    cidade: "Goiânia", uf: "GO", segmento: "Serviços", desde: 2016,
    resumo: "Instalação e manutenção de ar-condicionado residencial.",
    descricao: "Trabalha sozinho e terceiriza um ajudante nos meses de calor. Tem contratos de manutenção com dois condomínios.",
    finalidade: "Bomba de vácuo, manifold digital e uma escada nova.",
    meta: 11000, captadoBase: 11000, investidoresBase: 19, taxa: 1.6, prazo: 12, risco: "B",
    faturamento: 8100, avalista: "Cunhado, eletricista",
  },
  {
    id: "horta-viva", negocio: "Horta Viva Entregas", dono: "Lívia N.",
    cidade: "Campinas", uf: "SP", segmento: "Alimentação", desde: 2021,
    resumo: "Cestas de verduras de pequenos produtores entregues em casa.",
    descricao: "Compra direto de três sítios da região e monta cestas semanais. Hoje entrega com carro emprestado.",
    finalidade: "Entrada de um utilitário usado e caixas térmicas.",
    meta: 8000, captadoBase: 2300, investidoresBase: 6, taxa: 1.9, prazo: 18, risco: "C",
    faturamento: 4300, avalista: "Tio, produtor rural",
  },
  {
    id: "estampa-propria", negocio: "Estampa Própria", dono: "Anderson M.",
    cidade: "Recife", uf: "PE", segmento: "Moda", desde: 2019,
    resumo: "Serigrafia de camisetas para eventos, igrejas e times de várzea.",
    descricao: "Faz tiragens pequenas, a partir de 20 peças, que as gráficas grandes recusam. O pico é entre setembro e dezembro.",
    finalidade: "Mesa de serigrafia de seis cores e estufa de secagem.",
    meta: 14000, captadoBase: 9800, investidoresBase: 18, taxa: 1.7, prazo: 18, risco: "B",
    faturamento: 6400, avalista: "Esposa, professora",
  },
  {
    id: "pet-banho-bom", negocio: "Pet Banho Bom", dono: "Simone C.",
    cidade: "Belo Horizonte", uf: "MG", segmento: "Serviços", desde: 2020,
    resumo: "Banho e tosa com busca e entrega do animal em casa.",
    descricao: "Atende com agendamento e tem clientes recorrentes a cada 15 dias. Hoje recusa pedidos por falta de uma segunda banheira.",
    finalidade: "Banheira elevada, secador soprador e adaptação da van.",
    meta: 10000, captadoBase: 6650, investidoresBase: 12, taxa: 1.6, prazo: 15, risco: "B",
    faturamento: 5600, avalista: "Filho, técnico de enfermagem",
  },
  {
    id: "vidracaria-cristal", negocio: "Vidraçaria Cristal", dono: "Reinaldo P.",
    cidade: "Salvador", uf: "BA", segmento: "Reparos", desde: 2014,
    resumo: "Box, espelhos e janelas sob medida para reformas pequenas.",
    descricao: "Atende reformas de apartamento e pequenos comércios. Perde serviços porque depende de outro vidraceiro para cortes maiores.",
    finalidade: "Mesa de corte para chapas grandes e ferramentas de instalação.",
    meta: 16000, captadoBase: 3500, investidoresBase: 7, taxa: 1.9, prazo: 24, risco: "C",
    faturamento: 7300, avalista: "Irmã, cabeleireira",
  },
];

export const CARTEIRA: Investimento[] = [
  { id: "inv-1", meiId: "cozinha-da-vila", valor: 2000, data: "2026-03-12", forma: "credito", parcelasPagas: 6 },
  { id: "inv-2", meiId: "atelie-linha-fina", valor: 1500, data: "2026-04-03", forma: "boleto", parcelasPagas: 5 },
  { id: "inv-3", meiId: "refrigeracao-polo-norte", valor: 1000, data: "2026-05-20", forma: "debito", parcelasPagas: 4 },
  { id: "inv-4", meiId: "mercearia-dois-irmaos", valor: 800, data: "2026-09-28", forma: "debito", parcelasPagas: 0 },
  { id: "inv-5", meiId: "pao-de-quintal", valor: 1200, data: "2026-10-15", forma: "credito", parcelasPagas: 0 },
];

export const RELATORIOS: Relatorio[] = [
  { meiId: "cozinha-da-vila", periodo: "2026-06", faturamento: 9100, emDia: true, nota: "Freezer entregue e instalado. Começamos a linha congelada com 6 pratos." },
  { meiId: "cozinha-da-vila", periodo: "2026-07", faturamento: 9900, emDia: true, nota: "Fechamos com mais uma empresa, 25 marmitas por dia." },
  { meiId: "cozinha-da-vila", periodo: "2026-08", faturamento: 10600, emDia: true, nota: "Seladora em uso. Congelados já são 18% das vendas." },
  { meiId: "cozinha-da-vila", periodo: "2026-09", faturamento: 10400, emDia: true, nota: "Mês com feriado, mas a linha congelada segurou o caixa." },
  { meiId: "cozinha-da-vila", periodo: "2026-10", faturamento: 11300, emDia: true, nota: "Contratei uma ajudante de meio período." },
  { meiId: "atelie-linha-fina", periodo: "2026-07", faturamento: 7600, emDia: true, nota: "Overloque comprada. Tempo de uniforme caiu de 40 para 25 minutos." },
  { meiId: "atelie-linha-fina", periodo: "2026-08", faturamento: 8400, emDia: true, nota: "Novo contrato de uniformes com uma clínica odontológica." },
  { meiId: "atelie-linha-fina", periodo: "2026-09", faturamento: 8200, emDia: true, nota: "Bancada reformada. Corte de tecido mais rápido e com menos perda." },
  { meiId: "atelie-linha-fina", periodo: "2026-10", faturamento: 9000, emDia: true, nota: "Pedido grande de fim de ano já confirmado." },
  { meiId: "refrigeracao-polo-norte", periodo: "2026-08", faturamento: 6900, emDia: true, nota: "Inverno fraco para instalação, foco em manutenção preventiva." },
  { meiId: "refrigeracao-polo-norte", periodo: "2026-09", faturamento: 8800, emDia: true, nota: "Calor chegou cedo. Agenda cheia nas duas últimas semanas." },
  { meiId: "refrigeracao-polo-norte", periodo: "2026-10", faturamento: 10100, emDia: false, nota: "Parcela paga com 4 dias de atraso por um cliente que atrasou. Regularizado." },
];

/* CDI de referência usado quando a BrasilAPI não responde (valor fixo da demo, % ao ano). */
export const CDI_REFERENCIA = 13.65;
