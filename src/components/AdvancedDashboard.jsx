/**
 * ADVANCED DASHBOARD
 *
 * Dashboard avançado com:
 * - Visualizações em tempo real
 * - Métricas de performance
 * - Análise de agentes
 * - Monitoramento de APIs
 * - Alertas e notificações
 */

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AdvancedDashboard() {
  const [metrics, setMetrics] = useState({
    agents: { total: 55, active: 48, idle: 7 },
    cache: { hitRate: 0.75, size: 2048, maxSize: 5000 },
    apis: {
      openai: { calls: 1250, cost: 12.5, status: "active" },
      anthropic: { calls: 850, cost: 8.5, status: "active" },
      google: { calls: 450, cost: 0.45, status: "active" },
      groq: { calls: 2100, cost: 0.21, status: "active" },
    },
    performance: {
      avgResponseTime: 450,
      p95ResponseTime: 1200,
      errorRate: 0.02,
      uptime: 99.95,
    },
    alerts: {
      critical: 0,
      warning: 2,
      info: 15,
    },
  });

  const [timeRange, setTimeRange] = useState("24h");
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Dados de exemplo para gráficos
  const responseTimeData = [
    { time: "00:00", value: 420 },
    { time: "04:00", value: 480 },
    { time: "08:00", value: 450 },
    { time: "12:00", value: 520 },
    { time: "16:00", value: 480 },
    { time: "20:00", value: 440 },
    { time: "23:59", value: 450 },
  ];

  const apiCallsData = [
    { name: "OpenAI", calls: 1250, cost: 12.5 },
    { name: "Anthropic", calls: 850, cost: 8.5 },
    { name: "Google", calls: 450, cost: 0.45 },
    { name: "Groq", calls: 2100, cost: 0.21 },
  ];

  const agentDistribution = [
    { name: "Educação", value: 5 },
    { name: "Tecnologia", value: 12 },
    { name: "Dados", value: 8 },
    { name: "Negócios", value: 6 },
    { name: "Design", value: 4 },
    { name: "Outros", value: 20 },
  ];

  const cachePerformance = [
    { time: "00:00", hitRate: 0.68 },
    { time: "04:00", hitRate: 0.72 },
    { time: "08:00", hitRate: 0.75 },
    { time: "12:00", hitRate: 0.78 },
    { time: "16:00", hitRate: 0.76 },
    { time: "20:00", hitRate: 0.74 },
    { time: "23:59", hitRate: 0.75 },
  ];

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🎯 Advanced Dashboard</h1>
            <p className="text-slate-400">
              Sistema Híbrido Inteligente - Monitoramento em Tempo Real
            </p>
          </div>
          <div className="flex gap-2">
            {["24h", "7d", "30d"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Agentes */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 font-medium">Agentes Ativos</h3>
              <span className="text-2xl">🤖</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {metrics.agents.active}/{metrics.agents.total}
            </div>
            <div className="text-sm text-green-400">
              ↑ {((metrics.agents.active / metrics.agents.total) * 100).toFixed(1)}% operacional
            </div>
          </div>

          {/* Cache */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 font-medium">Cache Hit Rate</h3>
              <span className="text-2xl">💾</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {(metrics.cache.hitRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-blue-400">
              {metrics.cache.size}/{metrics.cache.maxSize} MB
            </div>
          </div>

          {/* Performance */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 font-medium">Avg Response</h3>
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {metrics.performance.avgResponseTime}ms
            </div>
            <div className="text-sm text-green-400">
              P95: {metrics.performance.p95ResponseTime}ms
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 font-medium">Uptime</h3>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">{metrics.performance.uptime}%</div>
            <div className="text-sm text-green-400">
              Error Rate: {(metrics.performance.errorRate * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Response Time */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white font-bold mb-4">Response Time (ms)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cache Performance */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white font-bold mb-4">Cache Hit Rate</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cachePerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 1]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  labelStyle={{ color: "#f1f5f9" }}
                  formatter={(value) => `${(value * 100).toFixed(1)}%`}
                />
                <Line
                  type="monotone"
                  dataKey="hitRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* API Calls */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white font-bold mb-4">API Calls by Provider</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={apiCallsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
                <Bar dataKey="calls" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Agent Distribution */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white font-bold mb-4">Agent Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {agentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
          <h3 className="text-white font-bold mb-4">🚨 Alertas Recentes</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="text-red-400 font-bold text-2xl">{metrics.alerts.critical}</div>
              <div className="text-red-300 text-sm">Critical</div>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <div className="text-yellow-400 font-bold text-2xl">{metrics.alerts.warning}</div>
              <div className="text-yellow-300 text-sm">Warning</div>
            </div>
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="text-blue-400 font-bold text-2xl">{metrics.alerts.info}</div>
              <div className="text-blue-300 text-sm">Info</div>
            </div>
          </div>
        </div>

        {/* API Costs */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-white font-bold mb-4">💰 Custos de API</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(metrics.apis).map(([provider, data]) => (
              <div key={provider} className="bg-slate-700 rounded-lg p-4">
                <div className="text-slate-300 font-medium capitalize mb-2">{provider}</div>
                <div className="text-white font-bold text-lg mb-1">${data.cost.toFixed(2)}</div>
                <div className="text-slate-400 text-sm">{data.calls} chamadas</div>
                <div
                  className={`text-xs mt-2 ${data.status === "active" ? "text-green-400" : "text-red-400"}`}
                >
                  {data.status === "active" ? "✓ Ativo" : "✗ Inativo"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
