// src/components/AgentsList.jsx
import React from "react";
import { AGENTS } from "../data/agents.js";
import "./AgentsList.css"; // vamos criar depois

export default function AgentsList() {
  return (
    <main className="container">
      <h1 className="pageTitle">Lista de Agentes</h1>

      <ul className="grid">
        {AGENTS.map((a) => {
          const avatar = `${process.env.PUBLIC_URL}${a.avatar_url}`;
          return (
            <li key={a.id} className="card">
              <img className="avatar" src={avatar} alt={`Avatar de ${a.name}`} />
              <div className="info">
                <div className="nameRow">
                  <h3 className="name">
                    {a.name} {a.principal && <span className="pill">PRINCIPAL</span>}
                  </h3>
                  <span className="role">{a.role}</span>
                </div>

                <p className="desc">{a.description}</p>

                <a className="chatLink" href="/app" aria-label={`Chat com ${a.name}`}>
                  💬 Chat no app
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
