import { useState, lazy, Suspense } from "react";
import { MessageCircle, X, Loader2 } from "lucide-react";

// Lazy load the chat interface for better initial page load
const OptimizedChatInterface = lazy(() => import("./OptimizedChatInterface"));

export default function OptimizedChatBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 z-50 w-[430px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl sm:right-6 transition-all duration-300 ease-out"
          style={{ height: "min(680px, calc(100vh - 140px))" }}
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            }
          >
            <OptimizedChatInterface
              variant="panel"
              onClose={() => setIsOpen(false)}
              title="Crew Assistant"
              placeholder="Ask about schedules, workers, or jobs..."
            />
          </Suspense>
        </div>
      )}

      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-4 z-50 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 sm:right-6 ${
          isOpen
            ? "h-12 w-12 bg-neutral-700 hover:bg-neutral-600 text-white"
            : "h-14 w-14 bg-blue-600 hover:bg-blue-700 hover:scale-105 hover:shadow-xl text-white"
        }`}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-5 h-5" strokeWidth={2.5} />
        ) : (
          <MessageCircle className="w-6 h-6" strokeWidth={1.75} />
        )}
      </button>
    </>
  );
}