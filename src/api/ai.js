/**
 * Talking to the site's AI assistant (POST /api/v1/ai/chat).
 *
 * The backend streams the answer back as plain UTF-8 text, so the reply is
 * read chunk by chunk and handed to `onToken` as it arrives. The server keeps
 * no history: the whole conversation is sent with every question.
 */

const BASE = import.meta.env.VITE_API_URL ?? ''

export class AiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'AiError'
    this.status = status
    this.code = code
  }
}

/**
 * @param messages [{ role: 'user' | 'assistant', content }], last one from the user
 * @param lang     'uz' | 'en' — the fallback answer language
 * @param onToken  called with each new piece of text
 * @param signal   AbortSignal, to stop an answer mid-way
 * @returns the full answer text
 */
export async function streamChat({ messages, lang, onToken, signal }) {
  let response
  try {
    response = await fetch(`${BASE}/api/v1/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, lang }),
      signal,
    })
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause
    throw new AiError(0, 'network_error', 'network')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new AiError(
      response.status,
      body?.error?.code ?? 'unknown_error',
      body?.error?.message ?? `HTTP ${response.status}`,
    )
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    const piece = decoder.decode(value, { stream: true })
    if (piece) {
      text += piece
      onToken?.(piece)
    }
  }
  const rest = decoder.decode()
  if (rest) {
    text += rest
    onToken?.(rest)
  }
  return text
}
