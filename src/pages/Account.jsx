// src/pages/Account.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useNavigate } from "react-router-dom";

export default function Account() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  // Campos do profile
  const [agentMode, setAgentMode] = useState("auto");
  const [prefsText, setPrefsText] = useState("{}"); // texto JSON editável
  const [createdAt, setCreatedAt] = useState(null);

  // Carrega usuário e perfil
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        const u = userData?.user;
        if (!u) {
          navigate("/login");
          return;
        }
        setUser(u);

        // Busca profile por user_id
        let { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", u.id)
          .single();

        // Se não existir, cria um básico
        if (profErr && profErr.code === "PGRST116") {
          const { data: inserted, error: insErr } = await supabase
            .from("profiles")
            .insert({
              user_id: u.id,
              agente_mode: "auto",
              prefs: {},
            })
            .select()
            .single();
          if (insErr) throw insErr;
          profile = inserted;
        } else if (profErr) {
          throw profErr;
        }

        setAgentMode(profile?.agente_mode || "auto");
        setPrefsText(JSON.stringify(profile?.prefs || {}, null, 2));
        setCreatedAt(profile?.created_at || null);
      } catch (err) {
        console.error("Erro carregando conta:", err);
        alert("Não foi possível carregar sua conta: " + (err?.message || err));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Valida JSON
      let parsedPrefs = {};
      try {
        parsedPrefs = prefsText?.trim() ? JSON.parse(prefsText) : {};
      } catch {
        alert("O campo 'prefs' precisa ser um JSON válido.");
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          agente_mode: agentMode,
          prefs: parsedPrefs,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      alert("Dados salvos com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao salvar: " + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Carregando sua conta...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Minha Conta</h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
          <input
            value={user?.email || ""}
            readOnly
            className="w-full border rounded p-2 bg-gray-100 text-gray-700"
          />
        </div>

        {createdAt && (
          <div className="mb-6 text-sm text-gray-500">
            Conta criada em: {new Date(createdAt).toLocaleString()}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modo do Agente (agente_mode)
            </label>
            <select
              value={agentMode}
              onChange={(e) => setAgentMode(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="auto">auto</option>
              <option value="premium">premium</option>
              <option value="basic">basic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferências (prefs - JSON)
            </label>
            <textarea
              rows={8}
              value={prefsText}
              onChange={(e) => setPrefsText(e.target.value)}
              className="w-full border rounded p-2 font-mono"
              placeholder='Ex.: { "tema": "escuro" }'
            />
            <p className="text-xs text-gray-500 mt-1">Dica: precisa ser um JSON válido.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/home")}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
