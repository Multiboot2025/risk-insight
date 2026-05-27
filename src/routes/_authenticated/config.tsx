import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/config")({
  head: () => ({ meta: [{ title: "Configuración · FraudIA Claims" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("config").select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      (data ?? []).forEach((r: any) => (map[r.key] = r.value));
      return map;
    },
  });

  const [verdeMax, setVerdeMax] = useState(40);
  const [amarilloMax, setAmarilloMax] = useState(75);
  const [destinatario, setDestinatario] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.umbrales) {
      setVerdeMax(data.umbrales.verde_max ?? 40);
      setAmarilloMax(data.umbrales.amarillo_max ?? 75);
    }
    if (data?.email_alertas) setDestinatario(data.email_alertas.destinatario ?? "");
  }, [data]);

  const save = async () => {
    setSaving(true);
    const { error: e1 } = await supabase.from("config").upsert({
      key: "umbrales",
      value: { verde_max: verdeMax, amarillo_max: amarilloMax },
      updated_at: new Date().toISOString(),
    });
    const { error: e2 } = await supabase.from("config").upsert({
      key: "email_alertas",
      value: { enviar_en: ["amarillo", "rojo"], destinatario },
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (e1 || e2) toast.error("Error al guardar");
    else {
      toast.success("Configuración guardada");
      qc.invalidateQueries({ queryKey: ["config"] });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-sm text-muted-foreground">Umbrales del motor y alertas</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Umbrales de riesgo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Score máximo para Verde</Label>
            <Input type="number" value={verdeMax} onChange={(e) => setVerdeMax(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">0 – {verdeMax} → Verde</p>
          </div>
          <div>
            <Label>Score máximo para Amarillo</Label>
            <Input type="number" value={amarilloMax} onChange={(e) => setAmarilloMax(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">{verdeMax + 1} – {amarilloMax} → Amarillo · {amarilloMax + 1} – 100 → Rojo</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alertas por email</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Destinatario</Label>
            <Input type="email" value={destinatario} onChange={(e) => setDestinatario(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Se enviará en casos amarillo y rojo</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        <Save className="h-4 w-4 mr-2" /> {saving ? "Guardando…" : "Guardar cambios"}
      </Button>
    </div>
  );
}
