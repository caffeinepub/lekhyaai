/**
 * Floating Professional Calculator
 * - Fixed bottom-right, above AI widget button
 * - Indian number formatting (lakh, crore) on display
 * - Standard arithmetic + percentage + memory functions
 * - Keyboard support: digits, operators, Enter, Escape, Backspace
 * - Minimize/maximize toggle
 */
import { cn } from "@/lib/utils";
import { Calculator, ChevronDown, ChevronUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type CalcOp = "+" | "-" | "×" | "÷" | null;

/** Format number in Indian system: 1,23,456.78 */
function formatIndian(num: number): string {
  if (!Number.isFinite(num)) return num > 0 ? "Error" : "Error";
  const [intPart, decPart] = Math.abs(num).toString().split(".");
  const sign = num < 0 ? "-" : "";

  // Indian grouping: last 3 then groups of 2
  const len = intPart.length;
  let formatted = "";
  if (len <= 3) {
    formatted = intPart;
  } else {
    formatted = intPart.slice(-3);
    let remaining = intPart.slice(0, len - 3);
    while (remaining.length > 2) {
      formatted = `${remaining.slice(-2)},${formatted}`;
      remaining = remaining.slice(0, remaining.length - 2);
    }
    if (remaining.length > 0) {
      formatted = `${remaining},${formatted}`;
    }
  }

  // Truncate decimals to max 8 significant digits for display
  let result = `${sign}${formatted}`;
  if (decPart !== undefined) {
    // Remove trailing zeros
    const trimmed = decPart.replace(/0+$/, "");
    if (trimmed) result += `.${trimmed.slice(0, 8)}`;
  }
  return result;
}

export default function FloatingCalculator() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Calculator state
  const [display, setDisplay] = useState("0");
  const [operand, setOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalcOp>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [memory, setMemory] = useState(0);
  const [expression, setExpression] = useState("");

  const calcRef = useRef<HTMLDivElement>(null);

  // Keyboard support
  // biome-ignore lint/correctness/useExhaustiveDependencies: handler functions are stable within the effect
  useEffect(() => {
    if (!isVisible || isMinimized) return;

    function onKey(e: KeyboardEvent) {
      // Don't intercept if focused in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const key = e.key;

      if (key >= "0" && key <= "9") {
        e.preventDefault();
        inputDigit(key);
      } else if (key === ".") {
        e.preventDefault();
        inputDecimal();
      } else if (key === "+") {
        e.preventDefault();
        handleOperator("+");
      } else if (key === "-") {
        e.preventDefault();
        handleOperator("-");
      } else if (key === "*") {
        e.preventDefault();
        handleOperator("×");
      } else if (key === "/") {
        e.preventDefault();
        handleOperator("÷");
      } else if (key === "%") {
        e.preventDefault();
        handlePercent();
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleEquals();
      } else if (key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (key === "Escape") {
        e.preventDefault();
        handleClear();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, isMinimized, display, operand, operator, waitingForOperand]);

  function getCurrentValue(): number {
    return Number.parseFloat(display.replace(/,/g, "")) || 0;
  }

  function inputDigit(digit: string) {
    if (waitingForOperand) {
      setDisplay(digit === "0" ? "0" : digit);
      setWaitingForOperand(false);
    } else {
      const raw = display === "0" ? digit : display + digit;
      if (raw.replace(/[.,]/g, "").length > 15) return; // cap at 15 digits
      setDisplay(raw);
    }
  }

  function inputDecimal() {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(`${display}.`);
    }
  }

  function handleBackspace() {
    if (waitingForOperand) return;
    if (display.length === 1 || (display.length === 2 && display[0] === "-")) {
      setDisplay("0");
    } else {
      setDisplay(display.slice(0, -1));
    }
  }

  function handleOperator(op: CalcOp) {
    const current = getCurrentValue();
    if (operand !== null && !waitingForOperand) {
      const result = calculate(operand, current, operator);
      setDisplay(String(result));
      setOperand(result);
      setExpression(`${formatIndian(result)} ${op ?? ""}`);
    } else {
      setOperand(current);
      setExpression(`${formatIndian(current)} ${op ?? ""}`);
    }
    setOperator(op);
    setWaitingForOperand(true);
  }

  function calculate(a: number, b: number, op: CalcOp): number {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? Number.NaN : a / b;
      default:
        return b;
    }
  }

  function handleEquals() {
    const current = getCurrentValue();
    if (operand !== null) {
      const result = calculate(operand, current, operator);
      setExpression(
        `${formatIndian(operand)} ${operator ?? ""} ${formatIndian(current)} =`,
      );
      setDisplay(Number.isNaN(result) ? "Error" : String(result));
      setOperand(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  }

  function handlePercent() {
    const current = getCurrentValue();
    const result = operand !== null ? (operand * current) / 100 : current / 100;
    setDisplay(String(result));
    setWaitingForOperand(false);
  }

  function handleToggleSign() {
    const current = getCurrentValue();
    setDisplay(String(-current));
  }

  function handleClear() {
    setDisplay("0");
    setOperand(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression("");
  }

  function handleAllClear() {
    handleClear();
    setMemory(0);
  }

  // Memory functions
  function memAdd() {
    setMemory((m) => m + getCurrentValue());
  }
  function memSub() {
    setMemory((m) => m - getCurrentValue());
  }
  function memRecall() {
    setDisplay(String(memory));
    setWaitingForOperand(false);
  }
  function memClear() {
    setMemory(0);
  }

  // Displayed value — format if no decimal/error
  const displayValue = (() => {
    if (display === "Error") return "Error";
    if (display.endsWith(".")) return display; // mid-input
    const num = Number.parseFloat(display);
    if (Number.isNaN(num)) return display;
    // Only format if result (not mid-input with trailing zeros)
    if (display.includes(".")) {
      const [i, d] = display.split(".");
      return `${formatIndian(Number(i))}.${d}`;
    }
    return formatIndian(num);
  })();

  const calcButton = (
    label: string,
    onClick: () => void,
    variant: "num" | "op" | "action" | "mem" | "equals" = "num",
    ocid?: string,
  ) => (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      className={cn(
        "h-10 rounded-lg text-sm font-semibold transition-all active:scale-95 select-none",
        variant === "num" && "bg-muted hover:bg-muted/70 text-foreground",
        variant === "op" &&
          "bg-primary/15 hover:bg-primary/25 text-primary font-bold",
        variant === "action" &&
          "bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300",
        variant === "mem" &&
          "bg-muted/50 hover:bg-muted text-muted-foreground text-xs",
        variant === "equals" &&
          "bg-primary hover:bg-primary/90 text-primary-foreground col-span-1",
      )}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Toggle button — only when hidden */}
      <AnimatePresence>
        {!isVisible && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            data-ocid="floating_calc.open_modal_button"
            onClick={() => {
              setIsVisible(true);
              setIsMinimized(false);
            }}
            className={cn(
              "fixed z-40 w-11 h-11 rounded-full bg-card border border-border text-muted-foreground shadow-lg flex items-center justify-center",
              "bottom-44 right-4 md:bottom-24 md:right-6",
              "hover:text-primary hover:border-primary/50 hover:scale-105 transition-all",
            )}
            title="Open Calculator"
            aria-label="Open Calculator"
          >
            <Calculator className="w-4.5 h-4.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Calculator panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={calcRef}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            data-ocid="floating_calc.dialog"
            className={cn(
              "fixed z-40 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden",
              "bottom-44 right-4 md:bottom-24 md:right-6",
              "w-72",
            )}
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/30">
              <Calculator className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground flex-1">
                Calculator
              </span>
              <button
                type="button"
                data-ocid="floating_calc.minimize_button"
                onClick={() => setIsMinimized((p) => !p)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                data-ocid="floating_calc.close_button"
                onClick={() => setIsVisible(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body — hidden when minimized */}
            <AnimatePresence initial={false}>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {/* Display */}
                  <div className="px-3 pt-3 pb-2">
                    {/* Expression */}
                    <p className="text-right text-xs text-muted-foreground h-4 truncate">
                      {expression}
                    </p>
                    {/* Main display */}
                    <p
                      className={cn(
                        "text-right font-mono font-bold text-foreground leading-tight",
                        displayValue.length > 12
                          ? "text-lg"
                          : displayValue.length > 8
                            ? "text-xl"
                            : "text-3xl",
                      )}
                    >
                      {displayValue}
                    </p>
                    {/* Memory indicator */}
                    {memory !== 0 && (
                      <p className="text-right text-[10px] text-primary mt-0.5">
                        M = {formatIndian(memory)}
                      </p>
                    )}
                  </div>

                  {/* Keypad */}
                  <div className="px-3 pb-3 space-y-1.5">
                    {/* Memory row */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {calcButton("MC", memClear, "mem", "calc.mc_button")}
                      {calcButton("MR", memRecall, "mem", "calc.mr_button")}
                      {calcButton("M-", memSub, "mem", "calc.msub_button")}
                      {calcButton("M+", memAdd, "mem", "calc.madd_button")}
                    </div>

                    {/* Row 1 */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {calcButton(
                        "AC",
                        handleAllClear,
                        "action",
                        "calc.ac_button",
                      )}
                      {calcButton(
                        "C",
                        handleClear,
                        "action",
                        "calc.clear_button",
                      )}
                      {calcButton(
                        "%",
                        handlePercent,
                        "op",
                        "calc.percent_button",
                      )}
                      {calcButton(
                        "÷",
                        () => handleOperator("÷"),
                        "op",
                        "calc.div_button",
                      )}
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {calcButton(
                        "7",
                        () => inputDigit("7"),
                        "num",
                        "calc.7_button",
                      )}
                      {calcButton(
                        "8",
                        () => inputDigit("8"),
                        "num",
                        "calc.8_button",
                      )}
                      {calcButton(
                        "9",
                        () => inputDigit("9"),
                        "num",
                        "calc.9_button",
                      )}
                      {calcButton(
                        "×",
                        () => handleOperator("×"),
                        "op",
                        "calc.mul_button",
                      )}
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {calcButton(
                        "4",
                        () => inputDigit("4"),
                        "num",
                        "calc.4_button",
                      )}
                      {calcButton(
                        "5",
                        () => inputDigit("5"),
                        "num",
                        "calc.5_button",
                      )}
                      {calcButton(
                        "6",
                        () => inputDigit("6"),
                        "num",
                        "calc.6_button",
                      )}
                      {calcButton(
                        "-",
                        () => handleOperator("-"),
                        "op",
                        "calc.sub_button",
                      )}
                    </div>

                    {/* Row 4 */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {calcButton(
                        "1",
                        () => inputDigit("1"),
                        "num",
                        "calc.1_button",
                      )}
                      {calcButton(
                        "2",
                        () => inputDigit("2"),
                        "num",
                        "calc.2_button",
                      )}
                      {calcButton(
                        "3",
                        () => inputDigit("3"),
                        "num",
                        "calc.3_button",
                      )}
                      {calcButton(
                        "+",
                        () => handleOperator("+"),
                        "op",
                        "calc.add_button",
                      )}
                    </div>

                    {/* Row 5 */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {calcButton(
                        "+/-",
                        handleToggleSign,
                        "num",
                        "calc.sign_button",
                      )}
                      {calcButton(
                        "0",
                        () => inputDigit("0"),
                        "num",
                        "calc.0_button",
                      )}
                      {calcButton(".", inputDecimal, "num", "calc.dot_button")}
                      {calcButton(
                        "=",
                        handleEquals,
                        "equals",
                        "calc.equals_button",
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
