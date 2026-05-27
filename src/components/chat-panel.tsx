import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessagesSquare } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { useQuery } from "@tanstack/react-query";

function ToolPart({ part }: { part: any }) {
  const name = part.type?.replace("tool-", "") ?? "tool";
  const state = part.state;
  const label =
    state === "input-streaming" || state === "input-available"
      ? `Consultando ${name}…`
      : state === "output-error"
      ? `Error en ${name}`
      : name;
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

async function loadHistory(): Promise<UIMessage[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from("chat_history")
    .select("id,role,content,created_at")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error || !data) return [];
  return data
    .filter((r) => r.role === "user" || r.role === "assistant")
    .map((r) => ({
      id: r.id,
      role: r.role as "user" | "assistant",
      parts: [{ type: "text", text: r.content ?? "" }],
    })) as UIMessage[];
}

export function ChatPanel({ compact = false }: { compact?: boolean }) {
  const { data: history } = useQuery({
    queryKey: ["chat_history"],
    queryFn: loadHistory,
    staleTime: 60_000,
  });

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async () => {
          const { data: { session } } = await supabase.auth.getSession();
          return session ? { Authorization: `Bearer ${session.access_token}` } : {};
        },
      }),
    [],
  );

  const { messages, sendMessage, status, setMessages } = useChat({ transport });

  // Hidratar historial cuando llega
  useEffect(() => {
    if (history && history.length && messages.length === 0) {
      setMessages(history);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (status === "ready") textareaRef.current?.focus();
  }, [status]);

  const handleSubmit = (msg: PromptInputMessage) => {
    const text = msg.text?.trim();
    if (!text) return;
    sendMessage({ text });
  };

  return (
    <div className={`flex flex-col ${compact ? "h-full" : "h-[calc(100vh-9rem)] max-w-4xl mx-auto"}`}>
      <Conversation className="flex-1 rounded-lg border bg-card">
        <ConversationContent>
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={<MessagesSquare className="h-8 w-8" />}
              title="¿Qué quieres revisar?"
              description='Ej: "siniestros rojos", "ranking de proveedores", "alertas recientes"'
            />
          )}
          {(messages as UIMessage[]).map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent className={m.role === "assistant" ? "bg-transparent p-0" : ""}>
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
              <MessageContent className="bg-transparent p-0">
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
