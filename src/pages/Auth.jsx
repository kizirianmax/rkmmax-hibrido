// src/pages/Auth.jsx
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setMessage(`Erro: ${error.message}`);
    } else {
      setMessage("Verifique seu e-mail para o link mágico de login!");
    }
  };

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
            className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded-lg font-semibold"
          >
            Entrar
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-yellow-400">{message}</p>}
      </div>
    </div>
  );
}
