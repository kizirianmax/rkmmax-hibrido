import fs from "fs";
import path from "path";

const repoRoot = path.resolve(process.cwd());

describe("UI multimodal indisponível nas interfaces ativas", () => {
  test("HybridAgentSimple mantém voz/imagem desativados sem chamadas diretas de transcrição/visão", () => {
    const hybridSource = fs.readFileSync(path.join(repoRoot, "src/pages/HybridAgentSimple.jsx"), "utf8");

    expect(hybridSource).toMatch(/onClick=\{handleMicrophoneClick\}[\s\S]*disabled=\{true\}/);
    expect(hybridSource).toMatch(/onClick=\{handleImageClick\}[\s\S]*disabled=\{true\}/);
    expect(hybridSource).not.toContain("/api/transcribe");
    expect(hybridSource).not.toContain("/api/vision");
  });

  test("SpecialistChat mantém controle de voz desativado sem chamada direta de transcrição", () => {
    const specialistSource = fs.readFileSync(path.join(repoRoot, "src/pages/SpecialistChat.jsx"), "utf8");

    expect(specialistSource).toMatch(/onClick=\{handleVoiceInput\}[\s\S]*disabled=\{true\}/);
    expect(specialistSource).not.toContain("/api/transcribe");
  });

  test("Serginho permanece com controles multimodais desativados", () => {
    const serginhoSource = fs.readFileSync(path.join(repoRoot, "src/pages/Serginho.jsx"), "utf8");

    expect(serginhoSource).toMatch(/onClick=\{handleCameraCapture\}[\s\S]*disabled=\{true\}/);
    expect(serginhoSource).toMatch(/onClick=\{handleImageAttach\}[\s\S]*disabled=\{true\}/);
    expect(serginhoSource).toMatch(/onClick=\{handleVoiceInput\}[\s\S]*disabled=\{true\}/);
  });
});
