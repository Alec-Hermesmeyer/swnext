import Head from "next/head";
import TWLayout from "@/components/TWLayout";
import HomeTailwindPage from "../home-tailwind";

export default function TailwindSite() {
  return <HomeTailwindPage />;
}

TailwindSite.getLayout = function getLayout(page) {
  return (
    <TWLayout>
      <Head>
        <title>S&W Foundation | Tailwind Site</title>
        <meta name="robots" content="noindex" />
      </Head>
      {page}
    </TWLayout>
  );
};


