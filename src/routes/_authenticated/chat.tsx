import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ShieldAlert, MessagesSquare } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat agente · FraudIA Claims" }] }),
  component: ChatPage,
});

function ToolPart({ part }: { part: any }) {
  const name = part.type?.replace("tool-", "") ?? "tool";
  const state = part.state;
  const label =
    state === "input-streaming" || state === "input-available"
      ? `Consultando ${name}…`
      : state === "output-error"
      ? `Error en ${name}`
      : `${name}`;
  return (
    <details className="mt-2 rounded-md border bg-muted/40 px-2 py-1 text-xs">
      <summary className="cursor-pointer select-none font-mono text-muted-foreground">
        🔧 {label}
      </summary>
      {part.input && (
        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[10px] text-muted-foreground">
          input: {JSON.stringify(part.input, null, 2)}
        </pre>
      )}
      {part.output && (
        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-[10px] text-muted-foreground">
          {JSON.stringify(part.output, null, 2)}
        </pre>
      )}
      {part.errorText && <pre className="mt-1 text-[10px] text-destructive">{part.errorText}</pre>}
    </details>
  );
}

function ChatPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (status === "ready") textareaRef.current?.focus();
  }, [status]);
  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSubmit = (msg: PromptInputMessage) => {
    const text = msg.text?.trim();
    if (!text) return;
    sendMessage({ text });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">Agente analítico</h1>
          <p className="text-xs text-muted-foreground">Explora siniestros, proveedores y alertas con lenguaje natural</p>
        </div>
      </div>

      <Conversation className="flex-1 rounded-lg border bg-card">
        <ConversationContent>
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={<MessagesSquare className="h-8 w-8" />}
              title="¿Qué quieres revisar?"
              description='Ej: "Muéstrame los siniestros rojos de Quito", "ranking de proveedores", "alertas recientes"'
            />
          )}
          {(messages as UIMessage[]).map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent variant={m.role === "user" ? "contained" : "flat"}>
                {m.parts?.map((part: any, i: number) => {
                  if (part.type === "text") {
                    return m.role === "assistant" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : (
                      <span key={i}>{part.text}</span>
                    );
                  }
                  if (part.type?.startsWith("tool-")) return <ToolPart key={i} part={part} />;
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent variant="flat">
                <Shimmer>Pensando…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="mt-3">
        <PromptInputTextarea ref={textareaRef} placeholder="Pregunta al agente…" />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} disabled={status !== "ready" && status !== "error"} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
