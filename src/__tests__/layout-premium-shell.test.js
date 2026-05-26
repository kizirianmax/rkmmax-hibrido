import fs from "fs";
import path from "path";

const repoRoot = process.cwd();

describe("F7-UX-03 global premium layout wiring", () => {
  test("App mounts Footer in global shell", () => {
    const appSource = fs.readFileSync(path.join(repoRoot, "src/App.jsx"), "utf8");

    expect(appSource).toContain('import Footer from "./components/Footer.jsx"');
    expect(appSource).toContain('<div className="app-shell">');
    expect(appSource).toContain('<main className="app-main" id="main-content">');

    const headerIndex = appSource.indexOf("<Header />");
    const mainIndex = appSource.indexOf('<main className="app-main" id="main-content">');
    const footerIndex = appSource.indexOf("<Footer />");

    expect(headerIndex).toBeGreaterThan(-1);
    expect(mainIndex).toBeGreaterThan(headerIndex);
    expect(footerIndex).toBeGreaterThan(mainIndex);
  });

  test("Header uses dedicated CSS class-based structure", () => {
    const headerSource = fs.readFileSync(path.join(repoRoot, "src/components/Header.jsx"), "utf8");

    expect(headerSource).toContain('import "./Header.css"');
    expect(headerSource).toContain('className="app-header__nav nav"');
    expect(headerSource).toContain('className="app-header__actions"');
  });
});
