// src/components/Header.jsx
import { Link, NavLink } from "react-router-dom";
import { BRAND } from "../config/brand.js";
import useOwner from "../hooks/useOwner.js";
import "./Header.css";

export default function Header() {
  const { isOwner } = useOwner();

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="app-header__brand" aria-label="Ir para a página inicial do RKMMAX">
          <span className="brand-full">{BRAND.lockup}</span>
          <span className="brand-short">{BRAND.shortLockup}</span>
        </Link>

        <nav className="app-header__nav nav" aria-label="Navegação principal">
          <NavLink to="/" className="app-header__link">
            Home
          </NavLink>
          <NavLink to="/serginho" className="app-header__link">
            Serginho
          </NavLink>
          <NavLink to="/hybrid" className="app-header__link" title="Sistema Híbrido Otimizado">
            🤖 Híbrido
          </NavLink>
          <NavLink to="/specialists" className="app-header__link">
            Especialistas
          </NavLink>
          <NavLink to="/startup" className="app-header__link">
            Startup
          </NavLink>
          <NavLink to="/study" className="app-header__link">
            Study Lab
          </NavLink>
        </nav>

        <div className="app-header__actions">
          {isOwner && (
            <NavLink to="/dashboard" className="app-header__link app-header__link--action" title="Painel do administrador">
              🛠️ Dashboard
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
