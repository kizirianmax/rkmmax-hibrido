/**
 * AUTOMATION DASHBOARD
 * Interface web para gerenciar automações
 * Mostra: Histórico, Estatísticas, Controles, Configurações
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Send,
  Mic,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function AutomationDashboard() {
  const [command, setCommand] = useState("");
  const [selectedMode, setSelectedMode] = useState("OPTIMIZED");
  const [selectedSpecialist, setSelectedSpecialist] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [automations, setAutomations] = useState([]);
  const [stats, setStats] = useState(null);
  const [specialists, setSpecialists] = useState([]);
  const [userPlan, setUserPlan] = useState("basic");
  const [dailyUsage, setDailyUsage] = useState({
    automations: 0,
    aiRequests: 0,
    totalCredits: 0,
  });
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadSpecialists();
    loadAutomationHistory();
    loadStats();
  }, []);

  /**
   * Carregar lista de especialistas
   */
  const loadSpecialists = async () => {
    try {
      const response = await fetch("/api/automation?action=specialists");
      const data = await response.json();
      setSpecialists(data.specialists || []);
    } catch (error) {
      console.error("Erro ao carregar especialistas:", error);
    }
  };

  /**
   * Carregar histórico de automações
   */
  const loadAutomationHistory = async () => {
    try {
      const response = await fetch(`/api/automation?action=history&userId=user123&limit=10`);
      const data = await response.json();
      setAutomations(data.automations || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  };

  /**
   * Carregar estatísticas
   */
  const loadStats = async () => {
    try {
      const response = await fetch(`/api/automation?action=stats&userId=user123`);
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  /**
   * Executar automação
   */
  const handleExecuteAutomation = async () => {
    if (!command.trim()) {
      alert("Digite um comando");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute",
          userId: "user123",
          username: "User",
          command,
          mode: selectedMode,
          selectedSpecialist: selectedSpecialist || undefined,
          description: command,
          creditsUsed: selectedMode === "OPTIMIZED" ? 5 : selectedMode === "HYBRID" ? 3 : 1,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCommand("");
        setSelectedSpecialist("");
        loadAutomationHistory();
        loadStats();
        alert("✅ Automação executada com sucesso!");
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao executar automação:", error);
      alert("Erro ao executar automação");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Iniciar gravação de áudio
   */
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/mp3" });
        const reader = new FileReader();

        reader.onload = async (e) => {
          const audioBase64 = e.target.result.split(",")[1];

          // Processar áudio
          const response = await fetch("/api/multimodal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "process-audio",
              audio: audioBase64,
              format: "mp3",
            }),
          });

          const data = await response.json();
          if (data.success) {
            setCommand(data.result.transcript);
          }
        };

        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setRecordingAudio(true);

      // Parar após 30 segundos
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach((track) => track.stop());
        setRecordingAudio(false);
      }, 30000);
    } catch (error) {
      console.error("Erro ao gravar áudio:", error);
      alert("Erro ao acessar microfone");
    }
  };

  /**
   * Processar imagem selecionada
   */
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (event) => {
      const imageBase64 = event.target.result.split(",")[1];

      // Processar imagem
      const response = await fetch("/api/multimodal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "detect-code",
          image: imageBase64,
          format: file.type.split("/")[1],
        }),
      });

      const data = await response.json();
      if (data.success && data.result.code) {
        setCommand(data.result.code);
        setSelectedImage(file.name);
      }
    };

    reader.readAsDataURL(file);
  };

  /**
   * Obter cor de status
   */
  const getStatusColor = (status) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "BLOCKED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /**
   * Obter ícone de status
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-4 h-4" />;
      case "FAILED":
        return <AlertCircle className="w-4 h-4" />;
      case "BLOCKED":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🤖 RKMMAX Automação</h1>
          <p className="text-slate-300">Sistema Inteligente de Automação de Repositório</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="execute" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
            <TabsTrigger value="execute" className="text-white">
              Executar
            </TabsTrigger>
            <TabsTrigger value="history" className="text-white">
              Histórico
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-white">
              Estatísticas
            </TabsTrigger>
          </TabsList>

          {/* TAB: Executar Automação */}
          <TabsContent value="execute" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Novo Comando</CardTitle>
                <CardDescription className="text-slate-400">
                  Digite um comando ou use voz/imagem para automatizar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Aviso de limite */}
                {dailyUsage.automations >= 5 && (
                  <Alert className="bg-yellow-900 border-yellow-700">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-200">
                      Você atingiu o limite diário de automações para seu plano.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Input de comando */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Comando</label>
                  <Textarea
                    placeholder="Ex: RKM, cria um componente de login com validação..."
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-24"
                  />
                </div>

                {/* Botões de entrada multimodal */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleStartRecording}
                    disabled={recordingAudio || isLoading}
                    variant="outline"
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    {recordingAudio ? "Gravando..." : "Voz"}
                  </Button>

                  <Button
                    onClick={() => document.getElementById("imageInput")?.click()}
                    disabled={isLoading}
                    variant="outline"
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Imagem
                  </Button>

                  <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {selectedImage && <Badge className="bg-green-600">{selectedImage}</Badge>}
                </div>

                {/* Seleção de modo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Modo</label>
                    <Select value={selectedMode} onValueChange={setSelectedMode}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="MANUAL" className="text-white">
                          Manual (1 crédito)
                        </SelectItem>
                        <SelectItem value="HYBRID" className="text-white">
                          Híbrido (3 créditos)
                        </SelectItem>
                        <SelectItem value="OPTIMIZED" className="text-white">
                          Otimizado (5 créditos)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">
                      Especialista (opcional)
                    </label>
                    <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Automático" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        {specialists.map((spec) => (
                          <SelectItem key={spec.name} value={spec.name} className="text-white">
                            {spec.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Botão de execução */}
                <Button
                  onClick={handleExecuteAutomation}
                  disabled={isLoading || !command.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Executar Automação
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Histórico */}
          <TabsContent value="history" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Histórico de Automações</CardTitle>
                <CardDescription className="text-slate-400">
                  Últimas automações executadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {automations.length === 0 ? (
                  <p className="text-slate-400">Nenhuma automação executada ainda</p>
                ) : (
                  <div className="space-y-3">
                    {automations.map((auto) => (
                      <div
                        key={auto.id}
                        className="p-4 bg-slate-700 rounded-lg border border-slate-600 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-medium">{auto.command}</p>
                            <p className="text-sm text-slate-400">
                              {new Date(auto.timestamp).toLocaleString("pt-BR")}
                            </p>
                          </div>
                          <Badge className={getStatusColor(auto.status)}>
                            {getStatusIcon(auto.status)}
                            <span className="ml-1">{auto.status}</span>
                          </Badge>
                        </div>
                        {auto.selectedSpecialist && (
                          <p className="text-sm text-slate-300">
                            Especialista:{" "}
                            <span className="font-medium">{auto.selectedSpecialist}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Estatísticas */}
          <TabsContent value="stats" className="space-y-4">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Total de Automações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-400">{stats.totalAutomations}</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Taxa de Sucesso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-400">
                      {stats.totalAutomations > 0
                        ? Math.round((stats.successfulAutomations / stats.totalAutomations) * 100)
                        : 0}
                      %
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Automações Bem-Sucedidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-400">
                      {stats.successfulAutomations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Automações Falhadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-400">{stats.failedAutomations}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
