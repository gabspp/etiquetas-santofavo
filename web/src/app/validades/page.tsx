import { createClient } from "@/lib/supabase/server";
import { ValidadesScreen } from "./_components/validades-screen";

export default async function ValidadesPage() {
  const supabase = await createClient();

  const [{ data: etiquetas }, { data: responsaveis }] = await Promise.all([
    supabase
      .from("etiquetas")
      .select("*, products(name), recipes(title)")
      .eq("status", "ativa")
      .order("data_validade", { ascending: true }),
    supabase.from("responsaveis").select("*").eq("ativo", true).order("nome"),
  ]);

  return (
    <ValidadesScreen
      etiquetasIniciais={etiquetas ?? []}
      responsaveis={responsaveis ?? []}
    />
  );
}
