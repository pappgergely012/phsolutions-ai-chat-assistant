import { useEffect, useRef, useState } from 'react'
import { streamChat } from './api'
import ChatMessage from './components/ChatMessage'
import TypingIndicator from './components/TypingIndicator'
import type { Message } from './types'

const SUGGESTIONS = [
  'Milyen szolgáltatásokat kínáltok?',
  'Milyen technológiákat használtok?',
  'Mennyibe kerül egy weboldal?',
  'Tudtok AI megoldásokat fejleszteni?',
]

const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const App = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SUGGESTIONS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: 'user', content: trimmed }
    const updatedHistory = [...messages, userMessage]

    setMessages([...updatedHistory, { role: 'assistant', content: '' }])
    setInput('')
    setIsLoading(true)

    await streamChat(
      trimmed,
      messages,
      (delta) => {
        setStatus('')
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + delta,
          }
          return updated
        })
      },
      (newStatus) => setStatus(newStatus),
      () => {
        setIsLoading(false)
        setStatus('')
      },
    )
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="w-[calc(100vw-2rem)] sm:w-[390px] h-[calc(100svh-6rem)] sm:h-[560px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-stone-200"
          style={{ background: '#ffffff' }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <line x1="9" y1="1" x2="9" y2="4" />
                  <line x1="15" y1="1" x2="15" y2="4" />
                  <line x1="9" y1="20" x2="9" y2="23" />
                  <line x1="15" y1="20" x2="15" y2="23" />
                  <line x1="20" y1="9" x2="23" y2="9" />
                  <line x1="20" y1="14" x2="23" y2="14" />
                  <line x1="1" y1="9" x2="4" y2="9" />
                  <line x1="1" y1="14" x2="4" y2="14" />
                </svg>
              </div>
              <div>
                <p className="text-white text-base font-semibold leading-tight">PH Solutions</p>
                <p className="text-white/60 text-sm">AI Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 min-h-0"
            style={{ background: '#ffffff' }}
          >
            {!hasMessages && (
              <div className="flex flex-col items-center justify-center gap-3 h-full text-center">
                <p className="text-base font-medium text-stone-800">Szia! Miben segíthetek? 👋</p>
                <p className="text-sm text-stone-400">Kérdezz bátran magyarul vagy angolul!</p>
                <div className="flex flex-col gap-2 w-full mt-1">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-sm px-3 py-2.5 rounded-lg text-stone-600 hover:text-stone-900 text-left transition-colors border border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasMessages && messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1
              const isLastAssistant = isLastMessage && message.role === 'assistant'
              const isWaitingForFirstToken = isLastAssistant && isLoading && message.content === ''
              const isActivelyStreaming = isLastAssistant && isLoading && message.content !== ''

              if (isWaitingForFirstToken) {
                return <TypingIndicator key={index} status={status} />
              }

              return (
                <ChatMessage
                  key={index}
                  message={message}
                  isStreaming={isActivelyStreaming}
                />
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 flex gap-2 border-t border-stone-200 bg-white shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={SUGGESTIONS[placeholderIndex]}
              disabled={isLoading}
              className="flex-1 px-3 py-2.5 text-[16px] rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-stone-300 bg-white"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="px-3 py-2.5 rounded-lg text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
            >
              <SendIcon />
            </button>
          </div>

          <p className="text-center text-xs text-stone-300 py-1.5 border-t border-stone-100 bg-white shrink-0">
            Powered by PH Solutions
          </p>
        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-105 shrink-0"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>
    </div>
  )
}

export default App
