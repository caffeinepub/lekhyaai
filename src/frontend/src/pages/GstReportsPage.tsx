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
import { BarChart3, FileDown, Loader2, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useBusiness } from "../context/BusinessContext";
import { useActor } from "../hooks/useActor";
import { dateStringToNs, formatINR } from "../utils/formatINR";

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

interface ReportData {
  outputGst: bigint;
  inputGst: bigint;
  netPayable: bigint;
  period: string;
}

export default function GstReportsPage() {
  const { actor } = useActor();
  const { activeBusinessId } = useBusiness();
  const [period, setPeriod] = useState<Period>("current-month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

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
      await actor.generateGstReport(
        activeBusinessId,
        dateStringToNs(dates.start),
        dateStringToNs(dates.end),
      );
      // Fetch dashboard data for GST numbers
      const dashboard = await actor.getDashboardData(activeBusinessId);
      setReport({
        outputGst: dashboard.currentMonthOutputGst,
        inputGst: dashboard.currentMonthInputGst,
        netPayable: dashboard.netGstPayable,
        period:
          period !== "custom"
            ? PERIOD_LABELS[period]
            : `${dates.start} to ${dates.end}`,
      });
      toast.success("GST Report generated!");
    } catch {
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">GST Summary</h3>
              <p className="text-muted-foreground text-sm">{report.period}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BarChart3 className="w-4 h-4" />
              <span>GSTR-3B Format</span>
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
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
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
