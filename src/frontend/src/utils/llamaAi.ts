/**
 * Llama AI (Meta Llama 3) integration utility via Groq Cloud.
 *
 * Groq provides the fastest Llama 3 inference with a generous free tier.
 * API docs: https://console.groq.com
 * Models: llama3-8b-8192 (fast, free), llama3-70b-8192 (powerful, free tier)
 *
 * The endpoint is fully OpenAI-compatible.
 */

export interface LlamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlamaConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

export const LLAMA_MODELS = [
  { id: "llama3-8b-8192", label: "LekhyaAI Standard (Fast)" },
  { id: "llama3-70b-8192", label: "LekhyaAI Pro (Powerful)" },
  { id: "llama-3.1-8b-instant", label: "LekhyaAI Instant" },
  { id: "llama-3.1-70b-versatile", label: "LekhyaAI Pro Versatile" },
  { id: "llama-3.3-70b-versatile", label: "LekhyaAI Pro 2.0 (Latest)" },
];

// Vision-capable models available
export const LLAMA_VISION_MODELS = [
  {
    id: "meta-llama/llama-4-scout-17b-16e-instruct",
    label: "LekhyaAI Vision Pro (Best Accuracy)",
  },
  {
    id: "llama-3.2-11b-vision-preview",
    label: "LekhyaAI Vision Standard (Fast)",
  },
  {
    id: "llama-3.2-90b-vision-preview",
    label: "LekhyaAI Vision Ultra (Maximum Power)",
  },
];

export const DEFAULT_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const LS_KEY_VISION_MODEL = "lekhya_llama_vision_model";

export const LS_KEY_API_KEY = "lekhya_llama_api_key";
const LS_KEY_MODEL = "lekhya_llama_model";
const LS_KEY_TEMPERATURE = "lekhya_llama_temperature";

export function getLlamaConfig(): LlamaConfig {
  return {
    apiKey: localStorage.getItem(LS_KEY_API_KEY) ?? "",
    model: localStorage.getItem(LS_KEY_MODEL) ?? "llama3-8b-8192",
    temperature: Number.parseFloat(
      localStorage.getItem(LS_KEY_TEMPERATURE) ?? "0.7",
    ),
  };
}

export function saveLlamaConfig(config: Partial<LlamaConfig>) {
  if (config.apiKey !== undefined)
    localStorage.setItem(LS_KEY_API_KEY, config.apiKey);
  if (config.model !== undefined)
    localStorage.setItem(LS_KEY_MODEL, config.model);
  if (config.temperature !== undefined)
    localStorage.setItem(LS_KEY_TEMPERATURE, config.temperature.toString());
}

export function getLlamaVisionModel(): string {
  return localStorage.getItem(LS_KEY_VISION_MODEL) ?? DEFAULT_VISION_MODEL;
}

export function saveLlamaVisionModel(model: string) {
  localStorage.setItem(LS_KEY_VISION_MODEL, model);
}

/**
 * Call Groq's vision-capable Llama model with an image.
 * Sends a base64-encoded image and a text prompt.
 * Returns the model's text response.
 */
export async function callLlamaVision(
  base64Image: string,
  mimeType: string,
  prompt: string,
  config?: Partial<LlamaConfig>,
): Promise<string> {
  const cfg = { ...getLlamaConfig(), ...config };
  if (!cfg.apiKey) {
    throw new Error("NO_API_KEY");
  }

  const visionModel = getLlamaVisionModel();

  try {
    const resp = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: visionModel,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
                {
                  type: "text",
                  text: prompt,
                },
              ],
            },
          ],
          temperature: 0.1, // low temp for accurate extraction
          max_tokens: 4096,
          stream: false,
        }),
      },
    );

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "Unknown error");
      if (resp.status === 401) throw new Error("INVALID_API_KEY");
      if (resp.status === 429) throw new Error("RATE_LIMIT");
      if (resp.status === 400) throw new Error(`BAD_REQUEST:${errText}`);
      throw new Error(`API_ERROR:${resp.status}:${errText}`);
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
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
 * Call Llama AI via Groq's OpenAI-compatible chat completions endpoint.
 * Get a free API key at https://console.groq.com
 */
export async function callLlamaApi(
  messages: LlamaMessage[],
  config?: Partial<LlamaConfig>,
): Promise<string> {
  const cfg = { ...getLlamaConfig(), ...config };
  if (!cfg.apiKey) {
    throw new Error("NO_API_KEY");
  }

  try {
    const resp = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: cfg.model,
          messages,
          temperature: cfg.temperature,
          max_tokens: 1024,
          stream: false,
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
    const content = data?.choices?.[0]?.message?.content;
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
  // Try new key first, fall back to old Qwen key for migration
  const newKey = `lekhya_chat_history_${userPrincipal}_${businessId}`;
  const oldKey = `lekhya_qwen_chat_${userPrincipal}_${businessId}`;
  try {
    const raw =
      localStorage.getItem(newKey) ?? localStorage.getItem(oldKey) ?? "";
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
