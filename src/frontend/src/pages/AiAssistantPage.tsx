import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bot,
  Brain,
  History,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBusiness } from "../context/BusinessContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type StoredMessage,
  callLlamaApi,
  clearChatHistory,
  getChatHistory,
  getLlamaConfig,
  saveChatHistory,
} from "../utils/llamaAi";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
}

const QUICK_ACTIONS = [
  "How much GST do I owe this month?",
  "Who hasn't paid me? Show overdue invoices",
  "Predict my cash flow for next 3 months",
  "What GST rate applies to my products?",
  "Help me fix a GST calculation error",
  "What are my top 5 expenses?",
  "Am I eligible for composition scheme?",
  "Generate a GST liability summary",
  "Explain CGST vs SGST vs IGST",
];

function renderMessageContent(content: string): React.ReactNode {
  // Process markdown-like formatting
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Bold text
        const boldProcessed = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: static content
              <strong key={j} className="font-semibold text-foreground">
                {part.slice(2, -2)}
              </strong>
            );
          }
          // Highlight currency values
          const currencyParts = part.split(/(₹[\s\d,]+(?:\.\d{2})?)/g);
          return currencyParts.map((cp, k) =>
            cp.startsWith("₹") ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: static content
              <strong key={k} className="text-primary font-bold">
                {cp}
              </strong>
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: static content
              <span key={k}>{cp}</span>
            ),
          );
        });

        // Empty line = paragraph break
        if (line.trim() === "") {
          // biome-ignore lint/suspicious/noArrayIndexKey: static content
          return <div key={i} className="h-1" />;
        }

        // Bullet points
        if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: static content
            <div key={i} className="flex gap-2 items-start">
              <span className="text-primary/60 mt-0.5 flex-shrink-0">•</span>
              <span>{boldProcessed}</span>
            </div>
          );
        }

        // Numbered list
        const numberedMatch = line.trim().match(/^(\d+)\.\s(.+)/);
        if (numberedMatch) {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: static content
            <div key={i} className="flex gap-2 items-start">
              <span className="text-primary/60 font-mono text-xs mt-0.5 flex-shrink-0 w-4">
                {numberedMatch[1]}.
              </span>
              <span>{boldProcessed}</span>
            </div>
          );
        }

        // biome-ignore lint/suspicious/noArrayIndexKey: static content
        return <p key={i}>{boldProcessed}</p>;
      })}
    </div>
  );
}

function storedToMessage(s: StoredMessage): Message {
  return {
    id: s.id,
    role: s.role,
    content: s.content,
    timestamp: new Date(s.timestamp),
    model: s.model,
  };
}

function messageToStored(m: Message): StoredMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp.getTime(),
    model: m.model,
  };
}

export default function AiAssistantPage() {
  const { actor } = useActor();
  const { activeBusiness, activeBusinessId } = useBusiness();
  const { identity } = useInternetIdentity();
  const userPrincipal = identity?.getPrincipal().toString() ?? "anonymous";
  const bizId = activeBusinessId?.toString() ?? "0";

  const WELCOME_MESSAGE: Message = {
    id: "welcome",
    role: "assistant",
    content:
      "नमस्ते! I'm LekhyaAI, your expert Indian Chartered Accountant AI assistant. I understand GST laws, double-entry accounting, and Indian tax regulations.\n\nI can help you with:\n• GST liability calculations (CGST/SGST/IGST)\n• Invoice and expense analysis\n• Cash flow prediction\n• Tax optimization advice\n• GSTIN validation\n\nHow can I assist your business today?",
    timestamp: new Date(),
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = getChatHistory(userPrincipal, bizId);
    if (stored.length > 0) return stored.map(storedToMessage);
    return [WELCOME_MESSAGE];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const llamaCfg = getLlamaConfig();
  const hasApiKey = !!llamaCfg.apiKey;

  // Persist messages to localStorage
  // biome-ignore lint/correctness/useExhaustiveDependencies: persist on messages change
  useEffect(() => {
    const toStore = messages.filter((m) => m.id !== "welcome");
    if (toStore.length > 0) {
      saveChatHistory(userPrincipal, bizId, toStore.map(messageToStored));
    }
  }, [messages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change only
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function buildSystemPrompt(
    invoiceCount: number,
    paidCount: number,
    overdueCount: number,
    revenue: number,
    expenses: number,
    outputGst: number,
    inputGst: number,
  ): string {
    const now = new Date();
    const year =
      now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const netGst = Math.max(0, outputGst - inputGst);

    return `You are LekhyaAI, an expert Indian Chartered Accountant AI assistant for Indian SMEs.
Business: ${activeBusiness?.name ?? "Unknown"}, State: ${activeBusiness?.state ?? "Unknown"}, GSTIN: ${activeBusiness?.gstin ?? "Not Set"}
Current Financial Year: April ${year} – March ${year + 1}

Your responsibilities:
- Follow Indian GST laws strictly (CGST/SGST for intra-state, IGST for inter-state)
- Use double-entry accounting principles
- Explain financial concepts in simple Indian business language
- Give legally compliant tax optimization suggestions (never advise tax evasion)
- Currency is INR. Format as ₹1,25,000
- Indian Financial Year is April to March

Business Data Summary:
- Total Invoices: ${invoiceCount}, Paid: ${paidCount}, Overdue: ${overdueCount}
- Total Revenue (paid invoices): ₹${(revenue / 100).toLocaleString("en-IN")}
- Total Expenses: ₹${(expenses / 100).toLocaleString("en-IN")}
- Current month Output GST: ₹${(outputGst / 100).toLocaleString("en-IN")}
- Current month Input GST: ₹${(inputGst / 100).toLocaleString("en-IN")}
- Net GST Payable: ₹${(netGst / 100).toLocaleString("en-IN")}

When user asks about bugs/issues/errors: Provide a step-by-step checklist to diagnose and fix the problem based on their data.
When user asks about cash flow: Analyze their invoice and expense trends and predict next 3 months.
Always be professional but friendly. Format financial outputs as ₹ X,XX,XXX`;
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading || !actor || activeBusinessId === null)
      return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const [allInvoices, allExpenses] = await Promise.all([
        actor.getInvoices(activeBusinessId),
        actor.getExpenses(activeBusinessId),
      ]);

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
      let usedModel: string | undefined;

      if (hasApiKey) {
        // Build conversation history for Qwen (last 10 messages for context)
        const systemPrompt = buildSystemPrompt(
          allInvoices.length,
          paidCount,
          overdueCount,
          revenue,
          expenses,
          outputGst,
          inputGst,
        );

        const historyMsgs = messages
          .filter((m) => m.id !== "welcome" && m.role !== "assistant")
          .slice(-8)
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

        const apiMessages = [
          { role: "system" as const, content: systemPrompt },
          ...historyMsgs,
          { role: "user" as const, content: text },
        ];

        try {
          responseContent = await callLlamaApi(apiMessages);
          usedModel = llamaCfg.model;
        } catch (apiErr: unknown) {
          const errMsg = apiErr instanceof Error ? apiErr.message : "Unknown";
          if (errMsg === "CORS_ERROR") {
            responseContent =
              "⚠️ Unable to reach Llama AI (Groq). This may be a network issue.\n\nFalling back to rule-based responses. Please check your API key and network connection.";
          } else if (errMsg === "INVALID_API_KEY") {
            responseContent =
              "⚠️ Invalid Groq API key. Get your free key at console.groq.com and update it in Settings > AI Engine Configuration.";
          } else if (errMsg === "RATE_LIMIT") {
            responseContent =
              "⚠️ Groq rate limit reached. Free tier allows 30 requests/minute. Please wait a moment and try again.";
          } else {
            // Fallback to rule-based
            responseContent = getRuleBasedResponse(
              text,
              allInvoices,
              allExpenses,
              monthStart,
            );
          }
        }
      } else {
        responseContent = getRuleBasedResponse(
          text,
          allInvoices,
          allExpenses,
          monthStart,
        );
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
        model: usedModel,
      };
      setMessages((p) => [...p, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "I'm having trouble processing your request right now. Please check your internet connection and try again.",
        timestamp: new Date(),
      };
      setMessages((p) => [...p, errMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleClearHistory() {
    clearChatHistory(userPrincipal, bizId);
    setMessages([WELCOME_MESSAGE]);
    toast.success("Chat history cleared.");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] md:max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        <div className="flex items-center gap-3 px-4 md:px-6 py-4">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-xl bg-primary/40 blur-md scale-110 animate-pulse" />
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-lg text-foreground leading-tight">
                AI Accountant
              </h1>
              <Badge
                className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20 font-medium"
                variant="outline"
              >
                <Zap className="w-2.5 h-2.5 mr-1 fill-current" />
                {hasApiKey ? "Llama AI Powered" : "Rule-Based Engine"}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn(
                  "w-2 h-2 rounded-full inline-block",
                  hasApiKey ? "bg-success animate-pulse" : "bg-warning",
                )}
              />
              <p className="text-xs text-muted-foreground">
                Expert in Indian GST &amp; Tax Law
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-ocid="ai_assistant.clear_history_button"
              onClick={handleClearHistory}
              title="Clear chat history"
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Chat history"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Warning banner if no API key */}
        {!hasApiKey && (
          <div
            className="mx-4 md:mx-6 mb-3 rounded-xl border border-warning/30 bg-warning/10 p-3"
            data-ocid="ai_assistant.api_key_warning"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-warning font-medium">
                  Configure your free Groq API key in{" "}
                  <Link to="/settings" className="underline font-semibold">
                    Settings &gt; AI Engine
                  </Link>{" "}
                  to enable live Llama AI responses. Get your key at{" "}
                  <span className="font-semibold">console.groq.com</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI info banner */}
        {hasApiKey && (
          <div className="mx-4 md:mx-6 mb-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/8 to-accent/5 p-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Brain className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  Meta {llamaCfg.model} via Groq · LekhyaAI GST Intelligence
                  Engine
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  Live Llama AI with access to your business data — GST
                  calculations, invoice analysis, cash flow predictions, and
                  Indian tax guidance.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin"
        data-ocid="ai_assistant.messages_list"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3 max-w-[90%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "",
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  msg.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-full",
                  msg.role === "assistant"
                    ? "bg-card border border-border text-foreground rounded-tl-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm",
                )}
              >
                <div className="text-sm">
                  {msg.role === "assistant"
                    ? renderMessageContent(msg.content)
                    : msg.content}
                </div>
                <div
                  className={cn(
                    "flex items-center justify-between gap-2 mt-1.5",
                    msg.role === "assistant"
                      ? "text-muted-foreground"
                      : "text-primary-foreground/60",
                  )}
                >
                  <p className="text-[10px]">
                    {msg.timestamp.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {msg.role === "assistant" && msg.model && (
                    <p className="text-[10px] text-muted-foreground/60 italic">
                      via {msg.model}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
            data-ocid="ai_assistant.loading_state"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <div className="px-4 md:px-6 pb-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Quick questions
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                type="button"
                key={action}
                data-ocid="ai_assistant.quick_action_button"
                onClick={() => void sendMessage(action)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors border border-border"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 md:px-6 py-4 border-t border-border bg-card flex-shrink-0">
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 items-center"
          data-ocid="ai_assistant.input_form"
        >
          <Input
            ref={inputRef}
            data-ocid="ai_assistant.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about GST, invoices, or your finances…"
            disabled={isLoading}
            className="flex-1 h-11 bg-background"
            autoComplete="off"
          />
          <Button
            type="submit"
            data-ocid="ai_assistant.send_button"
            disabled={isLoading || !input.trim()}
            className="h-11 w-11 p-0 bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          AI advice is indicative. Consult a CA for official tax filings.
        </p>
      </div>
    </div>
  );
}

// ─── Rule-based fallback responses ────────────────────────────────
function getRuleBasedResponse(
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

  if (
    q.includes("gst") &&
    (q.includes("owe") || q.includes("liability") || q.includes("how much"))
  ) {
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
    return `**Current Month GST Summary:**\n• Output GST (sales): ₹${(Number(outputGst) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n• Input GST (purchases): ₹${(Number(inputGst) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n• Net GST Payable: ₹${(Number(net) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  }

  if (
    q.includes("overdue") ||
    q.includes("hasn't paid") ||
    q.includes("not paid")
  ) {
    const overdue = allInvoices.filter((i) => i.status === "overdue");
    if (overdue.length === 0)
      return "Great news — you have no overdue invoices right now!";
    return `You have **${overdue.length}** overdue invoice(s) totalling ₹${(overdue.reduce((s, i) => s + Number(i.totalAmount), 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}.`;
  }

  if (
    q.includes("cash flow") ||
    q.includes("predict") ||
    q.includes("forecast")
  ) {
    const paid = allInvoices.filter((i) => i.status === "paid");
    const monthlyRev =
      paid.reduce((s, i) => s + Number(i.totalAmount), 0) /
      100 /
      Math.max(1, paid.length / 4);
    const monthlyExp =
      allExpenses.reduce((s, e) => s + Number(e.amount), 0) / 100 / 3;
    return `**Cash Flow Forecast (Next 3 Months):**\n\nBased on your historical data:\n• Projected Monthly Revenue: ₹${monthlyRev.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n• Projected Monthly Expenses: ₹${monthlyExp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n• Estimated Net Cash Flow: ₹${(monthlyRev - monthlyExp).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n\nNote: For more accurate AI predictions, configure your Groq API key in Settings.`;
  }

  if (
    q.includes("igst") ||
    q.includes("cgst") ||
    q.includes("sgst") ||
    q.includes("intra") ||
    q.includes("inter")
  ) {
    return "**GST Types:**\n• **Intra-state transactions** (same state): CGST + SGST (each at half the GST rate)\n• **Inter-state transactions** (different states): IGST (full GST rate)\n\nFor software services: 18% GST applies (9% CGST + 9% SGST intra-state, or 18% IGST inter-state).";
  }

  if (q.includes("composition") || q.includes("scheme")) {
    return "**Composition Scheme:**\n• Available for businesses with turnover up to ₹1.5 crore\n• Pays fixed percentage as tax:\n  - 1% for traders\n  - 2% for manufacturers\n  - 5% for restaurants\n• Cannot collect GST from customers\n• Cannot claim input tax credit\n• File quarterly returns (GSTR-4)";
  }

  if (q.includes("expense") || q.includes("spend") || q.includes("top 5")) {
    const total = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
    return `**Expense Summary:**\n• Total expenses: ₹${(total / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n• Total GST input credit: ₹${(allExpenses.reduce((s, e) => s + Number(e.gstAmount), 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n\nTip: Configure your Groq API key (console.groq.com) for detailed Llama AI expense analysis.`;
  }

  if (
    q.includes("invoice") &&
    (q.includes("count") || q.includes("total") || q.includes("how many"))
  ) {
    const paid = allInvoices.filter((i) => i.status === "paid").length;
    return `**Invoice Summary:**\n• Total invoices: ${allInvoices.length}\n• Paid: ${paid}\n• Overdue: ${allInvoices.filter((i) => i.status === "overdue").length}\n• Draft: ${allInvoices.filter((i) => i.status === "draft").length}`;
  }

  return "I'm your AI accounting assistant for LekhyaAI. I can help you with:\n• GST liability calculation\n• Overdue invoice tracking\n• Cash flow predictions\n• CGST/SGST/IGST rules\n• Composition scheme\n• Invoice and expense summaries\n\nTip: Configure your **free Groq API key** (console.groq.com) in Settings to unlock full **Llama AI**-powered responses!";
}
