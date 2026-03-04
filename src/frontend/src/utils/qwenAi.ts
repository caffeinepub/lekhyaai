/**
 * Qwen AI (DashScope) integration utility.
 * Handles API calls, localStorage config, and graceful CORS error handling.
 */

export interface QwenMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface QwenConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

export const QWEN_MODELS = [
  { id: "qwen-turbo", label: "qwen-turbo (Fast & Economical)" },
  { id: "qwen-plus", label: "qwen-plus (Balanced)" },
  { id: "qwen-max", label: "qwen-max (Most Capable)" },
];

const LS_KEY_API_KEY = "lekhya_qwen_api_key";
const LS_KEY_MODEL = "lekhya_qwen_model";
const LS_KEY_TEMPERATURE = "lekhya_qwen_temperature";

export function getQwenConfig(): QwenConfig {
  return {
    apiKey: localStorage.getItem(LS_KEY_API_KEY) ?? "",
    model: localStorage.getItem(LS_KEY_MODEL) ?? "qwen-turbo",
    temperature: Number.parseFloat(
      localStorage.getItem(LS_KEY_TEMPERATURE) ?? "0.7",
    ),
  };
}

export function saveQwenConfig(config: Partial<QwenConfig>) {
  if (config.apiKey !== undefined)
    localStorage.setItem(LS_KEY_API_KEY, config.apiKey);
  if (config.model !== undefined)
    localStorage.setItem(LS_KEY_MODEL, config.model);
  if (config.temperature !== undefined)
    localStorage.setItem(LS_KEY_TEMPERATURE, config.temperature.toString());
}

export async function callQwenApi(
  messages: QwenMessage[],
  config?: Partial<QwenConfig>,
): Promise<string> {
  const cfg = { ...getQwenConfig(), ...config };
  if (!cfg.apiKey) {
    throw new Error("NO_API_KEY");
  }

  try {
    const resp = await fetch(
      "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: cfg.model,
          input: { messages },
          parameters: {
            temperature: cfg.temperature,
            result_format: "message",
          },
        }),
      },
    );

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "Unknown error");
      if (resp.status === 401) throw new Error("INVALID_API_KEY");
      if (resp.status === 429) throw new Error("RATE_LIMIT");
      throw new Error(`API_ERROR:${resp.status}:${errText}`);
    }

    const data = await resp.json();
    const content = data?.output?.choices?.[0]?.message?.content;
    if (!content) throw new Error("EMPTY_RESPONSE");
    return content as string;
  } catch (err: unknown) {
    if (
      err instanceof TypeError &&
      (err as TypeError).message === "Failed to fetch"
    ) {
      throw new Error("CORS_ERROR");
    }
    throw err;
  }
}

/**
 * Get chat history from localStorage for a specific user+business.
 */
export function getChatHistory(
  userPrincipal: string,
  businessId: string,
): StoredMessage[] {
  const key = `lekhya_chat_history_${userPrincipal}_${businessId}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as StoredMessage[];
  } catch {
    return [];
  }
}

export function saveChatHistory(
  userPrincipal: string,
  businessId: string,
  messages: StoredMessage[],
) {
  const key = `lekhya_chat_history_${userPrincipal}_${businessId}`;
  localStorage.setItem(key, JSON.stringify(messages));
}

export function clearChatHistory(userPrincipal: string, businessId: string) {
  const key = `lekhya_chat_history_${userPrincipal}_${businessId}`;
  localStorage.removeItem(key);
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number; // epoch ms
  model?: string;
}
