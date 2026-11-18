# meinveste-credito-p2p

Protótipo do MEInveste, um marketplace de empréstimo entre pessoas e microempreendedores individuais (MEI). O investidor escolhe um negócio local aprovado e empresta direto para ele; o MEI recebe quando a meta de captação fecha e devolve em parcelas mensais. Mantém o conceito e a identidade do pitch e usa consultas reais à BrasilAPI no cadastro e na comparação de retorno.

Demo: https://dudabarbozat.github.io/meinveste-credito-p2p/

Portfólio pessoal. Projeto criado entre 2020 e 2023 e reimplementado em 2026 com Next.js e APIs públicas.

## Contexto

Pitch em equipe do projeto MEInveste, slogan "Investindo em Sonhos".

**Problema.** MEIs eram o grupo mais exposto na crise: pouca reserva de caixa e acesso a crédito que favorece empresas maiores, com histórico bancário. Dados usados no pitch:

- "mais de 10 milhões de microempreendedores individuais"
- "entre 30% e 40% do PIB brasileiro"
- "6 em cada 10 MEI's que já buscaram crédito… tiveram o pedido negado"
- "7 em cada 10… ganhando menos que um salário mínimo"
- "9 em cada 10… tiveram queda na renda"

**Proposta original.** Plataforma de empréstimo P2P. O MEI se cadastra, envia documentos financeiros e passa por análise de risco feita pelo time. A única exigência é um avalista, sem garantia de imóvel ou veículo. Aprovado, o negócio capta na plataforma. O investidor paga com cartão de crédito, débito ou boleto (o pitch previa integração com um adquirente). Quem bate a meta envia relatórios periódicos aos investidores. Diferenciais apontados: exportação de dados, foco no negócio local e visualização em gráficos. Concorrentes citados: BIVA e Nexoos.

**Equipe.**

- Eduarda Barboza (UX/design)
- Bianca Medeiros (desenvolvimento)
- Erik Gledson (desenvolvimento)
- Jhennifer Pimentel (marketing)
- Juliana Talita (UX/design)

## O protótipo

App mobile (o pitch apresenta o produto como app de celular): abas inferiores e, no desktop, a tela fica numa moldura de aparelho sobre o fundo do slide do mockup. A abertura reproduz o único mockup de tela do pitch.

Telas:

- `/` início: orientação curta na primeira visita, proposta, os quatro passos do slide "Como funciona?" e negócios perto de bater a meta.
- `/simulador/` simulador de crédito: valor, prazo e classe de risco (taxa da classe), parcela pela tabela Price, total, juros, taxa anual equivalente, peso no faturamento e cronograma. Leva os valores para o cadastro.
- `/cadastro/` cadastro do MEI em seis etapas: CNPJ consultado na BrasilAPI (razão social, nome fantasia, CNAE, município/UF, abertura, situação, opção pelo MEI), negócio com CEP consultado na BrasilAPI, pedido com prévia da parcela, documentos, avalista (CPF e telefone com máscara e validação) e revisão. Um CNPJ que não é optante pelo MEI bloqueia o avanço com aviso. Depois do envio: linha do tempo da análise e parecer de risco por regras (classe, pontos fortes, pontos de atenção, meta recomendada, recomendação), que usa os dados públicos do CNPJ consultado. O negócio aprovado é publicado na vitrine.
- `/vitrine/` negócios aprovados com barra de captação, filtros (cidade, segmento, captações abertas), ordenação (meta, retorno, risco), retorno anual equivalente comparado ao CDI do dia e legenda de risco e retorno.
- `/negocio/?id=` detalhe: números, comparação visual retorno x CDI, história, finalidade, análise, último relatório e ação de investir.
- `/investir/?id=` investimento em quatro etapas: valor (com simulação e CDI), forma de pagamento, confirmação com cronograma de recebimentos e ciência de risco, recibo (imprimir e baixar o cronograma em CSV).
- `/carteira/` painel do investidor: totais, próximos recebimentos, gráfico dos próximos 12 meses, divisão por segmento, investimentos (cada um abre um diálogo com o cronograma), relatórios mensais dos MEIs que bateram a meta e exportação CSV da carteira e dos relatórios.

Parcelas pela tabela Price. CSV gerado no navegador com separador `;`, vírgula decimal e BOM UTF-8, para abrir direto no Excel em português.

## APIs

| API | Uso |
|---|---|
| [BrasilAPI CNPJ](https://brasilapi.com.br/docs#tag/CNPJ) `GET /api/cnpj/v1/{cnpj}` | Preenche os dados da empresa e confere `opcao_pelo_mei` |
| [BrasilAPI CEP v2](https://brasilapi.com.br/docs#tag/CEP-V2) `GET /api/cep/v2/{cep}` | Preenche cidade e UF do ponto |
| [BrasilAPI Taxas](https://brasilapi.com.br/docs#tag/TAXAS) `GET /api/taxas/v1` | CDI do dia para comparar o retorno |

As três rotas da BrasilAPI respondem com CORS liberado e são chamadas direto do navegador, com tempo limite, estado de carregamento, mensagem de erro e ação de tentar de novo. Se a consulta de taxas falhar, a comparação usa um CDI fixo de referência e diz isso na tela. Se o CEP falhar, cidade e UF ficam para preencher à mão.

## Parecer de risco

O parecer é calculado no navegador por regras fixas, sem serviço externo:

- Peso da parcela no faturamento médio: até 15% favorece a classe A, até 25% a classe B, acima disso classe C.
- Tempo de atividade: contado em meses a partir da data de abertura informada pela consulta do CNPJ (ou do ano informado, quando não há consulta). A classe A exige 3 anos.
- Situação cadastral: se não for "ativa", a classe piora um nível e a aprovação fica condicionada à regularização.
- Atividade (CNAE): comércio e alimentação contam como demanda recorrente; moda e beleza, como vendas sazonais. Segmento informado diferente do sugerido pelo CNAE vira ponto de atenção.
- Avalista: renda que cobre 3 parcelas reforça o pedido; renda menor que a parcela vira ponto de atenção.
- Teto: a meta é reduzida para a parcela não passar de 35% do faturamento. A taxa vem da tabela da plataforma para a classe.

O selo do parecer indica se ele usou dados públicos do CNPJ ou só o que foi digitado (empresa de exemplo).

## O que é simulado

- Análise de risco: não há análise humana nem consulta a birôs de crédito; o parecer vem das regras acima.
- Negócios, pessoas, valores e relatórios da vitrine e da carteira são fictícios. O botão "Preencher com exemplo" usa uma empresa fictícia, sem consultar a API.
- Upload de documentos: o arquivo não é lido nem enviado; a demo guarda só nome e tamanho.
- Pagamento: nenhum dado de cartão é pedido e nada é cobrado. Boleto é dado como pago na hora.
- A data de referência da carteira é fixa (17/11/2026) e as parcelas pagas da carteira inicial são valores fixos.
- Não há login nem backend. O estado fica no `localStorage`, com "Restaurar dados de exemplo" no rodapé.

## Identidade visual

Cores, tipografia e logo vêm do PDF do pitch:

- Cores: lavanda `#D6D9EC`, fundo claro `#F6F6F9`, vinho `#8E2121` (destaques), tinta `#20201D`, tela do app `#FFF7F5`, as cores do logo (`#974063`, `#F34868`, `#FF9678`, `#2A3950`) e o verde `#00A69D` dos checks da tabela de concorrentes.
- Tipografia: Aileron nos títulos (`@fontsource/aileron`; o pacote não tem o peso Black dos slides, então os títulos usam o Heavy, 800), Inter no texto e Montserrat na marca, via `next/font/google`.
- Logo: o símbolo das três faixas com a casa foi recortado da capa do PDF (`public/img/logo-icone.png`, fundo transparente) e gera o favicon. O texto do logo usa o nome MEInveste.

## Stack

Next.js 15 (App Router, `output: "export"`), React 19, TypeScript estrito, CSS Modules com tokens em `globals.css`, Chart.js 4 com `react-chartjs-2`. Versões fixas em `package.json`.

## Como rodar

```
npm ci
npm run dev
```

Acessar http://localhost:3000/. Para gerar a versão estática: `npm run build` (saída em `out/`). Para testar com o caminho do GitHub Pages, definir `NEXT_PUBLIC_BASE_PATH=/meinveste-credito-p2p` antes do build e servir `out/` dentro de uma pasta com esse nome.

## Publicação

O workflow `.github/workflows/pages.yml` roda em cada push na `main`: instala com `npm ci`, gera o build com `NEXT_PUBLIC_BASE_PATH=/meinveste-credito-p2p`, adiciona `out/.nojekyll` e publica `out/` no GitHub Pages. No repositório, em Settings > Pages, a fonte deve ser "GitHub Actions".

## Estrutura

```
src/app/                 rotas (início, simulador, cadastro, vitrine, negocio, investir, carteira)
src/app/globals.css      tokens da identidade, moldura, componentes globais
src/components/          AppShell (moldura, abas, rodapé), CardMei, ícones SVG, diálogo, campos, avisos
src/lib/dados.ts         dados fictícios (MEIs, carteira inicial, relatórios)
src/lib/estado.ts        estado em localStorage
src/lib/financas.ts      tabela Price, cronograma, regras do parecer de risco
src/lib/brasilapi.ts     cliente da BrasilAPI (CNPJ, CEP, taxas)
src/lib/formato.ts       moeda, datas, máscaras, validação de CPF e CNPJ
public/img/              símbolo do logo e favicons
.github/workflows/       publicação no GitHub Pages
```

## Licença

MIT. Ver `LICENSE`.
