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
      const response = await actor.queryAI(activeBusinessId, text);
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
