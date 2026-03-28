// src/components/Onboarding.jsx
import React, { useState, useEffect } from "react";
import "./Onboarding.css";

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se já completou o onboarding
    const hasCompletedOnboarding = localStorage.getItem("onboarding_completed");
    if (!hasCompletedOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const steps = [
    {
      title: "Bem-vindo ao RKMMAX! 🎉",
      description: "Sua plataforma completa de IA com 47 especialistas e assistente pessoal.",
      icon: "🚀",
      image: null,
      action: "Começar Tour",
    },
    {
      title: "Conheça o Serginho 💬",
      description: "Seu orquestrador de IA, disponível 24/7 para ajudar com qualquer coisa.",
      icon: "🤖",
      features: [
        "Responde perguntas instantaneamente",
        "Cria conteúdo e textos",
        "Resolve problemas complexos",
        "Conversa naturalmente em português",
      ],
      action: "Próximo",
    },
    {
      title: "47 Especialistas em IA 🎯",
      description: "Acesso a agentes especializados para qualquer tarefa específica.",
      icon: "👥",
      features: [
        "Especialistas em programação",
        "Criadores de conteúdo",
        "Analistas de dados",
        "E muito mais!",
      ],
      action: "Próximo",
    },
    {
      title: "Study Lab Premium 📚",
      description: "Ferramentas acadêmicas profissionais para estudantes e pesquisadores.",
      icon: "📖",
      features: [
        "Formatação ABNT/APA automática",
        "Cronogramas de estudo",
        "Fontes verificadas",
        "Suporte acadêmico completo",
      ],
      action: "Próximo",
    },
    {
      title: "Pronto para Começar! ✨",
      description: "Você está pronto para explorar tudo que o RKMMAX tem a oferecer.",
      icon: "🎊",
      features: [
        "Chat com Serginho",
        "Explorar Especialistas",
        "Acessar Study Lab",
        "Configurar Preferências",
      ],
      action: "Começar Agora",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  };

  if (!isVisible) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        {/* Progress Indicator */}
        <div className="onboarding-progress">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index === currentStep ? "active" : ""} ${index < currentStep ? "completed" : ""}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="onboarding-content">
          <div className="onboarding-icon">{step.icon}</div>

          <h2 className="onboarding-title">{step.title}</h2>

          <p className="onboarding-description">{step.description}</p>

          {step.features && (
            <ul className="onboarding-features">
              {step.features.map((feature, index) => (
                <li key={index}>
                  <span className="feature-check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="onboarding-actions">
          {currentStep < steps.length - 1 && (
            <button onClick={handleSkip} className="btn-skip">
              Pular Tour
            </button>
          )}

          <button onClick={handleNext} className="btn-next">
            {step.action}
          </button>
        </div>

        {/* Step Counter */}
        <div className="step-counter">
          {currentStep + 1} de {steps.length}
        </div>
      </div>
    </div>
  );
}
