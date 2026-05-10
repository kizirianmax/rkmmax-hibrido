import fs from "fs";
import path from "path";

const repoRoot = path.resolve(process.cwd());

describe("DemoAutoplay route and content (static checks)", () => {
  test("App registers /demo-autoplay route and renders DemoAutoplay", () => {
    const appSource = fs.readFileSync(path.join(repoRoot, "src/App.jsx"), "utf8");

    expect(appSource).toContain('import DemoAutoplay from "./pages/DemoAutoplay.jsx";');
    expect(appSource).toContain('<Route path="/demo-autoplay" element={<DemoAutoplay />} />');
  });

  test("AuthGate exposes /demo-autoplay as a public route", () => {
    const authGateSource = fs.readFileSync(path.join(repoRoot, "src/auth/AuthGate.jsx"), "utf8");

    expect(authGateSource).toContain('"/demo-autoplay"');
  });

  test("DemoAutoplay reuses demoArtifacts data source with 5 artifact titles", () => {
    const demoAutoplaySource = fs.readFileSync(
      path.join(repoRoot, "src/pages/DemoAutoplay.jsx"),
      "utf8",
    );
    const artifactsSource = fs.readFileSync(
      path.join(repoRoot, "src/data/demoArtifacts.js"),
      "utf8",
    );

    const expectedArtifacts = [
      "Landing Page de Conversão",
      "Dashboard Operacional Essencial",
      "Formulário de Cadastro Inteligente",
      "Página SaaS de Produto",
      "Mini App de Simulação",
    ];

    expect(demoAutoplaySource).toContain(
      'import { demoArtifacts } from "../data/demoArtifacts.js";',
    );
    expect(demoAutoplaySource).toContain("demoArtifacts.map((artifact)");

    expectedArtifacts.forEach((artifactName) => {
      expect(artifactsSource).toContain(artifactName);
    });
  });

  test("DemoAutoplay includes mandatory messaging and controls", () => {
    const demoAutoplaySource = fs.readFileSync(
      path.join(repoRoot, "src/pages/DemoAutoplay.jsx"),
      "utf8",
    );

    expect(demoAutoplaySource).toContain("Demonstração do Construtor / Serginho IA");
    expect(demoAutoplaySource).toContain("Por que isso não é apenas um chat?");
    expect(demoAutoplaySource).toContain("Como avaliar em 5 minutos");
    expect(demoAutoplaySource).toContain("/demo");

    expect(demoAutoplaySource).toContain("Automático");
    expect(demoAutoplaySource).toContain("Manual");
    expect(demoAutoplaySource).toContain("Próximo");
    expect(demoAutoplaySource).toContain("Anterior");
    expect(demoAutoplaySource).toContain("Reiniciar demo");
    expect(demoAutoplaySource).toContain("Pausar");
    expect(demoAutoplaySource).toContain("Continuar");

    expect(demoAutoplaySource).toContain("P3 continua pendente");
  });
});
