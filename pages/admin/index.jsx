import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import AdminAssistantLayout from "@/components/admin/AdminAssistantLayout";
import AdminAssistantWorkspace from "@/components/admin/AdminAssistantWorkspace";

function AdminHomeTW() {
  return (
    <>
      <Head>
        <title>Assistant | S&W Admin</title>
        <meta name="robots" content="noindex" />
      </Head>

      <AdminAssistantWorkspace variant="page" />
    </>
  );
}

AdminHomeTW.getLayout = function getLayout(page) {
  return <AdminAssistantLayout>{page}</AdminAssistantLayout>;
};

export default withAuthTw(AdminHomeTW);
