import { createFileRoute } from "@tanstack/react-router";
import { MessagesSquare, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat agente · FraudIA Claims" }] }),
  component: ChatPage,
});

interface Msg { role: "user" | "assistant"; content: string }

function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hola, soy el agente analítico de FraudIA. Puedo ayudarte a explorar siniestros, proveedores y alertas. ¿Qué quieres revisar?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    // Stub: respuesta determinista hasta integrar Lovable AI Gateway (paso 10/11)
    await new Promise((r) => setTimeout(r, 500));
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content:
          "Agente en modo demostración. La integración con el motor analítico y las 12 funciones (consulta de siniestros, ranking de proveedores, explicación de alertas) se conecta en el paso 10–11 del roadmap.",
      },
    ]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <MessagesSquare className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Chat agente</h1>
          <p className="text-sm text-muted-foreground">Conversa con el motor analítico</p>
        </div>
      </div>

      <Card className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/30">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                "max-w-[80%] rounded-lg px-3 py-2 text-sm " +
                (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border")
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-muted-foreground">El agente está escribiendo…</div>}
        <div ref={endRef} />
      </Card>

      <div className="mt-3 flex gap-2">
        <Input
          placeholder="Pregunta al agente…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
