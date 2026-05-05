// src/components/Header.jsx
import React from "react";
import { Link, NavLink } from "react-router-dom";
import { BRAND } from "../config/brand.js";
import useOwner from "../hooks/useOwner.js";

export default function Header() {
  const { isOwner } = useOwner();

  return (
    <header
      style={{
        padding: "10px 16px",
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <Link to="/" style={{ fontWeight: 800, textDecoration: "none", color: "#111" }}>
        <span className="brand-full">{BRAND.lockup}</span>
        <span className="brand-short">{BRAND.shortLockup}</span>
      </Link>

      <nav className="nav" style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/serginho">Serginho</NavLink>
        <NavLink to="/hybrid" title="Sistema Híbrido Otimizado">
          🤖 Híbrido
        </NavLink>
        <NavLink to="/specialists">Especialistas</NavLink>
        <NavLink to="/projects">Startup</NavLink>
        <NavLink to="/study">Study Lab</NavLink>
        {isOwner && (
          <NavLink to="/dashboard" title="Painel do administrador">
            🛠️ Dashboard
          </NavLink>
        )}
      </nav>
    </header>
  );
}
