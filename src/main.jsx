import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// 🔐 INICIALIZAR GERENCIADOR DE SEGREDOS
import { initializeSecrets } from "./api/initializeSecrets";
initializeSecrets();

// 🧹 SW kill-switch agora roda no index.html (antes deste bundle).
// Veja o <script> inline em /index.html.

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
