/**
 * Floating AI chat widget that appears on all pages.
 * Shares chat history with AiAssistantPage via localStorage.
 * Hidden on /ai-assistant page.
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { Bot, ExternalLink, Loader2, Send, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useBusiness } from "../context/BusinessContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  LS_KEY_API_KEY,
  type StoredMessage,
  callLlamaApi,
  getChatHistory,
  getLlamaConfig,
  saveChatHistory,
} from "../utils/llamaAi";

interface WidgetMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function storedToWidget(s: StoredMessage): WidgetMessage {
  return {
    id: s.id,
    role: s.role,
    content: s.content,
    timestamp: new Date(s.timestamp),
  };
}

function widgetToStored(m: WidgetMessage): StoredMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp.getTime(),
  };
}

const WIDGET_WELCOME: WidgetMessage = {
  id: "widget-welcome",
  role: "assistant",
  content: "नमस्ते! Ask me anything about GST, invoices, or your finances.",
  timestamp: new Date(),
};

export default function FloatingAiWidget() {
  const location = useLocation();
  const { actor } = useActor();
  const { activeBusiness, activeBusinessId } = useBusiness();
  const { identity } = useInternetIdentity();
  const userPrincipal = identity?.getPrincipal().toString() ?? "anonymous";
  const bizId = activeBusinessId?.toString() ?? "0";

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>(() => {
    const stored = getChatHistory(userPrincipal, bizId);
    if (stored.length > 0) {
      return stored.slice(-20).map(storedToWidget);
    }
    return [WIDGET_WELCOME];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [llamaCfg, setLlamaCfg] = useState(() => getLlamaConfig());
  const hasApiKey = !!llamaCfg.apiKey;

  // Re-read Groq key whenever the widget is opened (covers same-tab Settings saves)
  useEffect(() => {
    if (isOpen) {
      setLlamaCfg(getLlamaConfig());
    }
  }, [isOpen]);

  // Also sync on cross-tab storage changes
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === LS_KEY_API_KEY || e.key === null) {
        setLlamaCfg(getLlamaConfig());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Don't show on /ai-assistant page
  const isAiPage = location.pathname === "/ai-assistant";

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message change
  useEffect(() => {
    if (isOpen && !isAiPage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isOpen, isAiPage]);

  if (isAiPage) return null;

  function handleOpen() {
    setIsOpen(true);
    setUnreadCount(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function sendWidgetMessage(text: string) {
    if (!text.trim() || isLoading || activeBusinessId === null) return;

    // Always read the freshest API key from localStorage at call time
    const freshCfg = getLlamaConfig();
    setLlamaCfg(freshCfg);

    const userMsg: WidgetMessage = {
      id: `w-user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // actor may be null on non-authenticated pages; fall back to rule-based gracefully
      const [allInvoices, allExpenses] = actor
        ? await Promise.all([
            actor.getInvoices(activeBusinessId),
            actor.getExpenses(activeBusinessId),
          ])
        : [[], []];

      const now = Date.now();
      const monthStart = BigInt((now - 30 * 24 * 60 * 60 * 1000) * 1_000_000);

      let outputGst = 0;
      let inputGst = 0;
      let revenue = 0;
      let expenses = 0;
      let paidCount = 0;
      let overdueCount = 0;

      for (const inv of allInvoices) {
        if (inv.status === "paid") {
          paidCount++;
          revenue += Number(inv.totalAmount);
        }
        if (inv.status === "overdue") overdueCount++;
        if (
          inv.invoiceDate >= monthStart &&
          (inv.status === "sent" || inv.status === "paid")
        ) {
          outputGst += Number(inv.cgst) + Number(inv.sgst) + Number(inv.igst);
        }
      }
      for (const exp of allExpenses) {
        expenses += Number(exp.amount);
        if (exp.expenseDate >= monthStart) inputGst += Number(exp.gstAmount);
      }

      let responseContent: string;

      if (freshCfg.apiKey) {
        const year =
          new Date().getMonth() >= 3
            ? new Date().getFullYear()
            : new Date().getFullYear() - 1;
        const systemPrompt = `You are LekhyaAI, a brief and helpful Indian CA AI assistant.
Business: ${activeBusiness?.name ?? "Unknown"}, State: ${activeBusiness?.state ?? "Unknown"}, FY: April ${year}–March ${year + 1}
Data: ${allInvoices.length} invoices (paid:${paidCount}, overdue:${overdueCount}), Revenue:₹${(revenue / 100).toLocaleString("en-IN")}, Expenses:₹${(expenses / 100).toLocaleString("en-IN")}, Output GST:₹${(outputGst / 100).toLocaleString("en-IN")}, Input GST:₹${(inputGst / 100).toLocaleString("en-IN")}
Be concise (2-4 sentences). Format money as ₹X,XX,XXX. Follow Indian GST laws.`;

        const recentHistory = messages
          .filter((m) => m.id !== "widget-welcome")
          .slice(-4)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

        try {
          responseContent = await callLlamaApi(
            [
              { role: "system", content: systemPrompt },
              ...recentHistory,
              { role: "user", content: text },
            ],
            freshCfg,
          );
        } catch (apiErr: unknown) {
          const errMsg = apiErr instanceof Error ? apiErr.message : "Unknown";
          if (errMsg === "INVALID_API_KEY") {
            responseContent =
              "Invalid Groq API key. Please update it in Settings > AI Engine.";
          } else if (errMsg === "RATE_LIMIT") {
            responseContent =
              "Groq rate limit reached. Please wait a moment and try again.";
          } else {
            responseContent = getWidgetRuleBasedResponse(
              text,
              allInvoices,
              allExpenses,
              monthStart,
            );
          }
        }
      } else {
        responseContent = getWidgetRuleBasedResponse(
          text,
          allInvoices,
          allExpenses,
          monthStart,
        );
      }

      const aiMsg: WidgetMessage = {
        id: `w-ai-${Date.now()}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };
      setMessages((p) => [...p, aiMsg]);

      // Save to shared history
      const allMessages = [...messages, userMsg, aiMsg].filter(
        (m) => m.id !== "widget-welcome",
      );
      saveChatHistory(userPrincipal, bizId, allMessages.map(widgetToStored));

      if (!isOpen) {
        setUnreadCount((p) => p + 1);
      }
    } catch {
      setMessages((p) => [
        ...p,
        {
          id: `w-err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendWidgetMessage(input);
  }

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            data-ocid="floating_ai.open_modal_button"
            onClick={handleOpen}
            className={cn(
              "fixed z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center",
              "bottom-24 right-4 md:bottom-6 md:right-6",
              "hover:scale-110 transition-transform",
            )}
            aria-label="Open AI Assistant"
          >
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-60" />
            <Bot className="w-6 h-6 relative z-10" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center z-20">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (mobile only) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              data-ocid="floating_ai.dialog"
              className={cn(
                "fixed z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden",
                // Mobile: full-width, bottom sheet style
                "left-0 right-0 bottom-0 h-[70vh] rounded-b-none",
                // Desktop: fixed size, bottom right
                "md:left-auto md:right-6 md:bottom-6 md:w-[380px] md:h-[500px] md:rounded-2xl",
              )}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    LekhyaAI Assistant
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        hasApiKey ? "bg-success animate-pulse" : "bg-warning",
                      )}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {hasApiKey ? "Llama AI Active" : "Rule-based mode"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to="/app/ai-assistant"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Open full chat"
                    data-ocid="floating_ai.open_full_chat.link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    data-ocid="floating_ai.close_button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-2 max-w-[90%]",
                        msg.role === "user" ? "ml-auto flex-row-reverse" : "",
                      )}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                          msg.role === "assistant"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted",
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <Bot className="w-3 h-3" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "rounded-xl px-3 py-2 text-xs leading-relaxed",
                          msg.role === "assistant"
                            ? "bg-muted text-foreground rounded-tl-sm"
                            : "bg-primary text-primary-foreground rounded-tr-sm",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-border flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    data-ocid="floating_ai.input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything…"
                    disabled={isLoading}
                    className="flex-1 h-9 text-sm bg-background"
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    data-ocid="floating_ai.send_button"
                    disabled={isLoading || !input.trim()}
                    className="h-9 w-9 p-0 bg-primary text-primary-foreground flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </form>
                <Link
                  to="/app/ai-assistant"
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-[10px] text-primary hover:underline mt-1.5"
                  data-ocid="floating_ai.full_chat.link"
                >
                  Open full chat →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Widget rule-based fallback ────────────────────────────────────
function getWidgetRuleBasedResponse(
  text: string,
  allInvoices: Array<{
    status: string;
    invoiceDate: bigint;
    totalAmount: bigint;
    cgst: bigint;
    sgst: bigint;
    igst: bigint;
  }>,
  allExpenses: Array<{
    expenseDate: bigint;
    amount: bigint;
    gstAmount: bigint;
  }>,
  monthStart: bigint,
): string {
  const q = text.toLowerCase();

  if (q.includes("gst") && (q.includes("owe") || q.includes("liability"))) {
    let outputGst = 0n;
    let inputGst = 0n;
    for (const inv of allInvoices) {
      if (
        inv.invoiceDate >= monthStart &&
        (inv.status === "sent" || inv.status === "paid")
      ) {
        outputGst += inv.cgst + inv.sgst + inv.igst;
      }
    }
    for (const exp of allExpenses) {
      if (exp.expenseDate >= monthStart) inputGst += exp.gstAmount;
    }
    const net = outputGst > inputGst ? outputGst - inputGst : 0n;
    return `Net GST Payable this month: ₹${(Number(net) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  if (q.includes("overdue")) {
    const overdue = allInvoices.filter((i) => i.status === "overdue");
    return overdue.length === 0
      ? "No overdue invoices! 🎉"
      : `${overdue.length} overdue invoice(s) totalling ₹${(overdue.reduce((s, i) => s + Number(i.totalAmount), 0) / 100).toLocaleString("en-IN")}`;
  }

  return "I can help with GST calculations, overdue invoices, and financial analysis. Try asking 'How much GST do I owe?' or configure your **Groq API key** in Settings > AI Engine for full Llama AI responses.";
}
