// src/pages/AgentSettings.jsx
import React from "react";
import { useAgentVisibility } from "../hooks/useAgentVisibility.jsx";

const agents = [
  { id: "serginho", name: "Serginho", role: "Orquestrador", tier: "Livre" },
  { id: "didak", name: "Didak", role: "Pedagogia", tier: "Premium" },
  { id: "code", name: "Code", role: "Técnico", tier: "Premium" },
  { id: "focus", name: "Focus", role: "Execução", tier: "Premium" },
  { id: "emo", name: "Emo", role: "Emocional", tier: "Premium" },
  { id: "bizu", name: "Bizu", role: "Dicas Rápidas", tier: "Premium" },
  { id: "orac", name: "Orac", role: "Estratégia", tier: "Premium" },
  { id: "planx", name: "PlanX", role: "Planejamento", tier: "Premium" },
  { id: "criar", name: "Criar", role: "Criatividade", tier: "Premium" },
  { id: "finna", name: "Finna", role: "Finanças", tier: "Premium" },
  { id: "legalis", name: "Legalis", role: "Jurídico", tier: "Premium" },
  { id: "care", name: "Care", role: "Saúde", tier: "Premium" },
  { id: "talky", name: "Talky", role: "Comunicação", tier: "Premium" },
];

export default function AgentSettings() {
  const { isVisible, toggleVisibility, setAllVisible } = useAgentVisibility();

  const visibleAgents = agents.filter((a) => isVisible(a.id));
  const hiddenAgents = agents.filter((a) => !isVisible(a.id));

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Configuração de Agentes</h1>
        <p className="text-slate-400 mb-8">
          Controle quais agentes ficam visíveis na interface. O Serginho sempre coordena todos,
          independente da visibilidade.
        </p>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setAllVisible(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Mostrar Todos
          </button>
          <button
            onClick={() => setAllVisible(false)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
          >
            Ocultar Todos
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-green-400">
              Visíveis ({visibleAgents.length})
            </h2>
            <div className="space-y-2">
              {visibleAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isVisible={true}
                  onToggle={() => toggleVisibility(agent.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-500">
              Ocultos ({hiddenAgents.length})
            </h2>
            <div className="space-y-2">
              {hiddenAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isVisible={false}
                  onToggle={() => toggleVisibility(agent.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Como funciona?</h3>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>
              • <strong>Serginho</strong> (orquestrador) sempre coordena todos os especialistas
            </li>
            <li>• Ocultar um agente apenas remove ele da UI, mas ele continua disponível</li>
            <li>• Use isso para simplificar a interface e focar nos agentes que você mais usa</li>
            <li>• Suas preferências são salvas localmente no navegador</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, isVisible, onToggle }) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        isVisible ? "bg-slate-800 border-green-700" : "bg-slate-800/50 border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{agent.name}</div>
          <div className="text-sm text-slate-400">{agent.role}</div>
          <div
            className={`text-xs mt-1 ${
              agent.tier === "Livre" ? "text-green-400" : "text-purple-400"
            }`}
          >
            {agent.tier}
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isVisible ? "bg-green-600 hover:bg-green-700" : "bg-slate-700 hover:bg-slate-600"
          }`}
        >
          {isVisible ? "👁️ Visível" : "🙈 Oculto"}
        </button>
      </div>
    </div>
  );
}
