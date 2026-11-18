import type { Metadata } from "next";
import { Vitrine } from "./Vitrine";

export const metadata: Metadata = { title: "Vitrine" };

export default function Page() {
  return <Vitrine />;
}
