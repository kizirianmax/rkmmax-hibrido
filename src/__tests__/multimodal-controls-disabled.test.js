import fs from "fs";
import path from "path";

const repoRoot = path.resolve(process.cwd());

const expectDisabledButtonNearHandler = (source, handlerName) => {
  const onClickToken = `onClick={${handlerName}}`;
  const start = source.indexOf(onClickToken);
  expect(start).toBeGreaterThanOrEqual(0);
  const neighborhood = source.slice(start, start + 220);
  expect(neighborhood).toContain("disabled={true}");
  return neighborhood;
};

describe("UI multimodal indisponível nas interfaces ativas", () => {
  test("HybridAgentSimple mantém voz/imagem desativados sem chamadas diretas de transcrição/visão", () => {
    const hybridSource = fs.readFileSync(path.join(repoRoot, "src/pages/HybridAgentSimple.jsx"), "utf8");

    const micNeighborhood = expectDisabledButtonNearHandler(hybridSource, "handleMicrophoneClick");
    const imageNeighborhood = expectDisabledButtonNearHandler(hybridSource, "handleImageClick");
    expect(micNeighborhood).toContain('title="Voz indisponível temporariamente"');
    expect(imageNeighborhood).toContain('title="Imagem indisponível temporariamente"');
    expect(hybridSource).not.toContain("/api/transcribe");
    expect(hybridSource).not.toContain("/api/vision");
  });

  test("SpecialistChat mantém controle de voz desativado sem chamada direta de transcrição", () => {
    const specialistSource = fs.readFileSync(path.join(repoRoot, "src/pages/SpecialistChat.jsx"), "utf8");

    const voiceNeighborhood = expectDisabledButtonNearHandler(specialistSource, "handleVoiceInput");
    expect(voiceNeighborhood).toContain('title="Voz indisponível temporariamente"');
    expect(specialistSource).not.toContain("/api/transcribe");
  });

  test("Serginho permanece com controles multimodais desativados", () => {
    const serginhoSource = fs.readFileSync(path.join(repoRoot, "src/pages/Serginho.jsx"), "utf8");

    expectDisabledButtonNearHandler(serginhoSource, "handleCameraCapture");
    expectDisabledButtonNearHandler(serginhoSource, "handleImageAttach");
    expectDisabledButtonNearHandler(serginhoSource, "handleVoiceInput");
  });
});
