import fs from "fs";
import path from "path";

const repoRoot = path.resolve(process.cwd());

const expectNoRenderedButtonForHandler = (source, handlerName) => {
  const onClickToken = `onClick={${handlerName}}`;
  expect(source).not.toContain(onClickToken);
};

const expectDisabledButtonNearHandler = (source, handlerName) => {
  const onClickToken = `onClick={${handlerName}}`;
  const start = source.indexOf(onClickToken);
  expect(start).toBeGreaterThanOrEqual(0);
  const neighborhood = source.slice(start, start + 220);
  expect(neighborhood).toContain("disabled={true}");
};

describe("UI multimodal indisponível nas interfaces ativas", () => {
  test("HybridAgentSimple remove controles multimodais da UI e não mantém chamadas diretas de transcrição/visão", () => {
    const hybridSource = fs.readFileSync(path.join(repoRoot, "src/pages/HybridAgentSimple.jsx"), "utf8");

    expectNoRenderedButtonForHandler(hybridSource, "handleMicrophoneClick");
    expectNoRenderedButtonForHandler(hybridSource, "handleImageClick");
    expect(hybridSource).not.toContain("Voz indisponível temporariamente");
    expect(hybridSource).not.toContain("Imagem indisponível temporariamente");
    expect(hybridSource).not.toContain("/api/transcribe");
    expect(hybridSource).not.toContain("/api/vision");

    // Fase 2 — F2-04: remover claims de modo/crédito não implementados
    expect(hybridSource).not.toContain("Manual (1 crédito)");
    expect(hybridSource).not.toContain("Otimizado (0.5 crédito)");
    expect(hybridSource).not.toContain("const [mode, setMode]");
    expect(hybridSource).not.toContain("mode: mode.toUpperCase()");

    // Fluxo principal do Construtor permanece ativo
    expect(hybridSource).toContain("Construção e entrega de artefatos");
    expect(hybridSource).toContain("🔍 Revisar artefato");
    expect(hybridSource).toContain("/api/ai");
    expect(hybridSource).toContain("/api/artifact-preview");
  });

  test("SpecialistChat remove controle de voz da UI e não mantém chamada direta de transcrição", () => {
    const specialistSource = fs.readFileSync(path.join(repoRoot, "src/pages/SpecialistChat.jsx"), "utf8");

    expectNoRenderedButtonForHandler(specialistSource, "handleVoiceInput");
    expect(specialistSource).not.toContain("Voz indisponível temporariamente");
    expect(specialistSource).not.toContain("/api/transcribe");
  });

  test("Serginho permanece com controles multimodais desativados", () => {
    const serginhoSource = fs.readFileSync(path.join(repoRoot, "src/pages/Serginho.jsx"), "utf8");

    expectDisabledButtonNearHandler(serginhoSource, "handleCameraCapture");
    expectDisabledButtonNearHandler(serginhoSource, "handleImageAttach");
    expectDisabledButtonNearHandler(serginhoSource, "handleVoiceInput");
  });
});
