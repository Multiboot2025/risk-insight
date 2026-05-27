import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Acceso · FraudIA Claims" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, navigate]);

  const handle = async (mode: "in" | "up") => async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const fn = mode === "in" ? signIn : signUp;
    const { error } = await fn(email, password);
    setBusy(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(mode === "in" ? "Sesión iniciada" : "Cuenta creada");
      navigate({ to: "/dashboard", replace: true });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3 justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">FraudIA Claims</h1>
            <p className="text-xs text-muted-foreground">Detección asistida de fraude · Aseguradora del Sur</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acceso analistas</CardTitle>
            <CardDescription>Usa tu correo corporativo para acceder al panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="in">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="in">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="up">Crear cuenta</TabsTrigger>
              </TabsList>
              {(["in", "up"] as const).map((m) => (
                <TabsContent key={m} value={m}>
                  <form onSubmit={handle(m)} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor={`email-${m}`}>Correo</Label>
                      <Input id={`email-${m}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`pwd-${m}`}>Contraseña</Label>
                      <Input id={`pwd-${m}`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={m === "in" ? "current-password" : "new-password"} />
                    </div>
                    <Button type="submit" className="w-full" disabled={busy}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      {m === "in" ? "Entrar" : "Crear cuenta"}
                    </Button>
                  </form>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Prototipo de hackathon. Datos sintéticos · No usar con información real de clientes.
        </p>
      </div>
    </div>
  );
}
