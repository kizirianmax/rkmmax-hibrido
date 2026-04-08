/**
 * HYBRID SYSTEM DASHBOARD
 * Monitoramento em tempo real do sistema de agentes — dados reais do /api/health
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REFRESH_INTERVAL_MS = 30000;

function StatusBadge({ ok, label }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        ok ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
      }`}
    >
      {ok ? "✅" : "❌"} {label}
    </span>
  );
}

export default function HybridSystemDashboard() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      if (!res.ok) {
        throw new Error(`Health endpoint returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setHealth(data);
      setLastFetched(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao Carregar Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOnline = health?.status === "ok";
  const groqOk = health?.providers?.groq === true;
  const models = health?.models || [];
  const primaryProvider = health?.primaryProvider;
  const primaryModel = models.find((m) => m.id === primaryProvider);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🤖 Hybrid System Dashboard</h1>
          <p className="text-gray-400">
            Status real do Sistema Híbrido — atualizado a cada 30 segundos
          </p>
        </div>

        {/* Status Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Estado:</span>
                  <span className={`font-bold ${isOnline ? "text-green-400" : "text-red-400"}`}>
                    {isOnline ? "● Online" : "● Offline"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Serviço:</span>
                  <span className="text-blue-400">{health?.service || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Ambiente:</span>
                  <span className="text-purple-400">{health?.environment || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Versão:</span>
                  <span className="text-gray-300">{health?.version || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Provider */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Provider Configurado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Groq:</span>
                  <span className={`font-bold ${groqOk ? "text-green-400" : "text-red-400"}`}>
                    {groqOk ? "✅ Configurado" : "❌ Não configurado"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuração do Provider Principal */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Modelo Configurado</CardTitle>
            </CardHeader>
            <CardContent>
              {primaryModel ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{primaryModel.icon}</span>
                    <span className="text-white font-bold">{primaryModel.displayName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Modelo:</span>
                    <span className="text-blue-300 text-xs font-mono">{primaryModel.model}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Tier:</span>
                    <span className="text-purple-400">{primaryModel.tier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Infraestrutura:</span>
                    <span className="text-gray-300">{primaryModel.infrastructure}</span>
                  </div>
                </div>
              ) : (
                <p className="text-yellow-400 text-sm">Nenhum provider ativo</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modelos Disponíveis */}
        {models.length > 0 && (
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Modelos Habilitados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {models.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg border ${
                      m.id === primaryProvider
                        ? "border-green-600 bg-green-900/20"
                        : "border-slate-600 bg-slate-700/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-white text-sm font-semibold">{m.displayName}</span>
                      {m.id === primaryProvider && (
                        <span className="ml-auto text-xs text-green-400 font-bold">ATIVO</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono truncate">{m.model}</p>
                    <p className="text-xs text-purple-400 mt-1">tier: {m.tier}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deployment Info */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Informações de Deploy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Commit:</span>
                <span className="text-blue-300 font-mono text-sm">
                  {health?.commit && health.commit !== "unknown"
                    ? health.commit.slice(0, 10)
                    : "não disponível"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Timestamp servidor:</span>
                <span className="text-gray-300 text-sm">
                  {health?.timestamp
                    ? new Date(health.timestamp).toLocaleString("pt-BR")
                    : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          <StatusBadge ok={isOnline} label="Sistema Online" />
          <StatusBadge ok={groqOk} label="Groq API" />
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            Última atualização:{" "}
            {lastFetched ? lastFetched.toLocaleString("pt-BR") : "—"}
            {error && (
              <span className="ml-2 text-yellow-500">(última busca com erro: {error})</span>
            )}
          </p>
          <p className="mt-1">RKMMAX Hybrid System © 2025</p>
        </div>
      </div>
    </div>
  );
}
