const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
//const MODEL = "moonshotai/kimi-k2-thinking";
const MODEL = "nvidia/llama-3.3-nemotron-super-49b-v1.5";
const TIMEOUT_MS = 300000;

export async function analyzeIdea(idea: string): Promise<string> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;

  if (!apiKey) {
    throw new Error("NVIDIA_NIM_API_KEY is not configured");
  }

  const { getValidationPrompt } = await import("./prompts");
  const { system, user } = getValidationPrompt(idea);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`NIM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in API response");
    }

    return content;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out while waiting for NVIDIA NIM");
    }

    throw error;
  }
}

export async function streamIdeaAnalysis(
  idea: string,
  onToken: (token: string) => void | Promise<void>
): Promise<void> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;

  if (!apiKey) {
    throw new Error("NVIDIA_NIM_API_KEY is not configured");
  }

  const { getStreamingValidationPrompt } = await import("./prompts");
  const { system, user } = getStreamingValidationPrompt(idea);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.1,
        max_tokens: 3072,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      clearTimeout(timeoutId);
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(`NIM API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();

    if (!reader) {
      clearTimeout(timeoutId);
      throw new Error("NIM API stream body was empty");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf("\n");

      while (newlineIndex !== -1) {
        const rawLine = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (rawLine.startsWith("data:")) {
          const payload = rawLine.slice(5).trim();

          if (payload === "[DONE]") {
            clearTimeout(timeoutId);
            return;
          }

          if (payload) {
            const parsed = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };

            const content = parsed.choices?.[0]?.delta?.content;

            if (typeof content === "string" && content.length > 0) {
              await onToken(content);
            }
          }
        }

        newlineIndex = buffer.indexOf("\n");
      }
    }

    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out while waiting for NVIDIA NIM");
    }

    throw error;
  }
}
