"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("Utente non trovato");
      } else if (err.code === "auth/wrong-password") {
        setError("Password non corretta");
      } else {
        setError("Errore durante l'accesso");
      }
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err) {
      setError("Errore con Google");
    }

    setGoogleLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT SIDE – VISUAL / BRAND */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white items-center justify-center p-12">
        <div className="max-w-md">
          <div className="text-5xl mb-6">🥦</div>

          <h1 className="text-3xl font-bold mb-4">
            Frigo condiviso, zero sprechi
          </h1>

          <p className="text-emerald-100 leading-relaxed">
            Monitora gli alimenti, condividi le scorte con i tuoi coinquilini
            e ricevi suggerimenti di ricette basati su ciò che hai già.
          </p>

          <Link
            href="/"
            className="inline-block mt-8 text-sm underline text-emerald-100 hover:text-white"
          >
            ← Torna alla home
          </Link>
        </div>
      </div>

      {/* RIGHT SIDE – LOGIN CARD */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-center mb-8">
            <div className="text-3xl mb-2">🔐</div>
            <h2 className="text-2xl font-semibold text-slate-800">
              Accedi al tuo account
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Continua a gestire il tuo frigorifero
            </p>
          </div>

          {/* EMAIL LOGIN */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="text-sm text-slate-600">Email</label>
              <input
                type="email"
                required
                placeholder="nome@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm text-slate-600">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 text-white py-2.5 font-medium
              hover:bg-emerald-600 transition disabled:opacity-70"
            >
              {loading ? "Accesso..." : "Accedi"}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="px-3 text-sm text-slate-400">oppure</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* GOOGLE LOGIN */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center text-slate-600 gap-3
            border border-slate-300 rounded-xl py-2.5 text-sm font-medium
            hover:bg-slate-50 transition disabled:opacity-70"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            {googleLoading ? "Accesso..." : "Continua con Google"}
          </button>

          {/* REGISTER LINK */}
          <p className="text-center text-sm text-slate-600 mt-6">
            Non hai un account?{" "}
            <Link
              href="/register"
              className="font-medium text-emerald-600 hover:underline"
            >
              Registrati
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}