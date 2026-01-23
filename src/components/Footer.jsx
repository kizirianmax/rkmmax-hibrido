import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>RKMMAX</h3>
          <p>Plataforma de IA especializada com 54 especialistas</p>
        </div>

        <div className="footer-section">
          <h3>POLÍTICAS</h3>
          <ul>
            <li>
              <a href="/privacy">Política de Privacidade</a>
            </li>
            <li>
              <a href="/terms">Termos de Uso</a>
            </li>
            <li>
              <a href="/refund">Política de Reembolso</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>SUPORTE</h3>
          <ul>
            <li>
              <a href="/help">Ajuda</a>
            </li>
            <li>
              <a href="mailto:suporte@kizirianmax.site">Contato</a>
            </li>
            <li>
              <a href="https://github.com/kizirianmax" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>CONFORMIDADE</h3>
          <ul>
            <li>
              <span>✓ GDPR (UE)</span>
            </li>
            <li>
              <span>✓ LGPD (Brasil)</span>
            </li>
            <li>
              <span>✓ Google Play Store</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2025 RKMMAX. Todos os direitos reservados.</p>
        <p className="footer-cnpj">CNPJ: 63.492.481/0001-10</p>
      </div>
    </footer>
  );
}
