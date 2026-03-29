// src/components/abnt/ReferenceLibrary.jsx
// Biblioteca de referências com localStorage.
// TASK 2 (2026-03-29): adicionada organização por projetos, portada de
// formatador-abnt/client/src/hooks/useReferenceLibrary.ts.
// Retrocompatível: estrutura de dados existente (sem projectId) continua funcionando.
// Sem chamadas externas, sem banco, sem cloud.
import React, { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "rkmmax_abnt_library";
const PROJECTS_KEY = "rkmmax_abnt_projects";

// ─── Estilos inline ───────────────────────────────────────────────────────────

const s = {
  card: {
    background: "white",
    borderRadius: 12,
    padding: 20,
    border: "1px solid #e2e8f0",
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
  desc: { fontSize: 13, color: "#64748b", marginBottom: 12 },
  row: { display: "flex", gap: 8, marginBottom: 8, alignItems: "center" },
  searchInput: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 13,
    boxSizing: "border-box",
  },
  select: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 12,
    color: "#374151",
    background: "white",
    cursor: "pointer",
  },
  projectRow: {
    display: "flex",
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  projectChip: (active) => ({
    padding: "4px 10px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid",
    borderColor: active ? "#667eea" : "#cbd5e1",
    background: active ? "#667eea" : "white",
    color: active ? "white" : "#64748b",
    transition: "all 0.15s",
  }),
  addProjectInput: {
    padding: "4px 8px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 12,
    width: 110,
  },
  addProjectBtn: {
    padding: "4px 10px",
    borderRadius: 8,
    background: "#10b981",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
  },
  empty: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    padding: "20px 0",
  },
  refItem: {
    background: "#f8fafc",
    borderRadius: 8,
    padding: 10,
    border: "1px solid #e2e8f0",
    marginBottom: 8,
  },
  refText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#374151",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  refMeta: {
    display: "flex",
    gap: 8,
    marginTop: 6,
    alignItems: "center",
    flexWrap: "wrap",
  },
  badge: (color) => ({
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 6,
    background: color,
    color: "white",
    fontWeight: 600,
  }),
  projectBadge: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 6,
    background: "#e0e7ff",
    color: "#4338ca",
    fontWeight: 600,
  },
  btnRow: { display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" },
  btnSm: (color) => ({
    padding: "4px 10px",
    borderRadius: 6,
    background: color,
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
  }),
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTop: "1px solid #e2e8f0",
  },
  count: { fontSize: 12, color: "#94a3b8" },
  clearBtn: {
    fontSize: 11,
    color: "#ef4444",
    background: "none",
    border: "none",
    cursor: "pointer",
  },
};

const TYPE_COLORS = {
  livro: "#3b82f6",
  artigo: "#8b5cf6",
  site: "#10b981",
  tese: "#f59e0b",
  outro: "#6b7280",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ReferenceLibrary({ onSelectReference }) {
  const [refs, setRefs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [activeProject, setActiveProject] = useState(null); // null = todos
  const [newProjectName, setNewProjectName] = useState("");

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const savedRefs = localStorage.getItem(STORAGE_KEY);
      if (savedRefs) setRefs(JSON.parse(savedRefs));
      const savedProjects = localStorage.getItem(PROJECTS_KEY);
      if (savedProjects) setProjects(JSON.parse(savedProjects));
    } catch {}
  }, []);

  const saveRefs = (updated) => {
    setRefs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const saveProjects = (updated) => {
    setProjects(updated);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
  };

  // Adicionar projeto
  const handleAddProject = () => {
    const name = newProjectName.trim();
    if (!name || projects.find((p) => p.name === name)) return;
    const newProject = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      name,
      createdAt: new Date().toISOString(),
    };
    saveProjects([...projects, newProject]);
    setNewProjectName("");
  };

  // Remover projeto (desvincula referências, não as apaga)
  const handleRemoveProject = (projectId) => {
    saveProjects(projects.filter((p) => p.id !== projectId));
    const updated = refs.map((r) =>
      r.projectId === projectId ? { ...r, projectId: undefined } : r
    );
    saveRefs(updated);
    if (activeProject === projectId) setActiveProject(null);
  };

  // Atribuir referência a projeto
  const handleAssignProject = (refId, projectId) => {
    const updated = refs.map((r) =>
      r.id === refId ? { ...r, projectId: projectId || undefined } : r
    );
    saveRefs(updated);
  };

  const handleRemove = (id) => saveRefs(refs.filter((r) => r.id !== id));

  const handleClear = () => {
    if (window.confirm("Limpar toda a biblioteca?")) {
      localStorage.removeItem(STORAGE_KEY);
      setRefs([]);
    }
  };

  // Filtrar por busca + projeto ativo
  const filtered = refs.filter((r) => {
    const matchSearch = search
      ? r.text.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchProject = activeProject ? r.projectId === activeProject : true;
    return matchSearch && matchProject;
  });

  const getProjectName = (projectId) =>
    projects.find((p) => p.id === projectId)?.name || null;

  return (
    <div style={s.card}>
      <div style={s.title}>📚 Biblioteca de Referências</div>
      <div style={s.desc}>Referências salvas neste dispositivo</div>

      {/* Filtro por projetos */}
      <div style={s.projectRow}>
        <button
          style={s.projectChip(activeProject === null)}
          onClick={() => setActiveProject(null)}
        >
          Todos
        </button>
        {projects.map((p) => (
          <button
            key={p.id}
            style={s.projectChip(activeProject === p.id)}
            onClick={() => setActiveProject(activeProject === p.id ? null : p.id)}
            title={`Filtrar por: ${p.name}`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Adicionar projeto */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <input
          style={s.addProjectInput}
          placeholder="Novo projeto..."
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddProject()}
        />
        <button style={s.addProjectBtn} onClick={handleAddProject}>
          + Projeto
        </button>
      </div>

      {/* Busca */}
      <div style={s.row}>
        <input
          style={s.searchInput}
          placeholder="Buscar referências..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={s.empty}>
          {refs.length === 0
            ? "Nenhuma referência salva ainda."
            : "Nenhum resultado para os filtros aplicados."}
        </div>
      ) : (
        filtered.map((ref) => (
          <div key={ref.id} style={s.refItem}>
            <div style={s.refText}>{ref.text}</div>
            <div style={s.refMeta}>
              <span style={s.badge(TYPE_COLORS[ref.type] || TYPE_COLORS.outro)}>
                {ref.type || "outro"}
              </span>
              {ref.projectId && getProjectName(ref.projectId) && (
                <span style={s.projectBadge}>
                  📁 {getProjectName(ref.projectId)}
                </span>
              )}
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                {new Date(ref.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>

            {/* Atribuir a projeto */}
            {projects.length > 0 && (
              <select
                style={{ ...s.select, marginTop: 6, fontSize: 11 }}
                value={ref.projectId || ""}
                onChange={(e) => handleAssignProject(ref.id, e.target.value)}
              >
                <option value="">Sem projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <div style={s.btnRow}>
              {onSelectReference && (
                <button
                  style={s.btnSm("#667eea")}
                  onClick={() => onSelectReference(ref.text)}
                >
                  ↩ Usar
                </button>
              )}
              <button
                style={s.btnSm("#94a3b8")}
                onClick={() => navigator.clipboard.writeText(ref.text)}
              >
                📋 Copiar
              </button>
              <button
                style={s.btnSm("#ef4444")}
                onClick={() => handleRemove(ref.id)}
              >
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

      {/* Gerenciar projetos (remover) */}
      {projects.length > 0 && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
            Gerenciar projetos:
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {projects.map((p) => (
              <span
                key={p.id}
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {p.name}
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 11,
                    padding: 0,
                  }}
                  onClick={() => handleRemoveProject(p.id)}
                  title={`Remover projeto ${p.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hook utilitário (retrocompatível) ────────────────────────────────────────

export function useReferenceLibrary() {
  const [refs, setRefs] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setRefs(JSON.parse(saved));
    } catch {}
  }, []);

  const addReference = useCallback(
    (text, type = "outro", projectId = undefined) => {
      const newRef = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text,
        type,
        createdAt: new Date().toISOString(),
        projectId,
      };
      const updated = [newRef, ...refs];
      setRefs(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newRef;
    },
    [refs]
  );

  return { refs, addReference };
}
