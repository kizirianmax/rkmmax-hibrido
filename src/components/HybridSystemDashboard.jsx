/**
 * HYBRID SYSTEM DASHBOARD
 * Monitoramento em tempo real do sistema de agentes
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function HybridSystemDashboard() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simular carregamento de estatísticas
    const loadStats = async () => {
      try {
        // Em produção, isso viria de uma API real
        const mockStats = {
          serginho: {
            uptime: Math.floor(Math.random() * 86400000),
            mode: "AUTONOMOUS",
            requestsProcessed: Math.floor(Math.random() * 1000),
          },
          registry: {
            totalSpecialists: 55,
            loadedSpecialists: Math.floor(Math.random() * 20) + 1,
            memoryUsage: (Math.random() * 40).toFixed(2) + " MB",
          },
          cache: {
            hits: Math.floor(Math.random() * 500),
            misses: Math.floor(Math.random() * 200),
            hitRate: (Math.random() * 100).toFixed(2) + "%",
            estimatedSavings: "$" + Math.floor(Math.random() * 5000),
          },
          security: {
            blockedPrompts: Math.floor(Math.random() * 50),
            redactedInstances: Math.floor(Math.random() * 100),
            modelArmorStatus: "ACTIVE",
          },
          performance: {
            avgResponseTime: Math.floor(Math.random() * 100) + "ms",
            p95ResponseTime: Math.floor(Math.random() * 200) + "ms",
            p99ResponseTime: Math.floor(Math.random() * 300) + "ms",
          },
        };

        setStats(mockStats);

        // Adicionar ao histórico
        setHistory((prev) =>
          [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString(),
              hitRate: parseFloat(mockStats.cache.hitRate),
              responseTime: parseInt(mockStats.performance.avgResponseTime),
              loadedSpecialists: mockStats.registry.loadedSpecialists,
            },
          ].slice(-20)
        ); // Manter últimos 20

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadStats();

    // Atualizar a cada 5 segundos
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

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

  if (error) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🤖 Hybrid System Dashboard</h1>
          <p className="text-gray-400">
            Monitoramento em tempo real do Sistema Híbrido Inteligente
          </p>
        </div>

        {/* Status Principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Serginho Status */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Serginho Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Modo:</span>
                  <span className="text-green-400 font-bold">{stats?.serginho.mode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Uptime:</span>
                  <span className="text-blue-400">
                    {(stats?.serginho.uptime / 3600000).toFixed(2)}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Requisições:</span>
                  <span className="text-purple-400">{stats?.serginho.requestsProcessed}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registry Status */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Registry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-blue-400 font-bold">
                    {stats?.registry.totalSpecialists}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Carregados:</span>
                  <span className="text-green-400">{stats?.registry.loadedSpecialists}/20</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Memória:</span>
                  <span className="text-yellow-400">{stats?.registry.memoryUsage}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cache Status */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Cache Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Hit Rate:</span>
                  <span className="text-green-400 font-bold">{stats?.cache.hitRate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Hits/Misses:</span>
                  <span className="text-blue-400">
                    {stats?.cache.hits}/{stats?.cache.misses}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Economia:</span>
                  <span className="text-purple-400">{stats?.cache.estimatedSavings}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Security</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Model Armor:</span>
                  <span className="text-green-400 font-bold">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Bloqueados:</span>
                  <span className="text-red-400">{stats?.security.blockedPrompts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Redacionados:</span>
                  <span className="text-yellow-400">{stats?.security.redactedInstances}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Response Time Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Response Time Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="timestamp" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #404040" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#3b82f6"
                      dot={false}
                      name="Avg Response Time (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">Carregando dados...</p>
              )}
            </CardContent>
          </Card>

          {/* Cache Hit Rate Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Cache Hit Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                    <XAxis dataKey="timestamp" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #404040" }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="hitRate"
                      stroke="#10b981"
                      dot={false}
                      name="Hit Rate (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">Carregando dados...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">
                {stats?.performance.avgResponseTime}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">P95 Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-400">
                {stats?.performance.p95ResponseTime}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">P99 Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-400">
                {stats?.performance.p99ResponseTime}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Health Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">CPU Usage</span>
                    <span className="text-green-400">35%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{ width: "35%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Memory Usage</span>
                    <span className="text-yellow-400">70%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: "70%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Disk Usage</span>
                    <span className="text-blue-400">45%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{ width: "45%" }}></div>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mt-6">
                <div className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm">
                  ✅ All Systems Operational
                </div>
                <div className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-sm">
                  🔒 Security: Active
                </div>
                <div className="px-3 py-1 bg-purple-900 text-purple-300 rounded-full text-sm">
                  ⚡ Performance: Optimal
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p>RKMMAX Hybrid System © 2025</p>
        </div>
      </div>
    </div>
  );
}
