import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { demoArtifacts } from "../data/demoArtifacts.js";
import "./DemoAutoplay.css";

const DEFAULT_STEP_DURATION_MS = 7400;
const STEP_DURATIONS_MS = {
  opening: 8200,
  "public-showcase": 7600,
  "artifacts-overview": 8000,
  "artifact-landing": 7000,
  "artifact-dashboard": 7000,
  "artifact-signup": 7000,
  "artifact-saas": 7000,
  "artifact-miniapp": 7000,
  "why-not-chat": 8200,
  "how-to-evaluate": 8200,
  "preview-structure": 7800,
  closing: 8600,
};

export default function DemoAutoplay() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const steps = useMemo(() => {
    const artifactOverview = {
      id: "artifacts-overview",
      title: "Visão geral dos 5 artefatos demonstráveis do Serginho IA",
      description:
        "A vitrine pública apresenta 5 entregas estruturadas para avaliação rápida, sem geração ao vivo.",
      bullets: demoArtifacts.map((artifact) => `${artifact.name} — ${artifact.problemSolved}`),
    };

    const artifactSteps = demoArtifacts.map((artifact) => ({
      id: `artifact-${artifact.id}`,
      title: artifact.name,
      description: artifact.description,
      artifact,
      bullets: [
        `Categoria: ${artifact.category}`,
        `Problema resolvido: ${artifact.problemSolved}`,
        `Pipeline: geração, validação, preview, revisão e empacotamento`,
      ],
    }));

    return [
      {
        id: "opening",
        title: "Serginho IA — Construtor de artefatos digitais",
        description:
          "Apresentação pública guiada para gravação e avaliação técnica rápida, mesmo sem áudio.",
        bullets: [
          "Nome principal para público e avaliadores: Serginho IA.",
          "Demonstração do Construtor/Híbrido com narrativa visual curta.",
        ],
      },
      {
        id: "public-showcase",
        title: "Vitrine pública estática do Serginho IA",
        description:
          "Esta página é estática e demonstrativa: não usa backend, não chama IA e não consome créditos.",
        bullets: [
          "Sem login e sem dados reais de produção.",
          "Somente fluxo visual para análise segura do avaliador.",
        ],
      },
      artifactOverview,
      ...artifactSteps,
      {
        id: "why-not-chat",
        title: "Por que isso não é apenas um chat?",
        description:
          "O Construtor/Híbrido entrega artefatos digitais estruturados, com lógica de validação e revisão.",
        bullets: [
          "Não é apenas conversa: existe entrega técnica verificável.",
          "Há pipeline com geração, validação, preview e empacotamento.",
          "A avaliação pode ser feita sem risco operacional e sem dados reais.",
        ],
      },
      {
        id: "how-to-evaluate",
        title: "Como avaliar em 5 minutos",
        description: "Roteiro objetivo para avaliadores e especialistas externos.",
        orderedBullets: [
          "Veja o panorama dos 5 artefatos demonstráveis.",
          "Navegue pelos destaques individuais e problema resolvido.",
          "Observe status, qualidade e estrutura resumida.",
          "Valide que tudo é estático e seguro para demonstração.",
          "Finalize pela vitrine pública completa em /demo.",
        ],
      },
      {
        id: "preview-structure",
        title: "Preview / estrutura resumida",
        description:
          "Cada entrega demonstra geração, validação, preview, revisão e empacotamento de forma clara e auditável.",
        bullets: demoArtifacts.flatMap((artifact) => [
          `${artifact.name}: ${artifact.technologies[0]}`,
        ]),
      },
      {
        id: "closing",
        title: "Fechamento da apresentação",
        description:
          "Para análise completa, acesse /demo. Esta experiência prepara o P3, mas não conclui o P3.",
        bullets: [
          "Exemplos demonstrativos (não são dados reais de produção).",
          "Não há geração ao vivo nesta página.",
          "P3 continua pendente até vídeo gravado, publicado e linkado.",
        ],
      },
    ];
  }, []);

  const totalSteps = steps.length;
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;
  const autoplayDurationSeconds = Math.round(
    steps.reduce(
      (totalDuration, step) =>
        totalDuration + (STEP_DURATIONS_MS[step.id] ?? DEFAULT_STEP_DURATION_MS),
      0,
    ) / 1000,
  );
  const currentStep = steps[currentStepIndex];
  const currentStepDurationMs = STEP_DURATIONS_MS[currentStep.id] ?? DEFAULT_STEP_DURATION_MS;

  useEffect(() => {
    if (!isAutoMode || isPaused) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrentStepIndex((previousIndex) =>
        previousIndex + 1 >= totalSteps ? 0 : previousIndex + 1,
      );
    }, currentStepDurationMs);

    return () => window.clearTimeout(timer);
  }, [currentStepDurationMs, currentStepIndex, isAutoMode, isPaused, totalSteps]);

  const goToNextStep = () => {
    setCurrentStepIndex((previousIndex) =>
      previousIndex + 1 >= totalSteps ? 0 : previousIndex + 1,
    );
  };

  const goToPreviousStep = () => {
    setCurrentStepIndex((previousIndex) =>
      previousIndex - 1 < 0 ? totalSteps - 1 : previousIndex - 1,
    );
  };

  const restartDemo = () => {
    setCurrentStepIndex(0);
    if (isAutoMode) {
      setIsPaused(false);
    }
  };

  const activateAutoMode = () => {
    setIsAutoMode(true);
    setIsPaused(false);
  };

  const activateManualMode = () => {
    setIsAutoMode(false);
    setIsPaused(true);
  };

  const togglePause = () => {
    if (!isAutoMode) {
      return;
    }

    setIsPaused((previousPaused) => !previousPaused);
  };

  return (
    <main className="demo-autoplay-page" aria-live="polite">
      <section className="demo-autoplay-page__hero">
        <p className="demo-autoplay-page__eyebrow">Roteiro para gravação e avaliação</p>
        <h1 className="demo-autoplay-page__title">Serginho IA — demo guiada do Construtor</h1>
        <p className="demo-autoplay-page__subtitle">
          Apresentação pública estática com foco em clareza, segurança e valor técnico do
          Construtor/Híbrido do Serginho IA.
        </p>
        <p className="demo-autoplay-page__notice">
          Exemplos demonstrativos. Não são dados reais de produção. Não há geração ao vivo nesta
          página.
        </p>
      </section>

      <section className="demo-autoplay-page__status" aria-label="Progresso da apresentação">
        <div className="demo-autoplay-page__status-row">
          <strong>
            Etapa {currentStepIndex + 1} / {totalSteps}
          </strong>
          <span>{isAutoMode ? "Modo Automático / Gravação" : "Modo Manual / Avaliador"}</span>
        </div>
        <div className="demo-autoplay-page__progress-bar" role="progressbar" aria-label="Progresso das etapas da demonstração" aria-valuemin={0} aria-valuemax={totalSteps} aria-valuenow={currentStepIndex + 1}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="demo-autoplay-page__duration">
          Ritmo automático estimado: ~{autoplayDurationSeconds}s totais
        </p>
      </section>

      <section className="demo-autoplay-page__slide" key={currentStep.id}>
        <h2>{currentStep.title}</h2>
        <p>{currentStep.description}</p>

        {Array.isArray(currentStep.bullets) && (
          <ul>
            {currentStep.bullets.map((bullet, index) => (
              <li key={`${currentStep.id}-bullet-${index}-${bullet}`}>{bullet}</li>
            ))}
          </ul>
        )}

        {Array.isArray(currentStep.orderedBullets) && (
          <ol>
            {currentStep.orderedBullets.map((bullet, index) => (
              <li key={`${currentStep.id}-ordered-${index}-${bullet}`}>{bullet}</li>
            ))}
          </ol>
        )}

        {currentStep.artifact && (
          <article className="demo-autoplay-page__artifact-card" aria-label={`Destaque do artefato ${currentStep.artifact.name}`}>
            <header>
              <span>{currentStep.artifact.category}</span>
              <span>{currentStep.artifact.status}</span>
            </header>
            <p className="demo-autoplay-page__artifact-score">{currentStep.artifact.qualityScore}</p>
            <p>
              <strong>Estrutura sugerida:</strong> {currentStep.artifact.technologies.join(" • ")}
            </p>
          </article>
        )}
      </section>

      <section className="demo-autoplay-page__controls" aria-label="Controles da demonstração">
        <div className="demo-autoplay-page__control-group" role="group" aria-label="Modo de apresentação">
          <button
            type="button"
            aria-label="Ativar modo automático"
            className={isAutoMode ? "is-active" : ""}
            onClick={activateAutoMode}
          >
            Automático
          </button>
          <button
            type="button"
            aria-label="Ativar modo manual"
            className={!isAutoMode ? "is-active" : ""}
            onClick={activateManualMode}
          >
            Manual
          </button>
        </div>

        <div className="demo-autoplay-page__control-group" role="group" aria-label="Navegação da apresentação">
          <button type="button" aria-label="Etapa anterior" onClick={goToPreviousStep}>
            Anterior
          </button>
          <button
            type="button"
            aria-label={isPaused ? "Continuar apresentação automática" : "Pausar apresentação automática"}
            onClick={togglePause}
            disabled={!isAutoMode}
          >
            {isPaused ? "Continuar" : "Pausar"}
          </button>
          <button type="button" aria-label="Próxima etapa" onClick={goToNextStep}>
            Próximo
          </button>
          <button type="button" aria-label="Reiniciar demonstração" onClick={restartDemo}>
            Reiniciar demo
          </button>
        </div>
      </section>

      <footer className="demo-autoplay-page__footer">
        <p>
          Avaliação completa da vitrine pública em <Link to="/demo">/demo</Link>.
        </p>
        <p>
          P3 continua pendente até vídeo gravado, publicado e linkado em README.md / docs/DEMO.md.
        </p>
      </footer>
    </main>
  );
}
