import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RiskBadge } from "@/components/risk-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/casos/")({
  head: () => ({ meta: [{ title: "Bandeja de casos · FraudIA Claims" }] }),
  component: CasosPage,
});

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
}

function CasosPage() {
  const [q, setQ] = useState("");
  const [riesgo, setRiesgo] = useState<string>("todos");
  const [ramo, setRamo] = useState<string>("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["casos-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("siniestros")
        .select("id_siniestro, fecha_reporte, ramo, ciudad, id_asegurado, monto_reclamado, nivel_riesgo, score_riesgo, estado, descripcion")
        .order("score_riesgo", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const ramos = useMemo(() => {
    const s = new Set<string>();
    data?.forEach((d) => d.ramo && s.add(d.ramo));
    return Array.from(s).sort();
  }, [data]);

  const rows = useMemo(() => {
    return (data ?? []).filter((d) => {
      if (riesgo !== "todos" && d.nivel_riesgo !== riesgo) return false;
      if (ramo !== "todos" && d.ramo !== ramo) return false;
      if (q) {
        const hay = `${d.id_asegurado ?? ""} ${d.descripcion ?? ""} ${d.ciudad ?? ""} ${d.id_siniestro}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [data, q, riesgo, ramo]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bandeja de casos</h1>
        <p className="text-sm text-muted-foreground">{rows.length} casos · ordenados por score de riesgo</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por asegurado, ciudad, descripción…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <Select value={riesgo} onValueChange={setRiesgo}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Riesgo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los niveles</SelectItem>
                <SelectItem value="rojo">Rojo</SelectItem>
                <SelectItem value="amarillo">Amarillo</SelectItem>
                <SelectItem value="verde">Verde</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ramo} onValueChange={setRamo}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Ramo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los ramos</SelectItem>
                {ramos.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Ramo</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Asegurado</TableHead>
                  <TableHead className="text-right">Reclamado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Riesgo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Cargando…</TableCell></TableRow>
                )}
                {!isLoading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Sin resultados.</TableCell></TableRow>
                )}
                {rows.map((s) => (
                  <TableRow key={s.id_siniestro} className="cursor-pointer hover:bg-muted/40" asChild>
                    <Link to="/casos/$id" params={{ id: s.id_siniestro }} className="contents">
                      <TableCell className="text-xs whitespace-nowrap">{s.fecha_reporte}</TableCell>
                      <TableCell className="text-sm">{s.ramo}</TableCell>
                      <TableCell className="text-sm">{s.ciudad}</TableCell>
                      <TableCell className="text-xs font-mono">{s.id_asegurado}</TableCell>
                      <TableCell className="text-sm text-right font-mono">{formatCOP(Number(s.monto_reclamado ?? 0))}</TableCell>
                      <TableCell className="text-xs capitalize">{s.estado}</TableCell>
                      <TableCell><RiskBadge nivel={s.nivel_riesgo} score={s.score_riesgo ?? undefined} /></TableCell>
                    </Link>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
