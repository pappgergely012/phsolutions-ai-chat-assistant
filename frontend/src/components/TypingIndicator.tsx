interface Props {
  status?: string
}

const TypingIndicator = ({ status }: Props) => (
  <div className="flex justify-start">
    <div className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2 border border-stone-200 bg-stone-50">
      <div className="flex gap-1 items-center">
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
      </div>
      {status && <span className="text-sm text-stone-400">{status}</span>}
    </div>
  </div>
)

export default TypingIndicator
