import { useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChatPanel } from "@/components/chat-panel";

export function ChatFab() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  if (pathname.startsWith("/chat")) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          aria-label="Abrir agente"
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-4 gap-3">
        <SheetHeader className="p-0">
          <SheetTitle>Agente analítico</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <ChatPanel compact />
        </div>
      </SheetContent>
    </Sheet>
  );
}
