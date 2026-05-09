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
    const demoSource = fs.readFileSync(path.join(repoRoot, "src/pages/Demo.jsx"), "utf8");

    const expectedArtifacts = [
      "Landing Page SaaS",
      "Dashboard Analytics",
      "Formulário de Cadastro",
      "Página de Produto",
      "Página Institucional Startup",
    ];

    expectedArtifacts.forEach((artifactName) => {
      expect(demoSource).toContain(artifactName);
    });
  });
});
