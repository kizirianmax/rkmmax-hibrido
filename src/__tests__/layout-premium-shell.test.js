import fs from "fs";
import path from "path";

const repoRoot = process.cwd();

describe("F7-UX-03 global premium layout wiring", () => {
  test("App mounts Footer in global shell", () => {
    const appSource = fs.readFileSync(path.join(repoRoot, "src/App.jsx"), "utf8");

    expect(appSource).toContain('import Footer from "./components/Footer.jsx"');
    expect(appSource).toMatch(/<div className="app-shell">[\s\S]*<Header \/>[\s\S]*<Footer \/>/);
  });

  test("Header uses dedicated CSS class-based structure", () => {
    const headerSource = fs.readFileSync(path.join(repoRoot, "src/components/Header.jsx"), "utf8");

    expect(headerSource).toContain('import "./Header.css"');
    expect(headerSource).toContain('className="app-header__nav nav"');
    expect(headerSource).toContain('className="app-header__actions"');
  });
});
