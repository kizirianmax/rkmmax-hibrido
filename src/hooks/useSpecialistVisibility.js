// src/hooks/useSpecialistVisibility.js
import { useState, useEffect } from "react";
import { specialists } from "../config/specialists.js";

const STORAGE_KEY = "rkmmax_specialist_visibility";

export function useSpecialistVisibility() {
  const [visibility, setVisibility] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  }, [visibility]);

  const toggleVisibility = (specialistId) => {
    setVisibility((prev) => ({
      ...prev,
      [specialistId]: !prev[specialistId],
    }));
  };

  const isVisible = (specialistId) => {
    // Default: visible (true)
    return visibility[specialistId] !== false;
  };

  const setAllVisible = (visible) => {
    const newVisibility = {};
    Object.keys(specialists).forEach((id) => {
      newVisibility[id] = visible;
    });
    setVisibility(newVisibility);
  };

  const setCategoryVisible = (category, visible) => {
    const newVisibility = { ...visibility };
    Object.values(specialists).forEach((specialist) => {
      if (specialist.category === category) {
        newVisibility[specialist.id] = visible;
      }
    });
    setVisibility(newVisibility);
  };

  const getVisibleCount = () => {
    return Object.keys(specialists).filter((id) => isVisible(id)).length;
  };

  const getHiddenCount = () => {
    return Object.keys(specialists).length - getVisibleCount();
  };

  return {
    visibility,
    toggleVisibility,
    isVisible,
    setAllVisible,
    setCategoryVisible,
    getVisibleCount,
    getHiddenCount,
  };
}
