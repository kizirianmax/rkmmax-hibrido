import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

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

    expect(demoSource).toContain("Serginho IA — Construtor de artefatos digitais");
    expect(demoSource).toContain("Por que isso não é apenas um chat?");
    expect(demoSource).toContain("Como avaliar em 5 minutos");
    expect(demoSource).toContain("https://kizirianmax.site/startup");
    expect(demoSource).toContain("O Construtor entrega artefatos digitais estruturados");
    expect(demoSource).toContain("Compare os 5 tipos de artefatos");
    expect(demoSource).toContain('to="/demo-autoplay"');
    expect(demoSource).toContain("Assistir demo guiada do Serginho IA");
    expect(demoSource).toContain("Estrutura validada");
    expect(demoSource).toContain("demo-card__structure-badge");
  });

  test("Startup page includes primary CTA to /demo and keeps guided /demo-autoplay", () => {
    const startupSource = fs.readFileSync(path.join(repoRoot, "src/pages/Projects.jsx"), "utf8");

    expect(startupSource).toContain('to="/demo"');
    expect(startupSource).toContain('to="/demo-autoplay"');
    expect(startupSource).toContain("Ver demonstração pública");
    expect(startupSource).toContain("View public demo");
  });

  test("Demo artifacts include mandatory card fields", async () => {
    const artifactsSource = fs.readFileSync(path.join(repoRoot, "src/data/demoArtifacts.js"), "utf8");
    const artifactsModulePath = pathToFileURL(
      path.join(repoRoot, "src/data/demoArtifacts.js"),
    ).href;
    const { demoArtifacts } = await import(artifactsModulePath);

    [
      "id",
      "name",
      "category",
      "description",
      "problemSolved",
      "technologies",
      "status",
      "qualityScore",
      "previewAnchor",
      "structureAnchor",
      "traceability",
    ].forEach((fieldName) => {
      expect(artifactsSource).toContain(fieldName);
    });

    expect(Array.isArray(demoArtifacts)).toBe(true);
    expect(demoArtifacts).toHaveLength(5);

    demoArtifacts.forEach((artifact) => {
      expect(artifact).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          category: expect.any(String),
          description: expect.any(String),
          problemSolved: expect.any(String),
          technologies: expect.any(Array),
          status: expect.any(String),
          qualityScore: expect.any(String),
          previewAnchor: expect.any(String),
          structureAnchor: expect.any(String),
          traceability: expect.objectContaining({
            artifactType: expect.any(String),
            structuralStatus: expect.any(String),
            origin: expect.any(String),
            isDemonstrativeExample: true,
            pipelineReference: expect.any(String),
          }),
        }),
      );
    });
  });
});
