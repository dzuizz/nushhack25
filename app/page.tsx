"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (authLoading || !user) return;

    if (!user.hasCompletedProfile) {
      router.push("/profile-setup");
      return;
    }
    router.push("/main");
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    if (process.env.NODE_ENV !== "production") {
      console.debug("[auth] submitting", {
        mode: mode ? "signup" : "signin",
        email,
      });
    }

    try {
      if (mode) await signUp(email, password);
      else await signIn(email, password);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      setMsg(errorMessage);
    }
  };

  if (authLoading)
    return (
      <div className="min-h-screen flex bg-cream items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-pri border-t-transparent mb-4"></div>
          <p className="text-fg text-lg font-medium">Loading...</p>
        </div>
      </div>
    );

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-cream px-4">
      <div className="my-8 text-center">
        <div className="flex items-center justify-center w-20 h-20 flex shadow-lg mx-auto mb-4">
          <Image
            src="/logo.png"
            alt="logo"
            width={80}
            height={80}
            className="w-full h-full shadow-sm transition-shadow object-contain"
          />
        </div>
        <h1 className="mb-3 font-black text-5xl text-fg">Fren</h1>
        <p className="text-medium-blue text-lg font-semibold">
          diversity in varsity
        </p>
      </div>
      <div className="m-4 border border-border-gray bg-off-white p-8 shadow-lg max-w-md w-full">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-fg">
            {mode ? "Sign up" : "Sign in"}
          </h2>
          <p className="text-sec font-medium mt-2">
            {mode ? "to start meeting others" : "to continue making friends"}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              className="text-sm font-semibold text-fg mb-2 block"
              htmlFor="email"
            >
              Email address
            </label>
            <input
              className="w-full border border-border-gray px-4 text-fg py-3 focus:border-accent-blue focus:outline-none font-medium"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nushhack25@example.com"
              autoComplete="email"
              inputMode="email"
              value={email}
              type="email"
              id="email"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-semibold text-fg mb-2 block"
            >
              Password
            </label>
            <input
              className="w-full px-4 py-3 border border-border-gray text-fg focus:outline-none focus:border-accent-blue font-medium"
              autoComplete={mode ? "new-password" : "current-password"}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              value={password}
              type="password"
              id="password"
              minLength={6}
              required
            />
          </div>

          {msg && (
            <div
              className="text-sm bg-light-pink p-4 text-retro-pink text-center font-semibold border border-retro-pink"
              aria-live="polite"
              role="alert"
            >
              {msg}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-retro-pink py-4 font-bold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 text-lg cursor-pointer"
          >
            {mode ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode((v) => !v);
              setMsg("");
            }}
            className="text-sm font-semibold text-sec hover:text-accent-blue transition-colors px-4 py-2"
          >
            {mode
              ? "Already have an account? Sign in"
              : "New here? Create an account"}
          </button>
        </div>
      </div>
    </main>
  );
}
