import Head from "next/head";
import { useCallback, useState } from "react";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import AdminAssistantWorkspace from "@/components/admin/AdminAssistantWorkspace";

function AdminHomeTW() {
  const [threadData, setThreadData] = useState(null);

  const handleThreadsReady = useCallback((data) => {
    setThreadData(data);
  }, []);

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

AdminHomeTW.chatThreadData = true;

export default withAuthTw(AdminHomeTW);
