// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { initSentry } from "./lib/sentry.js";
import { initAnalytics } from "./lib/analytics.js";

import { AuthProvider } from "./auth/AuthProvider.jsx";
import AuthGate from "./auth/AuthGate.jsx";

import Header from "./components/Header.jsx";
import BrandTitle from "./components/BrandTitle.jsx";
import PlanGate from "./components/PlanGate.jsx";
import OwnerGate from "./components/OwnerGate.jsx";
import HybridSystemDashboard from "./components/HybridSystemDashboard.jsx";
import AdvancedDashboard from "./components/AdvancedDashboard.jsx";

import Home from "./pages/Home.jsx";
import Serginho from "./pages/Serginho.jsx";
import AgentsPage from "./pages/Agents.jsx";
import Projects from "./pages/Projects.jsx";
import StudyLab from "./pages/StudyLab.jsx";
import Specialists from "./pages/Specialists.jsx";
import SpecialistChat from "./pages/SpecialistChat.jsx";
import Pricing from "./pages/Pricing.jsx";
import Help from "./pages/Help.jsx";
import Settings from "./pages/Settings.jsx";
import Success from "./pages/Success.jsx";
import Subscription from "./pages/Subscription.jsx";
import Onboarding from "./components/Onboarding.jsx";
import OptionalSignupBanner from "./components/OptionalSignupBanner.jsx";
import ConsentBanner from "./components/ConsentBanner.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import Refund from "./pages/Refund.jsx";
import Regulamento from "./pages/Regulamento.jsx";
import Abnt from "./pages/Abnt.jsx";
import Cronograma from "./pages/Cronograma.jsx";
import Flashcards from "./pages/Flashcards.jsx";
import GeradorResumos from "./pages/GeradorResumos.jsx";
import MapasMentais from "./pages/MapasMentais.jsx";
import SourceProof from "./pages/SourceProof.jsx";
import HybridAgentSimple from "./pages/HybridAgentSimple.jsx";
import GitHubCallback from "./pages/GitHubCallback.jsx";
import Auth from "./pages/Auth.jsx";
import Logout from "./pages/Logout.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Account from "./pages/Account.jsx";
import Info from "./pages/Info.jsx";
import Subscribe from "./pages/Subscribe.jsx";
import PlansScreen from "./pages/PlansScreen.jsx";
import AgentDetail from "./pages/AgentDetail.jsx";
import Chat from "./pages/Chat.jsx";
import Demo from "./pages/Demo.jsx";
import DemoAutoplay from "./pages/DemoAutoplay.jsx";

export default function App() {
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  useEffect(() => {
    // Initialize observability tools
    initSentry();
    initAnalytics();

    // Verificar se deve mostrar onboarding
    const hasCompletedOnboarding = localStorage.getItem("onboarding_completed");
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate>
      <BrandTitle />
      <Header />

      {/* Onboarding para novos usuários */}
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}

      {/* Banner de cadastro opcional */}
      <OptionalSignupBanner />

      {/* Banner de consentimento GDPR/LGPD */}
      <ConsentBanner />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/serginho" element={<Serginho />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/startup" element={<Navigate to="/projects" replace />} />
        <Route path="/study" element={<StudyLab />} />
        <Route path="/specialists" element={<Specialists />} />
        <Route path="/specialist/:specialistId" element={<SpecialistChat />} />
        <Route path="/study-lab" element={<Navigate to="/study" replace />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/demo-autoplay" element={<DemoAutoplay />} />
        <Route path="/showcase" element={<Navigate to="/demo" replace />} />

        {/* Área Premium */}
        <Route
          path="/agents"
          element={
            <PlanGate requirePlan="premium">
              <AgentsPage />
            </PlanGate>
          }
        />

        {/* Planos */}
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/plans" element={<Navigate to="/pricing" replace />} />
        <Route path="/subscribe" element={<Subscribe />} />
        <Route path="/plans-screen" element={<PlansScreen />} />

        {/* Sucesso do Stripe */}
        <Route path="/success" element={<Success />} />

        {/* Help & Status */}
        <Route path="/help" element={<Help />} />
        <Route path="/status" element={<Help />} />
        <Route path="/info" element={<Info />} />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />
        <Route path="/configuracoes" element={<Navigate to="/settings" replace />} />

        {/* Subscription Management */}
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/assinatura" element={<Navigate to="/subscription" replace />} />
        {/* Sistema Híbrido */}
        <Route path="/hybrid" element={<HybridAgentSimple />} />
        <Route path="/agent" element={<HybridAgentSimple />} />
        <Route path="/agent-detail/:id" element={<AgentDetail />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/github-callback" element={<GitHubCallback />} />

        {/* Auth */}
        <Route path="/login" element={<Auth />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/account" element={<Account />} />

        {/* Políticas */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/regulamento" element={<Regulamento />} />
        {/* Formatador ABNT/APA */}
        <Route path="/abnt" element={<Abnt />} />

        {/* Study Lab — Ferramentas */}
        <Route path="/cronograma" element={<Cronograma />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/gerador-resumos" element={<GeradorResumos />} />
        <Route path="/mapas-mentais" element={<MapasMentais />} />
        <Route path="/source-proof" element={<SourceProof />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

        {/* Admin / Owner */}
        <Route
          path="/dashboard"
          element={
            <OwnerGate>
              <HybridSystemDashboard />
            </OwnerGate>
          }
        />
        <Route
          path="/advanced-dashboard"
          element={
            <OwnerGate>
              <AdvancedDashboard />
            </OwnerGate>
          }
        />
      </Routes>
        </AuthGate>
      </AuthProvider>
    </BrowserRouter>
  );
}
