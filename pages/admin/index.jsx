import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import AdminAssistantWorkspace from "@/components/admin/AdminAssistantWorkspace";
import { GridPatternTailwind } from "@/components/GridPatternTailwind";
import { useSetSidebarExtra } from "@/context/SidebarContext";

/* ── Thread list rendered inside the sidebar ── */

function ChatThreadsSidebar({ data }) {
  const [expanded, setExpanded] = useState(false);

  if (!data) return null;

  const {
    threads = [],
    threadsLoading,
    conversationTitle,
    hasUserMessages,
    startNewConversation,
    switchThread,
  } = data;

  const visible = expanded ? threads : threads.slice(0, 5);

  return (
    <div className="mt-4 border-t border-white/10 pt-4 space-y-3">
      <button
        type="button"
        onClick={startNewConversation}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        New conversation
      </button>

      {hasUserMessages && conversationTitle && (
        <div className="rounded-lg bg-white/10 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Active thread</div>
          <div className="mt-1 truncate text-[12px] font-medium text-white/80">{conversationTitle}</div>
        </div>
      )}

      {threads.length > 0 && (
        <div>
          <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Previous conversations
          </div>
          <div className="mt-1.5 space-y-0.5">
            {visible.map((thread) => (
              <button
                key={thread.sessionId}
                type="button"
                onClick={() => switchThread(thread.sessionId)}
                className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/8"
              >
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-white/65">
                    {thread.title.length > 38 ? `${thread.title.slice(0, 38)}...` : thread.title}
                  </div>
                  <div className="text-[10px] text-white/30">
                    {new Date(thread.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {threads.length > 5 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 w-full px-3 text-[11px] font-medium text-white/40 hover:text-white/60 transition-colors"
            >
              {expanded ? "Show less" : `Show all ${threads.length}`}
            </button>
          )}
          {threadsLoading && (
            <div className="mt-1 px-3 text-[10px] text-white/30">Loading...</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page component ── */

function AdminHomeTW() {
  const setSidebarExtra = useSetSidebarExtra();
  const [threadData, setThreadData] = useState(null);

  const handleThreadsReady = useCallback((data) => {
    setThreadData(data);
  }, []);

  // Push thread sidebar into the layout whenever data changes
  useEffect(() => {
    if (threadData) {
      setSidebarExtra(<ChatThreadsSidebar data={threadData} />);
    }
    return () => setSidebarExtra(null);
  }, [threadData, setSidebarExtra]);

  return (
    <>
      <Head>
        <title>AI Assistant | S&W Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="flex h-[calc(100vh-115px)] min-h-0 flex-col">
        <AdminAssistantWorkspace
          variant="page"
          hideSideRail
          onThreadsReady={handleThreadsReady}
        />
      </div>
    </>
  );
}

AdminHomeTW.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(AdminHomeTW);
