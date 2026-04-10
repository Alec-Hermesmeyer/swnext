"use client";

import Head from "next/head";
import withAuthTw from "@/components/withAuthTw";
import TWAdminLayout from "@/components/TWAdminLayout";
import HiringPipeline from "@/components/admin/HiringPipeline";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function HiringPage() {
  return (
    <>
      <Head>
        <title>Hiring | Admin</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div>
        <div className="mb-6">
          <h1 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>Hiring pipeline</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Job applicants and recruiting — not shown to the sales team. Use{" "}
            <strong>Sales</strong> for bids and pursuits.
          </p>
        </div>
        <HiringPipeline />
      </div>
    </>
  );
}

HiringPage.getLayout = function getLayout(page) {
  return <TWAdminLayout>{page}</TWAdminLayout>;
};

export default withAuthTw(HiringPage);
