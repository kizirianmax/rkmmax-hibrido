import fs from "fs";
import path from "path";

const repoRoot = path.resolve(process.cwd());

describe("Demo showcase integration (static checks)", () => {
  test("App routes include /demo and /showcase redirect", () => {
    const appSource = fs.readFileSync(path.join(repoRoot, "src/App.jsx"), "utf8");

    expect(appSource).toContain('import Demo from "./pages/Demo.jsx";');
    expect(appSource).toContain('<Route path="/demo" element={<Demo />} />');
    expect(appSource).toContain('<Route path="/showcase" element={<Navigate to="/demo" replace />} />');
  });

  test("AuthGate exposes /demo and /showcase as public routes", () => {
    const authGateSource = fs.readFileSync(path.join(repoRoot, "src/auth/AuthGate.jsx"), "utf8");

    expect(authGateSource).toContain('"/demo"');
    expect(authGateSource).toContain('"/showcase"');
  });

  test("Demo page includes the required 5 mocked artifacts", () => {
    const artifactsSource = fs.readFileSync(path.join(repoRoot, "src/data/demoArtifacts.js"), "utf8");

    const expectedArtifacts = [
      "Landing Page de Conversão",
      "Dashboard Operacional Essencial",
      "Formulário de Cadastro Inteligente",
      "Página SaaS de Produto",
      "Mini App de Simulação",
    ];

    expectedArtifacts.forEach((artifactName) => {
      expect(artifactsSource).toContain(artifactName);
    });
  });

  test("Demo page includes mandatory evaluator sections and CTA", () => {
    const demoSource = fs.readFileSync(path.join(repoRoot, "src/pages/Demo.jsx"), "utf8");

    expect(demoSource).toContain("Demonstração do Construtor / Serginho IA");
    expect(demoSource).toContain("Por que isso não é apenas um chat?");
    expect(demoSource).toContain("Como avaliar em 5 minutos");
    expect(demoSource).toContain("https://kizirianmax.site/startup");
    expect(demoSource).toContain("O Construtor entrega artefatos digitais estruturados");
    expect(demoSource).toContain("Compare os 5 tipos de artefatos");
    expect(demoSource).toContain('to="/demo-autoplay"');
    expect(demoSource).toContain("Assistir apresentação automática / modo avaliador");
  });

  test("Startup page includes highlighted CTA to /demo-autoplay", () => {
    const startupSource = fs.readFileSync(path.join(repoRoot, "src/pages/Projects.jsx"), "utf8");

    expect(startupSource).toContain('to="/demo-autoplay"');
    expect(startupSource).toContain("▶ Ver demo guiada");
  });

  test("Demo artifacts include mandatory card fields", () => {
    const artifactsSource = fs.readFileSync(path.join(repoRoot, "src/data/demoArtifacts.js"), "utf8");

    [
      "category",
      "description",
      "problemSolved",
      "technologies",
      "status",
      "qualityScore",
      "previewAnchor",
      "structureAnchor",
    ].forEach((fieldName) => {
      expect(artifactsSource).toContain(fieldName);
    });
  });
});
