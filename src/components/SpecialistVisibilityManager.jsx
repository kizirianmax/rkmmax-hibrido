// src/components/SpecialistVisibilityManager.jsx
import React, { useState } from "react";
import { useSpecialistVisibility } from "../hooks/useSpecialistVisibility.js";
import { specialists, categories } from "../config/specialists.js";

export default function SpecialistVisibilityManager() {
  const {
    isVisible,
    toggleVisibility,
    setAllVisible,
    setCategoryVisible,
    getVisibleCount,
    getHiddenCount,
  } = useSpecialistVisibility();

  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filtrar especialistas por categoria
  const filteredSpecialists = Object.values(specialists).filter(
    (specialist) => selectedCategory === "all" || specialist.category === selectedCategory
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>👁️ Visibilidade dos Especialistas</h2>
        <p style={styles.subtitle}>
          Escolha quais especialistas você quer ver na página de especialistas
        </p>
      </div>

      {/* Estatísticas */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{getVisibleCount()}</div>
          <div style={styles.statLabel}>Visíveis</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{getHiddenCount()}</div>
          <div style={styles.statLabel}>Ocultos</div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div style={styles.quickActions}>
        <button onClick={() => setAllVisible(true)} style={styles.actionButton}>
          ✓ Mostrar Todos
        </button>
        <button
          onClick={() => setAllVisible(false)}
          style={{ ...styles.actionButton, ...styles.actionButtonSecondary }}
        >
          ✗ Ocultar Todos
        </button>
      </div>

      {/* Filtro por categoria */}
      <div style={styles.categoryFilter}>
        <button
          onClick={() => setSelectedCategory("all")}
          style={{
            ...styles.categoryButton,
            ...(selectedCategory === "all" ? styles.categoryButtonActive : {}),
          }}
        >
          Todos
        </button>
        {Object.values(categories).map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            style={{
              ...styles.categoryButton,
              ...(selectedCategory === category.id ? styles.categoryButtonActive : {}),
            }}
          >
            {category.emoji} {category.name}
          </button>
        ))}
      </div>

      {/* Lista de especialistas */}
      <div style={styles.specialistsList}>
        {filteredSpecialists.map((specialist) => (
          <div key={specialist.id} style={styles.specialistItem}>
            <div style={styles.specialistInfo}>
              <span style={styles.specialistEmoji}>{specialist.emoji}</span>
              <div>
                <div style={styles.specialistName}>{specialist.name}</div>
                <div style={styles.specialistDesc}>{specialist.description}</div>
              </div>
            </div>
            <button
              onClick={() => toggleVisibility(specialist.id)}
              style={{
                ...styles.toggleButton,
                ...(isVisible(specialist.id)
                  ? styles.toggleButtonVisible
                  : styles.toggleButtonHidden),
              }}
            >
              {isVisible(specialist.id) ? "👁️ Visível" : "🚫 Oculto"}
            </button>
          </div>
        ))}
      </div>

      {/* Ações por categoria */}
      {selectedCategory !== "all" && (
        <div style={styles.categoryActions}>
          <button
            onClick={() => setCategoryVisible(selectedCategory, true)}
            style={styles.categoryActionButton}
          >
            Mostrar todos de {categories[selectedCategory]?.name}
          </button>
          <button
            onClick={() => setCategoryVisible(selectedCategory, false)}
            style={{ ...styles.categoryActionButton, ...styles.categoryActionButtonSecondary }}
          >
            Ocultar todos de {categories[selectedCategory]?.name}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "24px 16px",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: "0 0 8px",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    margin: 0,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: 12,
    padding: 20,
    textAlign: "center",
    color: "white",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 900,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.9,
  },
  quickActions: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    padding: "12px 24px",
    borderRadius: 10,
    border: "none",
    background: "#10b981",
    color: "white",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  actionButtonSecondary: {
    background: "#ef4444",
  },
  categoryFilter: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  categoryButton: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  categoryButtonActive: {
    background: "#667eea",
    color: "white",
    borderColor: "#667eea",
  },
  specialistsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  specialistItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 16,
    transition: "all 0.2s",
  },
  specialistInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  specialistEmoji: {
    fontSize: 32,
  },
  specialistName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 2,
  },
  specialistDesc: {
    fontSize: 13,
    color: "#64748b",
  },
  toggleButton: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.2s",
    minWidth: 100,
  },
  toggleButtonVisible: {
    background: "#10b981",
    color: "white",
  },
  toggleButtonHidden: {
    background: "#f1f5f9",
    color: "#64748b",
  },
  categoryActions: {
    display: "flex",
    gap: 12,
    marginTop: 24,
    paddingTop: 24,
    borderTop: "1px solid #e2e8f0",
  },
  categoryActionButton: {
    flex: 1,
    padding: "10px 20px",
    borderRadius: 8,
    border: "1px solid #667eea",
    background: "#667eea",
    color: "white",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  },
  categoryActionButtonSecondary: {
    background: "white",
    color: "#667eea",
  },
};
