// src/pages/Auth.jsx
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient.js";

const COOLDOWN_SECONDS = 60;
const RATE_LIMIT_COOLDOWN_SECONDS = 300;
const LS_KEY_PREFIX = "rkmmax:magiclink:cooldown:";

function getCooldownKey(email) {
  return LS_KEY_PREFIX + email.trim().toLowerCase();
}

function getRemainingCooldown(email) {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(getCooldownKey(email));
    if (!raw) return 0;
    const expiresAt = parseInt(raw, 10);
    const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
}

function setCooldownExpiry(email, seconds = COOLDOWN_SECONDS) {
  if (typeof window === "undefined") return;
  try {
    const expiresAt = Date.now() + seconds * 1000;
    window.localStorage.setItem(getCooldownKey(email), String(expiresAt));
  } catch {
    // localStorage not available — no persistence
  }
}

export default function Auth() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef(null);

  // Restaura cooldown do localStorage ao digitar o e-mail
  useEffect(() => {
    if (!email) {
      setCooldown(0);
      return;
    }
    const remaining = getRemainingCooldown(email);
    setCooldown(remaining);
  }, [email]);

  // Inicia contagem regressiva quando cooldown > 0
  useEffect(() => {
    if (cooldown <= 0) {
      clearInterval(intervalRef.current);
      return;
    }
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [cooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;

    setMessage("");
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail });

      if (error) {
        const msg = error.message || "";
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes("email rate limit exceeded") || lowerMsg.includes("rate limit")) {
          setMessage("Muitas tentativas de envio. Aguarde alguns minutos antes de pedir outro link.");
          setCooldownExpiry(normalizedEmail, RATE_LIMIT_COOLDOWN_SECONDS);
          setCooldown(RATE_LIMIT_COOLDOWN_SECONDS);
        } else {
          setMessage(`Erro: ${msg}`);
        }
      } else {
        setMessage("Enviamos o link de acesso. Verifique seu e-mail. Aguarde antes de solicitar outro link.");
        setCooldownExpiry(normalizedEmail);
        setCooldown(COOLDOWN_SECONDS);
      }
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || cooldown > 0;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-2xl shadow-md w-96">
        <h2 className="text-xl font-bold mb-4 text-center">Login no RKMMax</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isDisabled}
            className="w-full bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Enviando..."
              : cooldown > 0
              ? `Aguarde ${cooldown}s para tentar novamente`
              : "Entrar"}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-yellow-400">{message}</p>}
      </div>
    </div>
  );
}
