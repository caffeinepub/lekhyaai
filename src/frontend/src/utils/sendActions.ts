/**
 * WhatsApp & Email send actions.
 * Uses Llama AI to draft professional messages.
 * Falls back to simple templates if no API key is configured.
 */

import { callLlamaApi, getLlamaConfig } from "./llamaAi";

export type SendType = "invoice" | "pl-report" | "gst-report";

/**
 * Draft a WhatsApp message using Llama AI.
 * Falls back to a simple template if no API key is configured.
 */
export async function draftWhatsAppMessage(
  type: SendType,
  data: Record<string, unknown>,
): Promise<string> {
  const config = getLlamaConfig();

  if (!config.apiKey) {
    return buildFallbackWhatsApp(type, data);
  }

  const systemPrompt = `You are a professional Indian CA and business communication expert. 
Draft a concise, professional WhatsApp message in English for business communication.
Keep it under 300 characters. Use Indian business etiquette. Do not use emojis excessively.
Format currency as ₹ followed by the Indian number system (e.g., ₹1,25,000).`;

  const userPrompt = buildPrompt(type, data, "whatsapp");

  try {
    const response = await callLlamaApi(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      config,
    );
    return response.trim();
  } catch {
    return buildFallbackWhatsApp(type, data);
  }
}

/**
 * Draft an email body using Llama AI.
 * Falls back to a simple template if no API key is configured.
 */
export async function draftEmailBody(
  type: SendType,
  data: Record<string, unknown>,
): Promise<string> {
  const config = getLlamaConfig();

  if (!config.apiKey) {
    return buildFallbackEmail(type, data);
  }

  const systemPrompt = `You are a professional Indian CA and business communication expert.
Draft a formal, professional email body in English for business communication.
Keep it concise (under 200 words). Use Indian business etiquette.
Format currency as ₹ followed by the Indian number system.
Do not include subject line — only the body. Start with "Dear [Recipient]," and end with "Regards,\\n[Sender]".`;

  const userPrompt = buildPrompt(type, data, "email");

  try {
    const response = await callLlamaApi(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      config,
    );
    return response.trim();
  } catch {
    return buildFallbackEmail(type, data);
  }
}

function buildPrompt(
  type: SendType,
  data: Record<string, unknown>,
  channel: "whatsapp" | "email",
): string {
  if (type === "invoice") {
    return `Draft a ${channel} message for an invoice:
Invoice Number: ${data.invoiceNumber ?? ""}
Customer: ${data.customerName ?? ""}
Amount: ₹${data.totalAmount ?? ""}
Due Date: ${data.dueDate ?? ""}
Business: ${data.businessName ?? ""}
Status: ${data.status ?? "sent"}`;
  }

  if (type === "pl-report") {
    return `Draft a ${channel} message sharing a P&L Report:
Period: ${data.period ?? ""}
Business: ${data.businessName ?? ""}
Net Revenue: ₹${data.revenue ?? ""}
Net Profit/Loss: ₹${data.profit ?? ""}`;
  }

  if (type === "gst-report") {
    return `Draft a ${channel} message sharing a GST Report:
Period: ${data.period ?? ""}
Business: ${data.businessName ?? ""}
Output GST: ₹${data.outputGst ?? ""}
Input GST: ₹${data.inputGst ?? ""}
Net GST Payable: ₹${data.netGst ?? ""}`;
  }

  return `Draft a ${channel} message for type: ${type}`;
}

function buildFallbackWhatsApp(
  type: SendType,
  data: Record<string, unknown>,
): string {
  if (type === "invoice") {
    return `Dear ${data.customerName ?? "Sir/Madam"},\n\nPlease find Invoice No. ${data.invoiceNumber ?? ""} for ₹${data.totalAmount ?? ""} due on ${data.dueDate ?? ""}.\n\nKindly arrange payment at the earliest.\n\nRegards,\n${data.businessName ?? "LekhyaAI"}`;
  }
  if (type === "pl-report") {
    return `Dear Sir/Madam,\n\nPlease find attached the P&L Report for ${data.period ?? "the selected period"}.\n\nNet Revenue: ₹${data.revenue ?? ""}\nNet Profit: ₹${data.profit ?? ""}\n\nRegards,\n${data.businessName ?? "LekhyaAI"}`;
  }
  if (type === "gst-report") {
    return `Dear Sir/Madam,\n\nGST Report for ${data.period ?? "the selected period"}:\n\nOutput GST: ₹${data.outputGst ?? ""}\nInput GST: ₹${data.inputGst ?? ""}\nNet GST Payable: ₹${data.netGst ?? ""}\n\nRegards,\n${data.businessName ?? "LekhyaAI"}`;
  }
  return `Please find the report attached. Regards, ${data.businessName ?? "LekhyaAI"}`;
}

function buildFallbackEmail(
  type: SendType,
  data: Record<string, unknown>,
): string {
  if (type === "invoice") {
    return `Dear ${data.customerName ?? "Sir/Madam"},

I hope this message finds you well.

Please find below the details for Invoice No. ${data.invoiceNumber ?? ""}:

Amount: ₹${data.totalAmount ?? ""}
Due Date: ${data.dueDate ?? ""}

Kindly arrange for the payment at the earliest convenience.

For any queries, please feel free to reach out.

Regards,
${data.businessName ?? "LekhyaAI Team"}`;
  }

  if (type === "pl-report") {
    return `Dear Sir/Madam,

Please find below the Profit & Loss Report for ${data.period ?? "the selected period"}:

Net Revenue: ₹${data.revenue ?? ""}
Net Profit/Loss: ₹${data.profit ?? ""}

Please review the detailed report attached/below.

Regards,
${data.businessName ?? "LekhyaAI Team"}`;
  }

  if (type === "gst-report") {
    return `Dear Sir/Madam,

Please find below the GST Report for ${data.period ?? "the selected period"}:

Output GST (Liability): ₹${data.outputGst ?? ""}
Input GST (ITC): ₹${data.inputGst ?? ""}
Net GST Payable: ₹${data.netGst ?? ""}

Kindly review and file accordingly.

Regards,
${data.businessName ?? "LekhyaAI Team"}`;
  }

  return `Dear Sir/Madam,\n\nPlease find the requested report below.\n\nRegards,\n${data.businessName ?? "LekhyaAI Team"}`;
}

/**
 * Open WhatsApp with a pre-drafted message.
 * Uses wa.me deep-link — opens WhatsApp Web/App.
 */
export function openWhatsApp(phone: string, message: string): void {
  // Clean phone number: remove spaces, dashes, plus, parens
  const cleaned = phone.replace(/[\s\-+()\u00a0]/g, "");
  // Add country code if not present
  const withCC = cleaned.startsWith("91")
    ? cleaned
    : cleaned.startsWith("0")
      ? `91${cleaned.slice(1)}`
      : `91${cleaned}`;

  const url = `https://wa.me/${withCC}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Open email client with subject + body pre-filled.
 */
export function openEmail(email: string, subject: string, body: string): void {
  const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
