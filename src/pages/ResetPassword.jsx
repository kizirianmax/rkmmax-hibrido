// src/pages/ResetPassword.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);

  // Detecta se a página foi aberta a partir do link de recuperação
  useEffect(() => {
    // Ex.: .../#access_token=...&type=recovery
    const hash = window.location.hash || "";
    const isRec = hash.includes("type=recovery");
    setIsRecovery(isRec);

    // Opcional: garante a sessão do recovery
    // Supabase costuma setar a sessão automaticamente quando chega com o hash.
    // Mas se quiser confirmar:
    // supabase.auth.getSession().then(({ data }) => console.log("session:", data.session));
  }, []);

  async function sendResetEmail(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      setMsg("Enviamos um link de recuperação para o seu e-mail.");
    } catch (err) {
      setMsg(`Erro: ${err.message || "falha ao enviar o e-mail"}`);
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword(e) {
    e.preventDefault();
    setMsg("");
    if (!newPass || newPass.length < 6) {
      setMsg("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (newPass !== confirm) {
      setMsg("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setMsg("Senha alterada com sucesso! Você já pode entrar normalmente.");
      // Opcional: redirecionar após alguns segundos:
      // setTimeout(() => (window.location.href = "/login"), 1500);
    } catch (err) {
      setMsg(`Erro: ${err.message || "falha ao alterar a senha"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-2">
          {isRecovery ? "Definir nova senha" : "Recuperar senha"}
        </h1>
        <p className="text-center text-gray-300 mb-6">
          {isRecovery
            ? "Crie sua nova senha para acessar sua conta."
            : "Informe seu e-mail para receber o link de recuperação."}
        </p>

        {!isRecovery ? (
          <form onSubmit={sendResetEmail} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring focus:ring-indigo-500"
                placeholder="voce@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 px-3 py-2 rounded-lg font-semibold"
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>
        ) : (
          <form onSubmit={updatePassword} className="space-y-4">
            <div>
              <label className="text-sm text-gray-300">Nova senha</label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
                minLength={6}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300">Confirmar senha</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-70 px-3 py-2 rounded-lg font-semibold"
            >
              {loading ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}

        {msg && <p className="mt-4 text-center text-yellow-400">{msg}</p>}

        {!isRecovery && (
          <p className="mt-6 text-center text-gray-400 text-sm">
            Depois de clicar no link do e-mail, você será trazido de volta para esta página para
            definir a nova senha.
          </p>
        )}
      </div>
    </div>
  );
}
