import React, { useState, useEffect } from "react";
import "./ConsentBanner.css";

export default function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem("gdpr_consent");
    if (!hasConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("gdpr_consent", "accepted");
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem("gdpr_consent", "rejected");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="consent-banner">
      <div className="consent-content">
        <h2>🛡️ Blindagem de Conformidade Global</h2>
        <p>
          Nós respeitamos sua privacidade. Este site está em conformidade com{" "}
          <strong>GDPR (UE)</strong>, <strong>LGPD (Brasil)</strong> e{" "}
          <strong>Google Play Store</strong>.
        </p>
        <p>
          Para continuar usando RKMMAX, você precisa aceitar nossa{" "}
          <a href="/privacy">Política de Privacidade</a> e <a href="/terms">Termos de Uso</a>.
        </p>
        <div className="consent-buttons">
          <button className="consent-btn accept" onClick={handleAccept}>
            ✓ Aceitar e Continuar
          </button>
          <button className="consent-btn reject" onClick={handleReject}>
            ✗ Rejeitar
          </button>
        </div>
      </div>
    </div>
  );
}
