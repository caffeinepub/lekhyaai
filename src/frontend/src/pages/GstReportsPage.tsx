import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useBusiness } from "../context/BusinessContext";
import { useActor } from "../hooks/useActor";
import { dateStringToNs, formatINR, formatINRNumber } from "../utils/formatINR";
import { getCurrentUserRole, hasPermission } from "../utils/rbac";
import {
  draftEmailBody,
  draftWhatsAppMessage,
  openEmail,
  openWhatsApp,
} from "../utils/sendActions";

type Period =
  | "current-month"
  | "last-month"
  | "current-quarter"
  | "last-quarter"
  | "custom";

function getPeriodDates(period: Period): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed

  switch (period) {
    case "current-month": {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    case "last-month": {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    case "current-quarter": {
      const qStart = Math.floor(m / 3) * 3;
      const start = new Date(y, qStart, 1);
      const end = new Date(y, qStart + 3, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    case "last-quarter": {
      const qStart = ((Math.floor(m / 3) - 1 + 4) % 4) * 3;
      const qY = m < 3 ? y - 1 : y;
      const start = new Date(qY, qStart, 1);
      const end = new Date(qY, qStart + 3, 0);
      return {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      };
    }
    default:
      return {
        start: new Date(y, m, 1).toISOString().split("T")[0],
        end: new Date(y, m + 1, 0).toISOString().split("T")[0],
      };
  }
}

const PERIOD_LABELS: Record<Period, string> = {
  "current-month": "Current Month",
  "last-month": "Last Month",
  "current-quarter": "Current Quarter",
  "last-quarter": "Last Quarter",
  custom: "Custom Range",
};

interface InvoiceBreakdownRow {
  invoiceNo: string;
  party: string;
  taxableAmt: bigint;
  cgst: bigint;
  sgst: bigint;
  igst: bigint;
  totalGst: bigint;
}

interface ExpenseBreakdownRow {
  description: string;
  vendor: string;
  amount: bigint;
  gst: bigint;
}

interface ReportData {
  outputGst: bigint;
  inputGst: bigint;
  netPayable: bigint;
  excessItc: bigint;
  period: string;
  invoiceRows: InvoiceBreakdownRow[];
  expenseRows: ExpenseBreakdownRow[];
}

export default function GstReportsPage() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const [period, setPeriod] = useState<Period>("current-month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [sendingWA, setSendingWA] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const currentRole = getCurrentUserRole();

  const dates =
    period !== "custom"
      ? getPeriodDates(period)
      : {
          start: customStart,
          end: customEnd,
        };

  async function generateReport() {
    if (!actor || activeBusinessId === null) return;
    if (!dates.start || !dates.end) {
      toast.error("Please select a valid date range");
      return;
    }
    setLoading(true);
    try {
      const periodStart = dateStringToNs(dates.start);
      const periodEnd = dateStringToNs(dates.end);

      await actor.generateGstReport(activeBusinessId, periodStart, periodEnd);

      // Compute GST numbers locally from invoices + expenses
      const [allInvoices, allExpenses] = await Promise.all([
        actor.getInvoices(activeBusinessId),
        actor.getExpenses(activeBusinessId),
      ]);

      let outputGst = 0n;
      const invoiceRows: InvoiceBreakdownRow[] = [];
      for (const inv of allInvoices) {
        if (
          inv.invoiceDate >= periodStart &&
          inv.invoiceDate <= periodEnd &&
          (inv.status === "sent" || inv.status === "paid")
        ) {
          outputGst += inv.cgst + inv.sgst + inv.igst;
          invoiceRows.push({
            invoiceNo: inv.invoiceNumber,
            party: `#${inv.customerId}`,
            taxableAmt: inv.subtotal,
            cgst: inv.cgst,
            sgst: inv.sgst,
            igst: inv.igst,
            totalGst: inv.cgst + inv.sgst + inv.igst,
          });
        }
      }

      let inputGst = 0n;
      const expenseRows: ExpenseBreakdownRow[] = [];
      for (const exp of allExpenses) {
        if (exp.expenseDate >= periodStart && exp.expenseDate <= periodEnd) {
          inputGst += exp.gstAmount;
          expenseRows.push({
            description: exp.category || exp.description || "Expense",
            vendor: `#${exp.vendorId}`,
            amount: exp.amount,
            gst: exp.gstAmount,
          });
        }
      }

      const rawNet = outputGst - inputGst;
      const netPayable = rawNet > 0n ? rawNet : 0n;
      const excessItc = rawNet < 0n ? -rawNet : 0n;

      setReport({
        outputGst,
        inputGst,
        netPayable,
        excessItc,
        period:
          period !== "custom"
            ? PERIOD_LABELS[period]
            : `${dates.start} to ${dates.end}`,
        invoiceRows,
        expenseRows,
      });
      toast.success("GST Report generated!");
    } catch {
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendWA() {
    if (!report) return;
    setSendingWA(true);
    try {
      const msg = await draftWhatsAppMessage("gst-report", {
        period: report.period,
        outputGst: formatINR(report.outputGst),
        inputGst: formatINR(report.inputGst),
        netGst: formatINR(report.netPayable),
        businessName: "Your Business",
      });
      openWhatsApp("", msg);
      toast.info("WhatsApp opened — enter the recipient's number in WhatsApp.");
    } catch {
      toast.error("Failed to draft WhatsApp message.");
    } finally {
      setSendingWA(false);
    }
  }

  async function handleSendEmail() {
    if (!report) return;
    setSendingEmail(true);
    try {
      const body = await draftEmailBody("gst-report", {
        period: report.period,
        outputGst: formatINR(report.outputGst),
        inputGst: formatINR(report.inputGst),
        netGst: formatINR(report.netPayable),
        businessName: "Your Business",
      });
      openEmail("", `GST Report — ${report.period}`, body);
      toast.info("Email client opened — enter the recipient's address.");
    } catch {
      toast.error("Failed to draft email.");
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl text-foreground">
          GST Reports
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Generate GST summary for any period
        </p>
      </div>

      {/* Period selector card */}
      <div className="bg-card rounded-xl shadow-card border border-border p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-4">Select Period</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Period</Label>
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as Period)}
            >
              <SelectTrigger data-ocid="gst_reports.period_select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PERIOD_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {period !== "custom" && (
            <div className="space-y-1.5">
              <Label>Date Range</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={dates.start}
                  readOnly
                  className="text-sm bg-muted"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  value={dates.end}
                  readOnly
                  className="text-sm bg-muted"
                />
              </div>
            </div>
          )}
          {period === "custom" && (
            <>
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  data-ocid="gst_reports.start_date_input"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  data-ocid="gst_reports.end_date_input"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <Button
          data-ocid="gst_reports.generate_button"
          onClick={generateReport}
          disabled={loading}
          className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Generate Report
            </>
          )}
        </Button>
      </div>

      {/* Report Result */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-card border border-border p-6"
          data-ocid="gst_reports.result_card"
        >
          <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-foreground">GST Summary</h3>
              <p className="text-muted-foreground text-sm">{report.period}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">GSTR-3B Format</span>
              </div>
              {hasPermission("whatsapp-send", currentRole) && (
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="gst_reports.whatsapp_button"
                  onClick={handleSendWA}
                  disabled={sendingWA}
                  className="gap-1.5 text-xs text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                >
                  {sendingWA ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                  WhatsApp
                </Button>
              )}
              {hasPermission("email-send", currentRole) && (
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="gst_reports.email_button"
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="gap-1.5 text-xs"
                >
                  {sendingEmail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  Email
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              {
                label: "Output GST (Collected)",
                value: report.outputGst,
                cls: "text-success",
                bg: "bg-success/10",
                desc: "GST charged on sales",
              },
              {
                label: "Input GST (Credit)",
                value: report.inputGst,
                cls: "text-info",
                bg: "bg-info/10",
                desc: "GST paid on purchases",
              },
              {
                label: "Net GST Payable",
                value: report.netPayable,
                cls:
                  report.netPayable > 0n ? "text-destructive" : "text-success",
                bg:
                  report.netPayable > 0n
                    ? "bg-destructive/10"
                    : "bg-success/10",
                desc: "Output − Input",
              },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-xl p-4", item.bg)}>
                <p className="text-xs text-muted-foreground mb-1">
                  {item.label}
                </p>
                <p className={cn("text-2xl font-bold tabular-nums", item.cls)}>
                  {formatINR(item.value)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                GST Liability Calculation
              </p>
            </div>
            <div className="divide-y divide-border">
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  3.1 Outward supplies (Output GST)
                </span>
                <span className="font-semibold tabular-nums">
                  {formatINR(report.outputGst)}
                </span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  4. Eligible ITC (Input GST Credit)
                </span>
                <span className="font-semibold tabular-nums text-success">
                  −{formatINR(report.inputGst)}
                </span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm bg-muted/20 font-bold">
                <span>Net Tax Payable (Row 6)</span>
                <span
                  className={cn(
                    "tabular-nums",
                    report.netPayable > 0n
                      ? "text-destructive"
                      : "text-success",
                  )}
                >
                  {formatINR(report.netPayable)}
                </span>
              </div>
              {report.excessItc > 0n && (
                <div className="flex justify-between px-4 py-3 text-sm bg-success/10">
                  <span className="text-success font-semibold">
                    Excess ITC (Carry Forward)
                  </span>
                  <span className="font-bold tabular-nums text-success">
                    {formatINR(report.excessItc)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Toggle Details Button */}
          <Button
            variant="outline"
            size="sm"
            data-ocid="gst_reports.details_toggle.button"
            onClick={() => setShowDetails((v) => !v)}
            className="gap-2 text-xs"
          >
            {showDetails ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            {showDetails ? "Hide" : "Show"} Transaction Details
          </Button>

          {/* Detailed Breakdown */}
          {showDetails && (
            <div className="space-y-4">
              {/* Output GST Breakdown */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-success mb-2">
                  Output GST — Invoice-wise Breakdown
                </p>
                {report.invoiceRows.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-3">
                    No invoices in this period.
                  </p>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden text-xs">
                    <div className="grid grid-cols-12 gap-0 bg-muted/30 px-3 py-2 font-semibold text-muted-foreground border-b border-border">
                      <div className="col-span-2">Invoice #</div>
                      <div className="col-span-3">Party</div>
                      <div className="col-span-2 text-right">Taxable</div>
                      <div className="col-span-1 text-right">CGST</div>
                      <div className="col-span-1 text-right">SGST</div>
                      <div className="col-span-1 text-right">IGST</div>
                      <div className="col-span-2 text-right">Total GST</div>
                    </div>
                    {report.invoiceRows.map((row, i) => (
                      <div
                        key={row.invoiceNo}
                        className="grid grid-cols-12 gap-0 px-3 py-2 border-b border-border/50 last:border-0"
                        data-ocid={`gst_reports.invoice_row.${i + 1}`}
                      >
                        <div className="col-span-2 font-mono text-primary">
                          {row.invoiceNo}
                        </div>
                        <div className="col-span-3 text-foreground truncate">
                          {row.party}
                        </div>
                        <div className="col-span-2 text-right font-mono">
                          ₹{formatINRNumber(Number(row.taxableAmt) / 100)}
                        </div>
                        <div className="col-span-1 text-right font-mono">
                          {row.cgst > 0n
                            ? `₹${formatINRNumber(Number(row.cgst) / 100)}`
                            : "—"}
                        </div>
                        <div className="col-span-1 text-right font-mono">
                          {row.sgst > 0n
                            ? `₹${formatINRNumber(Number(row.sgst) / 100)}`
                            : "—"}
                        </div>
                        <div className="col-span-1 text-right font-mono">
                          {row.igst > 0n
                            ? `₹${formatINRNumber(Number(row.igst) / 100)}`
                            : "—"}
                        </div>
                        <div className="col-span-2 text-right font-mono font-semibold text-success">
                          ₹{formatINRNumber(Number(row.totalGst) / 100)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Input GST Breakdown */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-info mb-2">
                  Input GST Credit — Expense-wise Breakdown
                </p>
                {report.expenseRows.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-3">
                    No expenses in this period.
                  </p>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden text-xs">
                    <div className="grid grid-cols-12 gap-0 bg-muted/30 px-3 py-2 font-semibold text-muted-foreground border-b border-border">
                      <div className="col-span-5">Expense</div>
                      <div className="col-span-3">Vendor</div>
                      <div className="col-span-2 text-right">Amount</div>
                      <div className="col-span-2 text-right">GST</div>
                    </div>
                    {report.expenseRows.map((row, i) => (
                      <div
                        key={`${row.description}-${i}`}
                        className="grid grid-cols-12 gap-0 px-3 py-2 border-b border-border/50 last:border-0"
                        data-ocid={`gst_reports.expense_row.${i + 1}`}
                      >
                        <div className="col-span-5 text-foreground truncate">
                          {row.description}
                        </div>
                        <div className="col-span-3 text-muted-foreground truncate">
                          {row.vendor}
                        </div>
                        <div className="col-span-2 text-right font-mono">
                          ₹{formatINRNumber(Number(row.amount) / 100)}
                        </div>
                        <div className="col-span-2 text-right font-mono font-semibold text-info">
                          ₹{formatINRNumber(Number(row.gst) / 100)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            * This report is indicative. Please verify with your CA before
            filing GSTR-3B.
          </p>
        </motion.div>
      )}

      {!report && !loading && (
        <div
          className="text-center py-12 text-muted-foreground"
          data-ocid="gst_reports.empty_state"
        >
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            Select a period and generate your GST report
          </p>
        </div>
      )}
    </div>
  );
}
