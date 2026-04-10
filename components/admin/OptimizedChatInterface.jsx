import { useState, useRef, useCallback, useEffect, memo } from "react";
import { Send, Loader2, X, Maximize2, Minimize2 } from "lucide-react";

function renderInlineTokens(line) {
  const parts = String(line || "").split(
    /(\*\*[^*]+\*\*|(?<!\*)\*(?!\*)[^*]+\*(?!\*)|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  );
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if ((part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) ||
        (part.startsWith("_") && part.endsWith("_")))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="rounded bg-neutral-200 px-1 py-0.5 text-xs font-mono">{part.slice(1, -1)}</code>;
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch)
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="underline">{linkMatch[1]}</a>;
    return <span key={i}>{part}</span>;
  });
}

function FormattedText({ text }) {
  if (!text) return null;
  const lines = String(text).split("\n");
  const elements = [];
  let listItems = [];
  let listType = null;
  let inCodeBlock = false;
  let codeLines = [];

  const flushList = () => {
    if (!listItems.length) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    const cls = listType === "ol"
      ? "my-1.5 ml-5 list-decimal space-y-0.5 text-sm"
      : "my-1.5 ml-5 list-disc space-y-0.5 text-sm";
    elements.push(
      <Tag key={`list-${elements.length}`} className={cls}>
        {listItems.map((item, i) => <li key={i}>{renderInlineTokens(item)}</li>)}
      </Tag>
    );
    listItems = [];
    listType = null;
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.trimStart().startsWith("```")) {
      if (!inCodeBlock) { flushList(); inCodeBlock = true; codeLines = []; continue; }
      inCodeBlock = false;
      elements.push(
        <pre key={`code-${elements.length}`} className="my-1.5 overflow-x-auto rounded bg-neutral-800 p-3">
          <code className="text-neutral-100 font-mono text-xs">{codeLines.join("\n")}</code>
        </pre>
      );
      codeLines = [];
      continue;
    }
    if (inCodeBlock) { codeLines.push(line); continue; }
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const lvl = headingMatch[1].length;
      const cls = lvl <= 2 ? "text-sm font-bold mt-2 mb-1" : "text-sm font-semibold mt-1.5 mb-0.5";
      elements.push(<p key={`h-${idx}`} className={cls}>{renderInlineTokens(headingMatch[2])}</p>);
      continue;
    }
    const olMatch = line.match(/^\s*\d+\.\s+(.+)/);
    const ulMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (olMatch) { if (listType && listType !== "ol") flushList(); listType = "ol"; listItems.push(olMatch[1]); continue; }
    if (ulMatch) { if (listType && listType !== "ul") flushList(); listType = "ul"; listItems.push(ulMatch[1]); continue; }
    flushList();
    if (!line.trim()) { elements.push(<div key={`sp-${idx}`} className="h-1.5" />); continue; }
    elements.push(<p key={`p-${idx}`} className="text-sm leading-relaxed">{renderInlineTokens(line)}</p>);
  }
  if (inCodeBlock && codeLines.length) {
    elements.push(
      <pre key={`code-${elements.length}`} className="my-1.5 overflow-x-auto rounded bg-neutral-800 p-3">
        <code className="text-neutral-100 font-mono text-xs">{codeLines.join("\n")}</code>
      </pre>
    );
  }
  flushList();
  return <>{elements}</>;
}

const Message = memo(({ message, isUser }) => (
  <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
    <div
      className={`max-w-[70%] px-4 py-2 rounded-lg ${
        isUser
          ? "bg-blue-600 text-white"
          : "bg-neutral-100 text-neutral-900"
      }`}
    >
      {isUser ? (
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
      ) : (
        <div className="break-words"><FormattedText text={message.text} /></div>
      )}
      <span className="text-xs opacity-70 mt-1 block">
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })}
      </span>
    </div>
  </div>
));

Message.displayName = "Message";

const OptimizedChatInterface = memo(({
  variant = "bubble",
  onClose,
  initialMessages = [],
  placeholder = "Type your message...",
  title = "AI Assistant"
}) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle sending message
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Create abort controller for request cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage.text,
          context: messages.slice(-10) // Send last 10 messages for context
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const aiMessage = {
        id: Date.now() + 1,
        text: data.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      if (error.name !== "AbortError") {
        const errorMessage = {
          id: Date.now() + 1,
          text: "Sorry, I couldn't process your request. Please try again.",
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [inputValue, isLoading, messages]);

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  // Clear chat history
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const containerClass = isExpanded
    ? "fixed inset-4 z-50"
    : variant === "panel"
    ? "h-full"
    : "h-[600px]";

  return (
    <div className={`${containerClass} flex flex-col bg-white rounded-lg shadow-lg`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
            aria-label="Clear chat"
          >
            <span className="text-xs font-medium">Clear</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
            aria-label={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-500 mt-8">
            <p className="text-sm">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                isUser={message.isUser}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-neutral-100 px-4 py-3 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-neutral-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: "38px",
              maxHeight: "120px"
            }}
          />
          {isLoading ? (
            <button
              onClick={cancelRequest}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          )}
        </div>
        {inputValue.length > 500 && (
          <p className="text-xs text-amber-600 mt-1">
            {inputValue.length}/1000 characters
          </p>
        )}
      </div>
    </div>
  );
});

OptimizedChatInterface.displayName = "OptimizedChatInterface";

export default OptimizedChatInterface;
