import fs from "fs";
import path from "path";

const repoRoot = path.resolve(process.cwd());

describe("Public pages premium visual integration (static checks)", () => {
  test("Home imports local premium CSS and reuses shared RKM buttons/cards", () => {
    const homeSource = fs.readFileSync(path.join(repoRoot, "src/pages/Home.jsx"), "utf8");

    expect(homeSource).toContain('import "./Home.css";');
    expect(homeSource).toContain('className="home-page__hero rkm-card rkm-card-elevated"');
    expect(homeSource).toContain('className="home-page__card home-page__card--serginho rkm-card rkm-card-elevated"');
    expect(homeSource).toContain('className="home-page__hero-cta rkm-btn rkm-btn-primary"');
    expect(homeSource).toContain('className="home-page__action rkm-btn rkm-btn-secondary"');
  });

  test("Startup page applies shared premium classes without changing content routes", () => {
    const startupSource = fs.readFileSync(path.join(repoRoot, "src/pages/Projects.jsx"), "utf8");

    expect(startupSource).toContain('className="startup-demo-cta rkm-btn rkm-btn-primary"');
    expect(startupSource).toContain('className="startup-hero rkm-card rkm-card-elevated"');
    expect(startupSource).toContain('className="startup-section rkm-card"');
    expect(startupSource).toContain('className="startup-validation-card rkm-card"');
    expect(startupSource).toContain('to="/demo-autoplay"');
  });

  test("Demo page upgrades hero, cards and actions with shared premium system", () => {
    const demoSource = fs.readFileSync(path.join(repoRoot, "src/pages/Demo.jsx"), "utf8");

    expect(demoSource).toContain('className="demo-page__hero rkm-card rkm-card-elevated"');
    expect(demoSource).toContain('className="demo-page__autoplay-cta rkm-btn rkm-btn-primary"');
    expect(demoSource).toContain('className="demo-card rkm-card rkm-card-elevated"');
    expect(demoSource).toContain('className="demo-card__action rkm-btn rkm-btn-primary"');
    expect(demoSource).toContain('className="demo-page__footer rkm-card rkm-card-elevated"');
  });

  test("Login page uses premium CSS, input and shared CTA classes", () => {
    const authSource = fs.readFileSync(path.join(repoRoot, "src/pages/Auth.jsx"), "utf8");

    expect(authSource).toContain('import "./Auth.css";');
    expect(authSource).toContain('className="auth-page__panel rkm-card rkm-card-elevated"');
    expect(authSource).toContain('className="auth-form__input rkm-input"');
    expect(authSource).toContain('className="auth-form__submit rkm-btn rkm-btn-primary"');
    expect(authSource).toContain('signInWithOtp({ email: normalizedEmail })');
  });
});
