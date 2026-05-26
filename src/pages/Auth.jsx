import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import "./Auth.css";

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

  useEffect(() => {
    if (!email) {
      setCooldown(0);
      return;
    }
    const remaining = getRemainingCooldown(email);
    setCooldown(remaining);
  }, [email]);

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
    <main className="auth-page" role="main" aria-label="Login no RKMMAX">
      <section className="auth-page__panel rkm-card rkm-card-elevated" aria-labelledby="auth-title">
        <div className="auth-page__intro">
          <span className="auth-page__eyebrow">Acesso seguro</span>
          <h1 id="auth-title" className="auth-page__title">
            Login no RKMMax
          </h1>
          <p className="auth-page__subtitle">
            Digite seu e-mail para receber um link mágico de acesso. Nenhuma senha é armazenada no
            front-end.
          </p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <label className="auth-form__label" htmlFor="auth-email">
            E-mail
          </label>
          <input
            id="auth-email"
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="auth-form__input rkm-input"
          />
          <button type="submit" disabled={isDisabled} className="auth-form__submit rkm-btn rkm-btn-primary">
            {loading
              ? "Enviando..."
              : cooldown > 0 ? `Aguarde ${cooldown}s para tentar novamente` : "Entrar"}
          </button>
        </form>

        {message ? (
          <p className={`auth-page__message${message.startsWith("Erro:") ? " auth-page__message--error" : ""}`}>
            {message}
          </p>
        ) : null}
      </section>
    </main>
  );
}
