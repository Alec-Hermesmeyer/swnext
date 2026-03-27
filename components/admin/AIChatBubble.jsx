import { useState } from "react";
import AdminAssistantWorkspace from "@/components/admin/AdminAssistantWorkspace";

export default function AIChatBubble() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open ? (
        <div
          className="fixed bottom-24 right-4 z-50 w-[430px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.25rem] border border-neutral-200 bg-white shadow-[0_24px_80px_rgba(11,42,90,0.28)] sm:right-6"
          style={{ height: "min(680px, calc(100vh - 140px))" }}
        >
          <AdminAssistantWorkspace variant="panel" onClose={() => setOpen(false)} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`fixed bottom-5 right-4 z-50 flex items-center justify-center rounded-full text-white shadow-lg transition-all sm:right-6 ${
          open
            ? "h-12 w-12 bg-neutral-700 hover:bg-neutral-600"
            : "h-14 w-14 bg-[#0b2a5a] hover:scale-105 hover:bg-[#143a75] hover:shadow-xl"
        }`}
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  );
}
