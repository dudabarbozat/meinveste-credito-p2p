/* CSV para Excel em português: separador ";", vírgula decimal e BOM UTF-8. */

export const num = (v: number) => v.toFixed(2).replace(".", ",");

function celula(v: string | number) {
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function baixarCsv(nome: string, cabecalho: string[], linhas: (string | number)[][]) {
  const texto = "﻿" + [cabecalho, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
