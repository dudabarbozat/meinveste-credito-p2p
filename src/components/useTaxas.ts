"use client";

import { useEffect, useState } from "react";
import { buscarTaxas, type Taxas } from "@/lib/brasilapi";
import { CDI_REFERENCIA } from "@/lib/dados";

export type EstadoTaxas =
  | { status: "carregando"; taxas: Taxas; aoVivo: false }
  | { status: "ok"; taxas: Taxas; aoVivo: true }
  | { status: "erro"; taxas: Taxas; aoVivo: false };

const REFERENCIA: Taxas = { cdi: CDI_REFERENCIA, selic: CDI_REFERENCIA + 0.1, ipca: 4.5 };

/** CDI/Selic/IPCA da BrasilAPI; se falhar, usa a referência fixa da demo. */
export function useTaxas(): EstadoTaxas {
  const [estado, setEstado] = useState<EstadoTaxas>({ status: "carregando", taxas: REFERENCIA, aoVivo: false });
  useEffect(() => {
    let vivo = true;
    buscarTaxas()
      .then((t) => vivo && setEstado({ status: "ok", taxas: t, aoVivo: true }))
      .catch(() => vivo && setEstado({ status: "erro", taxas: REFERENCIA, aoVivo: false }));
    return () => {
      vivo = false;
    };
  }, []);
  return estado;
}
