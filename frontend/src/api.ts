import type { Message } from './types'

export const streamChat = async (
  message: string,
  history: Message[],
  onDelta: (delta: string) => void,
  onStatus: (status: string) => void,
  onDone: () => void,
) => {
  const BASE_URL = import.meta.env.VITE_API_URL ?? ''

  const response = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue

      try {
        const data = JSON.parse(line.slice(6))
        if (data.delta) onDelta(data.delta)
        if (data.status) onStatus(data.status)
        if (data.done) onDone()
      } catch {
        // incomplete JSON chunk, skip
      }
    }
  }
}
