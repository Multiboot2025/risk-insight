import { createFileRoute } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

function ChatPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <MessagesSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Chat agente</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Conversa con el agente analítico sobre los siniestros y alertas.
      </p>
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        Próximamente — paso 10/11 del roadmap.
      </div>
    </div>
  );
}
