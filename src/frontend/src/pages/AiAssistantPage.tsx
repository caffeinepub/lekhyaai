import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Bot, Brain, Loader2, Send, Sparkles, User, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useBusiness } from "../context/BusinessContext";
import { useActor } from "../hooks/useActor";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  "How much GST do I owe this month?",
  "Who hasn't paid me? Show overdue invoices",
  "Show my cash flow summary",
  "What is the GST rate for software services?",
  "Explain CGST vs SGST vs IGST",
  "What is the composition scheme?",
];

function formatMessageContent(content: string): React.ReactNode {
  // Highlight currency values
  const parts = content.split(/(₹[\s\d,]+(?:\.\d{2})?)/g);
  return parts.map((part, i) =>
    /^₹/.test(part) ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: static split segments with no reorder
      <strong key={i} className="text-primary font-bold">
        {part}
      </strong>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: static split segments with no reorder
      <span key={i}>{part}</span>
    ),
  );
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "नमस्ते! I'm LekhyaAI, your expert Indian Chartered Accountant AI assistant. I understand GST laws, double-entry accounting, and Indian tax regulations.\n\nI can help you with:\n• GST liability calculations (CGST/SGST/IGST)\n• Invoice and expense analysis\n• GSTIN validation\n• Tax optimization advice\n• Cash flow insights\n\nHow can I assist your business today?",
  timestamp: new Date(),
};

export default function AiAssistantPage() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change only
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
      // Compute answer locally using invoices + expenses data
      const q = text.toLowerCase();
      let response = "";

      const [allInvoices, allExpenses] = await Promise.all([
        actor.getInvoices(activeBusinessId),
        actor.getExpenses(activeBusinessId),
      ]);

      const now = Date.now();
      const monthStart = BigInt((now - 30 * 24 * 60 * 60 * 1000) * 1_000_000);

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
        response = `Current month GST summary:\n• Output GST (sales): ₹${(Number(outputGst) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n• Input GST (purchases): ₹${(Number(inputGst) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n• Net GST Payable: ₹${(Number(net) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      } else if (
        q.includes("overdue") ||
        q.includes("hasn't paid") ||
        q.includes("not paid")
      ) {
        const overdue = allInvoices.filter((i) => i.status === "overdue");
        response =
          overdue.length === 0
            ? "Great news — you have no overdue invoices right now!"
            : `You have ${overdue.length} overdue invoice(s) totalling ₹${(overdue.reduce((s, i) => s + Number(i.totalAmount), 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}.`;
      } else if (
        q.includes("cash flow") ||
        q.includes("receivable") ||
        q.includes("payable")
      ) {
        const receivables = allInvoices
          .filter((i) => i.status !== "paid")
          .reduce((s, i) => s + Number(i.totalAmount), 0);
        const payables = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
        response = `Cash Flow Summary:\n• Total Receivables (unpaid invoices): ₹${(receivables / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n• Total Payables (expenses): ₹${(payables / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      } else if (
        q.includes("igst") ||
        q.includes("cgst") ||
        q.includes("sgst") ||
        q.includes("intra") ||
        q.includes("inter")
      ) {
        response =
          "GST Types:\n• Intra-state transactions (same state): CGST + SGST (each at half the GST rate)\n• Inter-state transactions (different states): IGST (full GST rate)\n\nFor software services: 18% GST applies (9% CGST + 9% SGST for intra-state, or 18% IGST for inter-state).";
      } else if (q.includes("gstin") || q.includes("validate")) {
        response =
          "GSTIN Format: 15 characters\n• 2 digits: State code\n• 10 characters: PAN number\n• 1 digit: Entity number\n• 1 letter: Always 'Z'\n• 1 alphanumeric: Checksum\n\nExample: 27AAPFU0939F1ZV (Maharashtra)";
      } else if (q.includes("composition") || q.includes("scheme")) {
        response =
          "Composition Scheme:\n• Available for businesses with turnover up to ₹1.5 crore (₹75 lakh for some states)\n• Pays fixed percentage as tax (1% for traders, 2% for manufacturers, 5% for restaurants)\n• Cannot collect GST from customers\n• Cannot claim input tax credit\n• File quarterly returns (GSTR-4)";
      } else if (
        q.includes("invoice") &&
        (q.includes("count") || q.includes("total") || q.includes("how many"))
      ) {
        const paid = allInvoices.filter((i) => i.status === "paid").length;
        const draft = allInvoices.filter((i) => i.status === "draft").length;
        const sent = allInvoices.filter((i) => i.status === "sent").length;
        response = `Invoice Summary:\n• Total invoices: ${allInvoices.length}\n• Paid: ${paid}\n• Sent/Pending: ${sent}\n• Draft: ${draft}\n• Overdue: ${allInvoices.filter((i) => i.status === "overdue").length}`;
      } else if (q.includes("expense") || q.includes("spend")) {
        const total = allExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const monthExp = allExpenses
          .filter((e) => e.expenseDate >= monthStart)
          .reduce((s, e) => s + Number(e.amount), 0);
        response = `Expense Summary:\n• Total expenses: ₹${(total / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n• This month: ₹${(monthExp / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n• Total GST input credit: ₹${(allExpenses.reduce((s, e) => s + Number(e.gstAmount), 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      } else {
        response =
          "I'm your AI accounting assistant for LekhyaAI. I can help you with:\n• GST liability calculation\n• Overdue invoice tracking\n• Cash flow summary\n• CGST/SGST/IGST rules\n• GSTIN validation\n• Composition scheme\n• Invoice and expense summaries\n\nTry asking: 'How much GST do I owe?' or 'Show my overdue invoices'.";
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-4rem)] md:max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card">
        {/* Primary header row */}
        <div className="flex items-center gap-3 px-4 md:px-6 py-4">
          {/* Bot avatar with glowing ring */}
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
                AI-Powered GST Engine
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-success inline-block animate-pulse" />
              <p className="text-xs text-muted-foreground">
                Expert in Indian GST &amp; Tax Law
              </p>
            </div>
          </div>
        </div>

        {/* AI-Powered info banner */}
        <div className="mx-4 md:mx-6 mb-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/8 to-accent/5 p-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-xs font-semibold text-foreground">
                  Powered by LekhyaAI's Rule-Based GST Intelligence Engine
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Calculates tax liability, detects overdue invoices, and answers
                GST queries from your live business data — intra-state,
                inter-state, and composition scheme aware.
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Sparkles className="w-3 h-3 text-primary/60" />
                <p className="text-[10px] text-muted-foreground/70 italic">
                  Real-time LLM integration coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>
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
                "flex gap-3 max-w-[85%]",
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
                <div className="whitespace-pre-wrap break-words">
                  {msg.role === "assistant"
                    ? formatMessageContent(msg.content)
                    : msg.content}
                </div>
                <p
                  className={cn(
                    "text-[10px] mt-1.5 text-right",
                    msg.role === "assistant"
                      ? "text-muted-foreground"
                      : "text-primary-foreground/60",
                  )}
                >
                  {msg.timestamp.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
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
