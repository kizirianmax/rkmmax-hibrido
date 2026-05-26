import fs from "fs";
import path from "path";

const repoRoot = path.resolve(process.cwd());

const readSource = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

describe("Public pages premium UI adoption (static checks)", () => {
  test("Home page uses dedicated premium stylesheet and design-system classes", () => {
    const homeSource = readSource("src/pages/Home.jsx");
    const homeCss = readSource("src/pages/Home.css");

    expect(homeSource).toContain('import "./Home.css";');
    expect(homeSource).toContain("rkm-card rkm-card-elevated");
    expect(homeSource).toContain("rkm-btn-primary");
    expect(homeSource).toContain("rkm-btn-secondary");
    expect(homeCss).toContain("--rkm-");
    expect(homeCss).toContain(".home-page__content-grid");
  });

  test("Home page F7-UX-06: Serginho IA as main brand with value proposition and /demo CTA", () => {
    const homeSource = readSource("src/pages/Home.jsx");

    // Main brand title
    expect(homeSource).toContain("Serginho IA");
    // Institutional reference preserved
    expect(homeSource).toContain("RKMMAX INFINITY MATRIX STUDY");
    // Primary CTA points to /demo
    expect(homeSource).toContain('href="/demo"');
    // Secondary CTA uses existing platform route
    expect(homeSource).toContain('href="/serginho"');
    // Value proposition includes key terms
    expect(homeSource).toContain("artefatos digitais");
    // Target audience present
    expect(homeSource).toContain("empreendedores");
  });

  test("Home page F7-UX-06: four capability cards present (informational only)", () => {
    const homeSource = readSource("src/pages/Home.jsx");
    const homeCss = readSource("src/pages/Home.css");

    // All four capabilities
    expect(homeSource).toContain("Planejar com Serginho IA");
    expect(homeSource).toContain("Construir artefatos digitais");
    expect(homeSource).toContain("Consultar especialistas");
    expect(homeSource).toContain("Validar conformidade ABNT");
    // Capabilities grid CSS exists
    expect(homeCss).toContain(".home-page__capabilities-grid");
    // No operational selectors / bypass routes created
    expect(homeSource).not.toContain('href="/abnt"');
    expect(homeSource).not.toContain('href="/construtor"');
    expect(homeSource).not.toContain('href="/hybrid"');
    expect(homeSource).not.toContain('href="/specialists"');
  });

  test("Startup page applies premium cards and button foundations", () => {
    const startupSource = readSource("src/pages/Projects.jsx");
    const startupCss = readSource("src/pages/Projects.css");

    expect(startupSource).toContain('className="startup-demo-cta rkm-btn-primary"');
    expect(startupSource).toContain('className="startup-validation-card rkm-card"');
    expect(startupSource).toContain('className="startup-contact-box rkm-card rkm-card-elevated"');
    expect(startupCss).toContain("var(--rkm-");
    expect(startupCss).toContain(".startup-section");
  });

  test("Demo page reuses premium card/button classes without changing public runtime", () => {
    const demoSource = readSource("src/pages/Demo.jsx");
    const demoCss = readSource("src/pages/Demo.css");

    expect(demoSource).toContain('className="demo-page__hero rkm-card rkm-card-elevated"');
    expect(demoSource).toContain('className="demo-card rkm-card"');
    expect(demoSource).toContain('className="demo-page__footer rkm-card"');
    expect(demoCss).toContain("var(--rkm-");
    expect(demoCss).toContain(".demo-page__section--panel");
  });

  test("Login page uses premium stylesheet, input and button foundations", () => {
    const authSource = readSource("src/pages/Auth.jsx");
    const authCss = readSource("src/pages/Auth.css");

    expect(authSource).toContain('import "./Auth.css";');
    expect(authSource).toContain('className="auth-card rkm-card rkm-card-elevated"');
    expect(authSource).toContain('className="auth-card__input rkm-input"');
    expect(authSource).toContain('className="auth-card__submit rkm-btn-primary"');
    expect(authCss).toContain(".auth-card__message--error");
    expect(authCss).toContain("var(--rkm-");
  });
});
