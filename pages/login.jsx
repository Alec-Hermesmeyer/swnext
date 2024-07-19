import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GridPattern } from "@/components/GridPattern";
import { FadeIn } from "@/components/FadeIn";
import { Inter } from "next/font/google";
import styles from "../styles/Login.module.css";
import { createClient } from "@supabase/supabase-js";
import supabase from "@/components/Supabase";


const inter = Inter({ subsets: ["latin"] });

function Spacer() {
  return (
    <GridPattern className={styles.gridPattern} yOffset={10} interactive />
  );
}
function Form() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/admin/dashboard");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.form}>
      <div className={styles.formContainer}>
        <div className={styles.formWrapper}>
          <div className={styles.formTop}>
            <h1 className={inter.className}>Login</h1>
          </div>
          <div className={styles.formCenter}>
            <form onSubmit={handleSubmit}>
              <div className={styles.inputContainer}>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputLabelTop}>
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="Email"
                      id="email"
                      name="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className={styles.inputLabelBottom}>
                    <input
                      className={styles.input}
                      type="password"
                      placeholder="Password"
                      id="password"
                      name="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p style={{ color: "red" }}>{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
const login = () => {
  return (
    <div className={styles.login}>
      <Spacer className={styles.spacer} />
      <FadeIn>
        <Form className={styles.formSection} />
      </FadeIn>
      <Spacer className={styles.spacer} />
    </div>
  );
};

export default login;
