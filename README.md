# MEInveste — crédito P2P para MEIs

Marketplace de empréstimo entre pessoas e microempreendedores individuais: o investidor escolhe um negócio local aprovado, empresta direto para ele e recebe em parcelas mensais.

**Demo:** https://dudabarbozat.github.io/meinveste-credito-p2p/

Projeto de pitch em equipe ("Investindo em Sonhos"), criado entre 2020 e 2023 e reconstruído em 2026 como protótipo navegável.

## Para quem

MEIs que têm crédito negado nos bancos por falta de garantia ou histórico, e investidores que querem apoiar negócios locais com retorno acima do CDI.

## Funcionalidades

- **Simulador de crédito** pela tabela Price, com peso da parcela no faturamento e cronograma.
- **Cadastro do MEI** em etapas, com CNPJ e CEP consultados na BrasilAPI e bloqueio para quem não é optante pelo MEI.
- **Parecer de risco** por regras (faturamento, tempo de atividade, situação cadastral, CNAE e avalista).
- **Vitrine** de negócios com barra de captação, filtros e retorno comparado ao CDI do dia.
- **Investimento** em etapas, com cronograma de recebimentos e recibo.
- **Carteira do investidor** com próximos recebimentos, gráficos, relatórios dos MEIs e exportação CSV.

## Stack

Next.js 15 (exportação estática) · React 19 · TypeScript · Chart.js

| API | Uso |
|-----|-----|
| [BrasilAPI](https://brasilapi.com.br/docs) — CNPJ, CEP v2 e Taxas | Dados da empresa, cidade e CDI do dia |

Sem backend e sem chaves de API.

## Como rodar

```bash
npm ci
npm run dev
```

## Limitações do protótipo

Negócios, pessoas, valores e relatórios são fictícios. Não há análise humana, consulta a birôs, upload real de documentos nem cobrança. Os dados ficam no navegador.

## Equipe

- Eduarda Barboza — UX/design
- Bianca Medeiros — desenvolvimento
- Erik Gledson — desenvolvimento
- Jhennifer Pimentel — marketing
- Juliana Talita — UX/design

## Licença

Código sob [MIT](LICENSE).
