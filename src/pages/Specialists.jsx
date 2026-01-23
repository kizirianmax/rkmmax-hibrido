import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSpecialistVisibility } from "../hooks/useSpecialistVisibility.js";
import {
  specialists,
  categories,
  getSpecialistsByCategory,
  getTotalSpecialists,
} from "../config/specialists";
import { canUseSpecialist } from "../config/fairUse";

function Specialists() {
  const navigate = useNavigate();
  const { isVisible, getVisibleCount, getHiddenCount } = useSpecialistVisibility();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock: usuário atual (substituir por contexto real)
  const userPlan = "premium"; // ou 'basic', 'intermediate', 'free'

  // Filtrar especialistas
  const filteredSpecialists = Object.values(specialists).filter((specialist) => {
    const matchesCategory = selectedCategory === "all" || specialist.category === selectedCategory;
    const matchesSearch =
      specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialist.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = isVisible(specialist.id);
    return matchesCategory && matchesSearch && matchesVisibility;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            {getTotalSpecialists()}+ Especialistas
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Serginho orquestra todos os especialistas para resolver qualquer desafio. Escolha um
            especialista ou deixe o Serginho decidir automaticamente.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Buscar especialista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-lg"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              ✨ Todos
            </button>
            {Object.values(categories).map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedCategory === category.id
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {category.emoji} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Specialists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecialists.map((specialist) => {
            const isAvailable = canUseSpecialist(userPlan, specialist.id);

            return (
              <div
                key={specialist.id}
                onClick={() => isAvailable && navigate(`/specialist/${specialist.id}`)}
                className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all ${
                  !isAvailable ? "opacity-50" : "hover:-translate-y-1 cursor-pointer"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <img
                    src={`${specialist.avatar || `/avatars/${specialist.id}.png`}?v=2`}
                    alt={specialist.name}
                    className="w-10 h-10 rounded-xl object-cover shadow-md"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextSibling.style.display = "block";
                    }}
                  />
                  <div className="text-4xl" style={{ display: "none" }}>
                    {specialist.emoji}
                  </div>
                  {!isAvailable && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full">
                      Premium
                    </span>
                  )}
                </div>

                <h3
                  className="text-2xl font-extrabold text-gray-900 mb-2"
                  style={{ fontSize: "1.5rem", fontWeight: 900 }}
                >
                  {specialist.name}
                </h3>

                <p className="text-gray-700 mb-4" style={{ fontSize: "0.95rem", color: "#374151" }}>
                  {specialist.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {categories[specialist.category]?.emoji} {categories[specialist.category]?.name}
                  </span>

                  <button
                    disabled={!isAvailable}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAvailable) navigate(`/specialist/${specialist.id}`);
                    }}
                    className={`px-8 py-3 rounded-xl font-bold text-base transition-all transform shadow-md ${
                      isAvailable
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:scale-105"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isAvailable ? "💬 Conversar" : "🔒 Bloqueado"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredSpecialists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">
              Nenhum especialista encontrado. Tente outra busca!
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Não sabe qual especialista escolher?</h2>
          <p className="text-xl mb-8 opacity-90">
            Deixe o Serginho analisar sua tarefa e escolher automaticamente!
          </p>
          <button
            onClick={() => navigate("/serginho")}
            className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
          >
            Falar com o Serginho 🤖
          </button>
        </div>
      </div>
    </div>
  );
}

export default Specialists;
