import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useBusiness } from "../context/BusinessContext";
import {
  useAccounts,
  useCreateInvoice,
  useCreateJournalEntry,
  useCustomers,
} from "../hooks/useQueries";
import { formatINRNumber } from "../utils/formatINR";
import { callLlamaApi, getLlamaConfig } from "../utils/llamaAi";

interface ParsedItem {
  name: string;
  qty: number;
  rate: number;
  gstRate: number;
  hsnCode: string;
}

interface ParsedInvoice {
  partyName: string;
  partyGSTIN: string;
  items: ParsedItem[];
  notes: string;
}

interface ComputedInvoice extends ParsedInvoice {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstTotal: number;
  total: number;
  isIntraState: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  parsed?: ComputedInvoice;
  isLoading?: boolean;
}

function computeInvoiceFromParsed(
  parsed: ParsedInvoice,
  businessState: string,
  partyState: string,
): ComputedInvoice {
  const isIntraState =
    businessState.toLowerCase() === partyState.toLowerCase() || !partyState;

  let subtotal = 0;
  let gstTotal = 0;

  for (const item of parsed.items) {
    const lineTotal = item.qty * item.rate;
    const lineGst = lineTotal * (item.gstRate / 100);
    subtotal += lineTotal;
    gstTotal += lineGst;
  }

  const cgst = isIntraState ? gstTotal / 2 : 0;
  const sgst = isIntraState ? gstTotal / 2 : 0;
  const igst = isIntraState ? 0 : gstTotal;

  return {
    ...parsed,
    subtotal,
    cgst,
    sgst,
    igst,
    gstTotal,
    total: subtotal + gstTotal,
    isIntraState,
  };
}

function InvoicePreviewCard({
  invoice,
  onApprove,
  onEdit,
  isPosting,
}: {
  invoice: ComputedInvoice;
  onApprove: () => void;
  onEdit: () => void;
  isPosting: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-3">
      {/* Header */}
      <div className="bg-primary/10 px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm text-foreground">
          Invoice Preview
        </span>
        <span className="ml-auto text-xs text-muted-foreground">AI-parsed</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Party info */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-muted-foreground">Bill To</p>
            <p className="font-semibold text-foreground">{invoice.partyName}</p>
            {invoice.partyGSTIN && (
              <p className="text-xs text-muted-foreground font-mono">
                GSTIN: {invoice.partyGSTIN}
              </p>
            )}
          </div>
          <div className="text-right">
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                invoice.isIntraState
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700",
              )}
            >
              {invoice.isIntraState ? "Intra-State" : "Inter-State"}
            </span>
          </div>
        </div>

        {/* Items table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-0 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border">
            <div className="col-span-5">Item</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-1 text-center">GST%</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          {invoice.items.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className="grid grid-cols-12 gap-0 px-3 py-2 text-xs border-b border-border/50 last:border-0"
            >
              <div className="col-span-5">
                <p className="font-medium text-foreground">{item.name}</p>
                {item.hsnCode && (
                  <p className="text-muted-foreground font-mono">
                    {item.hsnCode}
                  </p>
                )}
              </div>
              <div className="col-span-2 text-center text-muted-foreground">
                {item.qty}
              </div>
              <div className="col-span-2 text-right font-mono">
                ₹{formatINRNumber(item.rate)}
              </div>
              <div className="col-span-1 text-center text-muted-foreground">
                {item.gstRate}%
              </div>
              <div className="col-span-2 text-right font-mono font-semibold">
                ₹{formatINRNumber(item.qty * item.rate)}
              </div>
            </div>
          ))}
        </div>

        {/* GST Summary */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">
              ₹{formatINRNumber(invoice.subtotal)}
            </span>
          </div>
          {invoice.isIntraState ? (
            <>
              <div className="flex justify-between text-muted-foreground">
                <span>CGST</span>
                <span className="font-mono">
                  ₹{formatINRNumber(invoice.cgst)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>SGST</span>
                <span className="font-mono">
                  ₹{formatINRNumber(invoice.sgst)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-muted-foreground">
              <span>IGST</span>
              <span className="font-mono">
                ₹{formatINRNumber(invoice.igst)}
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border">
            <span>Total Amount</span>
            <span className="font-mono text-primary">
              ₹{formatINRNumber(invoice.total)}
            </span>
          </div>
        </div>

        {invoice.notes && (
          <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
            Notes: {invoice.notes}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            data-ocid="whatsapp_chat.approve_button"
            onClick={onApprove}
            disabled={isPosting}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm h-9"
          >
            {isPosting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Approve & Post to Ledger
          </Button>
          <Button
            data-ocid="whatsapp_chat.edit_button"
            variant="outline"
            onClick={onEdit}
            disabled={isPosting}
            className="gap-1.5 text-sm h-9"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface InvoiceWhatsAppChatProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated?: () => void;
}

export default function InvoiceWhatsAppChat({
  isOpen,
  onClose,
  onInvoiceCreated,
}: InvoiceWhatsAppChatProps) {
  const { activeBusiness, activeBusinessId } = useBusiness();
  const { data: customers = [] } = useCustomers();
  const { data: accounts = [] } = useAccounts();
  const createInvoice = useCreateInvoice();
  const createJournalEntry = useCreateJournalEntry();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      content:
        '👋 Paste a WhatsApp message or informal invoice note here.\n\nExample: "Bhai, 5 shirts @ 500 each + 2 pants @ 800 each, party hai Mehta Traders, GST 12%"',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const businessState = activeBusiness?.state || "";

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    const loadingMsg: ChatMessage = {
      id: `loading_${Date.now()}`,
      role: "assistant",
      content: "Parsing your invoice with Llama AI...",
      timestamp: Date.now(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsLoading(true);

    const config = getLlamaConfig();

    try {
      if (!config.apiKey) {
        throw new Error("NO_API_KEY");
      }

      const systemPrompt = `You are an Indian GST invoice parser. The user will send you an informal WhatsApp-style invoice message. 
Extract and return ONLY a valid JSON object with this exact structure:
{
  "partyName": string,
  "partyGSTIN": string or "",
  "items": [{"name": string, "qty": number, "rate": number, "gstRate": number, "hsnCode": string}],
  "notes": string
}
Infer GST rate from context (if not specified, default 18). Return ONLY the JSON, no explanation.`;

      const response = await callLlamaApi([
        { role: "system", content: systemPrompt },
        { role: "user", content: input.trim() },
      ]);

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse response as JSON");

      const parsed: ParsedInvoice = JSON.parse(jsonMatch[0]);

      // Infer party state from GSTIN prefix
      const partyStateCode = parsed.partyGSTIN?.slice(0, 2) || "";
      const STATE_CODE_MAP: Record<string, string> = {
        "27": "Maharashtra",
        "29": "Karnataka",
        "07": "Delhi",
        "33": "Tamil Nadu",
        "36": "Telangana",
        "09": "Uttar Pradesh",
        "06": "Haryana",
        "24": "Gujarat",
        "19": "West Bengal",
        "32": "Kerala",
      };
      const partyState = STATE_CODE_MAP[partyStateCode] || "";

      const computed = computeInvoiceFromParsed(
        parsed,
        businessState,
        partyState,
      );

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: `I've parsed your invoice for **${parsed.partyName}** with ${parsed.items.length} item(s). Total: ₹${formatINRNumber(computed.total)}. Review and approve to post to ledger.`,
        timestamp: Date.now(),
        parsed: computed,
      };

      setMessages((prev) =>
        prev.filter((m) => !m.isLoading).concat(assistantMsg),
      );
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        role: "assistant",
        content:
          err instanceof Error && err.message === "NO_API_KEY"
            ? "⚠️ Llama AI API key not configured. Please go to Settings → AI Engine and add your Groq API key."
            : "❌ Could not parse the invoice. Please try rephrasing or adding more details (party name, items, quantities, rates).",
        timestamp: Date.now(),
      };
      setMessages((prev) => prev.filter((m) => !m.isLoading).concat(errorMsg));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(msg: ChatMessage) {
    if (!msg.parsed || !activeBusinessId) return;
    setPostingId(msg.id);

    try {
      const invoice = msg.parsed;

      // Find or use first customer as placeholder
      const customer =
        customers.find((c) =>
          c.name.toLowerCase().includes(invoice.partyName.toLowerCase()),
        ) || customers[0];

      if (!customer) {
        toast.error(
          "No customer found. Please create a customer first in the Customers section.",
        );
        return;
      }

      // Create invoice
      const now = BigInt(Date.now()) * 1_000_000n;
      const due = BigInt(Date.now() + 30 * 86400 * 1000) * 1_000_000n;
      const items = invoice.items.map((item) => {
        const lineTotal = BigInt(Math.round(item.qty * item.rate * 100));
        const gst = BigInt(Math.round(item.gstRate));
        return [
          0n,
          item.name,
          BigInt(Math.round(item.qty)),
          lineTotal / BigInt(Math.round(item.qty) || 1),
          gst,
        ] as [bigint, string, bigint, bigint, bigint];
      });

      const invoiceId = await createInvoice.mutateAsync({
        customerId: customer.id,
        invoiceNumber: `WA-${Date.now().toString().slice(-6)}`,
        invoiceDate: now,
        dueDate: due,
        items,
      });

      // Post double-entry journal
      const receivableAccount = accounts.find(
        (a) =>
          a.accountType === "Asset" &&
          a.name.toLowerCase().includes("receivable"),
      );
      const salesAccount = accounts.find(
        (a) =>
          a.accountType === "Income" &&
          (a.name.toLowerCase().includes("sales") ||
            a.name.toLowerCase().includes("revenue")),
      );

      if (receivableAccount && salesAccount) {
        const totalPaise = Math.round(invoice.total * 100);
        await createJournalEntry.mutateAsync({
          narration: `Invoice - ${invoice.partyName} - WhatsApp`,
          reference: `WA-${Date.now().toString().slice(-6)}`,
          entryDate: Date.now(),
          lines: [
            {
              accountId: receivableAccount.id,
              debit: totalPaise,
              credit: 0,
            },
            {
              accountId: salesAccount.id,
              debit: 0,
              credit: totalPaise,
            },
          ],
        });
      }

      toast.success("Invoice posted to ledger for approval");

      // Mark message as posted
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? {
                ...m,
                content: `${m.content}\n\n✅ **Posted to ledger successfully!**`,
                parsed: undefined,
              }
            : m,
        ),
      );

      void invoiceId; // use the id
      onInvoiceCreated?.();
    } catch {
      toast.error("Failed to post invoice to ledger. Please try again.");
    } finally {
      setPostingId(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[500px] p-0 flex flex-col"
        data-ocid="whatsapp_chat.sheet"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#25D366]/15 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#25D366]" />
              </div>
              <div>
                <SheetTitle className="font-semibold text-foreground text-base">
                  Invoice Chat
                </SheetTitle>
                <p className="text-xs text-muted-foreground">
                  Paste WhatsApp invoice message → AI parses → Post to ledger
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-ocid="whatsapp_chat.close_button"
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Chat area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {msg.role === "system" ? (
                <div className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                    <pre className="font-sans whitespace-pre-wrap text-xs leading-relaxed">
                      {msg.content}
                    </pre>
                  </div>
                </div>
              ) : msg.role === "user" ? (
                <div className="max-w-[80%] bg-[#25D366] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm shadow-sm">
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-white/60 text-xs mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ) : (
                <div className="max-w-[90%]">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm shadow-sm">
                    {msg.isLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{msg.content}</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-foreground">
                        {msg.content}
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {msg.parsed && (
                    <InvoicePreviewCard
                      invoice={msg.parsed}
                      onApprove={() => handleApprove(msg)}
                      onEdit={() => {
                        toast.info(
                          "Open the Invoice form to edit and finalize this invoice.",
                        );
                      }}
                      isPosting={postingId === msg.id}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-border bg-card px-4 py-3">
          <div className="flex gap-2 items-end">
            <Textarea
              data-ocid="whatsapp_chat.textarea"
              placeholder="Paste WhatsApp invoice message here... (Press Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="resize-none text-sm flex-1 bg-background min-h-[56px] max-h-[120px]"
            />
            <Button
              data-ocid="whatsapp_chat.send_button"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
              className="h-10 w-10 p-0 bg-[#25D366] hover:bg-[#25D366]/90 text-white flex-shrink-0 rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Powered by Llama AI via Groq
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
