// src/hooks/useAgentVisibility.js
import { useState, useEffect } from "react";

const STORAGE_KEY = "rkmmax_agent_visibility";

export function useAgentVisibility() {
  const [visibility, setVisibility] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  }, [visibility]);

  const toggleVisibility = (agentId) => {
    setVisibility((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }));
  };

  const isVisible = (agentId) => {
    return visibility[agentId] !== false; // Default: visible
  };

  const setAllVisible = (visible) => {
    const newVisibility = {};
    // Assumindo que temos uma lista de agentes
    const agentIds = [
      "serginho",
      "didak",
      "code",
      "focus",
      "emo",
      "bizu",
      "orac",
      "planx",
      "criar",
      "finna",
      "legalis",
      "care",
      "talky",
    ];
    agentIds.forEach((id) => {
      newVisibility[id] = visible;
    });
    setVisibility(newVisibility);
  };

  return {
    visibility,
    toggleVisibility,
    isVisible,
    setAllVisible,
  };
}
