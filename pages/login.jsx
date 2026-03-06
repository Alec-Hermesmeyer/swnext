import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import TWLayout from "@/components/TWLayout";
import { GridPattern } from "@/components/GridPattern";
import supabase from "@/components/Supabase";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

export default function LoginTW() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError("Please enter your email.");
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (error) {
        if (String(error.message || "").toLowerCase().includes("invalid login credentials")) {
          setError(
            "Invalid login credentials. Verify email/password, then try password reset below if needed."
          );
        } else {
          setError(error.message);
        }
      } else {
        await supabase.auth.getSession();
        router.replace("/admin");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setError("Enter your email first, then click reset password.");
      return;
    }
    setResetting(true);
    setError(null);
    setNotice(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) {
        setError(error.message);
      } else {
        setNotice("Password reset link sent. Check your inbox.");
      }
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Login | Tailwind</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="relative min-h-[70vh] py-16">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <GridPattern className="h-full w-full" yOffset={0} interactive strokeColor="#0b2a5a" strokeOpacity={0.12} />
        </div>
        <div className="flex items-center justify-center min-h-[60vh]">
          <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto rounded-2xl bg-white/90 p-8 shadow-2xl ring-1 ring-black/10 backdrop-blur-sm">
          <h1 className={`${lato.className} mb-6 text-center text-3xl font-extrabold text-[#0b2a5a]`}>Admin Login</h1>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-neutral-700">Email</label>
              <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-neutral-700">Password</label>
              <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" />
            </div>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
            {notice && <p className="text-sm font-semibold text-green-700">{notice}</p>}
            <button type="submit" disabled={loading} className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-lg bg-red-600 font-bold text-white shadow hover:bg-red-700">{loading?"Logging in...":"Login"}</button>
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetting}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg border border-neutral-300 bg-white font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              {resetting ? "Sending reset link..." : "Reset Password"}
            </button>
          </div>
          </form>
        </div>
      </main>
    </>
  );
}

LoginTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};
