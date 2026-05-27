import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { ChatPanel } from "@/components/chat-panel";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat agente · FraudIA Claims" }] }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3 max-w-4xl mx-auto">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">Agente analítico</h1>
          <p className="text-xs text-muted-foreground">Explora siniestros, proveedores y alertas con lenguaje natural</p>
        </div>
      </div>
      <ChatPanel />
    </div>
  );
}
