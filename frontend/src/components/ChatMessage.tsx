import ReactMarkdown from 'react-markdown'
import type { Message } from '../types'

interface Props {
  message: Message
  isStreaming?: boolean
}

const ChatMessage = ({ message, isStreaming = false }: Props) => {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm text-white'
            : 'rounded-bl-sm text-stone-800 border border-stone-200 bg-stone-50'
        }`}
        style={isUser ? { background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' } : undefined}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-stone-900 text-sm">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
              h2: ({ children }) => <h2 className="font-semibold text-stone-900 text-sm mt-3 mb-1">{children}</h2>,
              h3: ({ children }) => <h3 className="font-semibold text-stone-900 text-sm mt-2 mb-1">{children}</h3>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
        {isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-stone-400 ml-0.5 align-middle animate-pulse" />
        )}
      </div>
    </div>
  )
}

export default ChatMessage
