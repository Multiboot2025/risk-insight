import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/proveedores")({
  head: () => ({ meta: [{ title: "Proveedores · FraudIA Claims" }] }),
  component: ProveedoresPage,
});

function ProveedoresPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["proveedores-ranking"],
    queryFn: async () => {
      const { data: provs, error } = await supabase
        .from("proveedores")
        .select("*")
        .order("casos_observados_anio", { ascending: false });
      if (error) throw error;

      // Conteo de siniestros por proveedor
      const { data: sinis } = await supabase.from("siniestros").select("id_proveedor, nivel_riesgo");
      const counts: Record<string, { total: number; rojo: number; amarillo: number }> = {};
      (sinis ?? []).forEach((s: any) => {
        if (!s.id_proveedor) return;
        counts[s.id_proveedor] ??= { total: 0, rojo: 0, amarillo: 0 };
        counts[s.id_proveedor].total++;
        if (s.nivel_riesgo === "rojo") counts[s.id_proveedor].rojo++;
        if (s.nivel_riesgo === "amarillo") counts[s.id_proveedor].amarillo++;
      });

      return (provs ?? []).map((p: any) => ({ ...p, ...(counts[p.id_proveedor] ?? { total: 0, rojo: 0, amarillo: 0 }) }));
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-sm text-muted-foreground">Ranking por reincidencia y nivel de riesgo</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Ranking de proveedores</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead className="text-right">Casos observados (12m)</TableHead>
                  <TableHead className="text-right">Siniestros totales</TableHead>
                  <TableHead className="text-right">Rojo / Amarillo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((p: any) => (
                  <TableRow key={p.id_proveedor}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell className="capitalize">{p.tipo}</TableCell>
                    <TableCell>{p.ciudad}</TableCell>
                    <TableCell className="text-right">{p.casos_observados_anio ?? 0}</TableCell>
                    <TableCell className="text-right">{p.total}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-risk-rojo font-semibold">{p.rojo}</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-risk-amarillo-foreground font-semibold">{p.amarillo}</span>
                    </TableCell>
                    <TableCell>
                      {p.en_lista_restrictiva ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" /> Restrictiva
                        </Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
