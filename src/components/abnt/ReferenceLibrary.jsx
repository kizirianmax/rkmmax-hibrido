// src/components/abnt/ReferenceLibrary.jsx
// Portado de rkmmax-app/src/utils/formatador/src/components/ReferenceLibrary.tsx
// Biblioteca local com localStorage — sem chamadas externas
import React, { useState, useEffect } from "react";

const STORAGE_KEY = "rkmmax_abnt_library";

const s = {
  card: { background: "white", borderRadius: 12, padding: 20, border: "1px solid #e2e8f0", marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
  desc: { fontSize: 13, color: "#64748b", marginBottom: 12 },
  searchInput: { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box", marginBottom: 12 },
  empty: { fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "20px 0" },
  refItem: { background: "#f8fafc", borderRadius: 8, padding: 10, border: "1px solid #e2e8f0", marginBottom: 8 },
  refText: { fontSize: 12, fontFamily: "monospace", color: "#374151", lineHeight: 1.5, wordBreak: "break-word" },
  refMeta: { display: "flex", gap: 8, marginTop: 6, alignItems: "center", flexWrap: "wrap" },
  badge: (color) => ({ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: color, color: "white", fontWeight: 600 }),
  btnRow: { display: "flex", gap: 6, marginTop: 6 },
  btnSm: (color) => ({ padding: "4px 10px", borderRadius: 6, background: color, color: "white", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600 }),
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 8, borderTop: "1px solid #e2e8f0" },
  count: { fontSize: 12, color: "#94a3b8" },
  clearBtn: { fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer" },
};

const TYPE_COLORS = {
  livro: "#3b82f6",
  artigo: "#8b5cf6",
  site: "#10b981",
  tese: "#f59e0b",
  outro: "#6b7280",
};

export default function ReferenceLibrary({ onSelectReference }) {
  const [refs, setRefs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setRefs(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (updated) => {
    setRefs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleRemove = (id) => save(refs.filter((r) => r.id !== id));

  const handleClear = () => {
    if (window.confirm("Limpar toda a biblioteca?")) {
      localStorage.removeItem(STORAGE_KEY);
      setRefs([]);
    }
  };

  const filtered = search
    ? refs.filter((r) => r.text.toLowerCase().includes(search.toLowerCase()))
    : refs;

  return (
    <div style={s.card}>
      <div style={s.title}>📚 Biblioteca de Referências</div>
      <div style={s.desc}>Referências salvas neste dispositivo</div>

      <input
        style={s.searchInput}
        placeholder="Buscar referências..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div style={s.empty}>
          {refs.length === 0 ? "Nenhuma referência salva ainda." : "Nenhum resultado para a busca."}
        </div>
      ) : (
        filtered.map((ref) => (
          <div key={ref.id} style={s.refItem}>
            <div style={s.refText}>{ref.text}</div>
            <div style={s.refMeta}>
              <span style={s.badge(TYPE_COLORS[ref.type] || TYPE_COLORS.outro)}>{ref.type || "outro"}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                {new Date(ref.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div style={s.btnRow}>
              {onSelectReference && (
                <button style={s.btnSm("#667eea")} onClick={() => onSelectReference(ref.text)}>
                  ↩ Usar
                </button>
              )}
              <button
                style={s.btnSm("#94a3b8")}
                onClick={() => {
                  navigator.clipboard.writeText(ref.text);
                }}
              >
                📋 Copiar
              </button>
              <button style={s.btnSm("#ef4444")} onClick={() => handleRemove(ref.id)}>
                🗑 Remover
              </button>
            </div>
          </div>
        ))
      )}

      <div style={s.footer}>
        <span style={s.count}>{refs.length} referência(s) salva(s)</span>
        {refs.length > 0 && (
          <button style={s.clearBtn} onClick={handleClear}>
            Limpar tudo
          </button>
        )}
      </div>
    </div>
  );
}

// Hook utilitário para adicionar referências à biblioteca
export function useReferenceLibrary() {
  const [refs, setRefs] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setRefs(JSON.parse(saved));
    } catch {}
  }, []);

  const addReference = (text, type = "outro") => {
    const newRef = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      text,
      type,
      createdAt: new Date().toISOString(),
    };
    const updated = [newRef, ...refs];
    setRefs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRef;
  };

  return { refs, addReference };
}
