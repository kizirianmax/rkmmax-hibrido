/** @jest-environment jsdom */
import React from "react";
import fs from "fs";
import path from "path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("../WebContainerSpike.css", () => ({}), { virtual: true });
jest.mock("../../lib/construtor/webcontainerSpikeRunner.js", () => ({
  runWebContainerSpike: jest.fn(async () => ({
    ok: true,
    stdout: "RKMMAX WebContainer spike OK",
    stderr: "",
    exitCode: 0,
    durationMs: 10,
  })),
}));

import { runWebContainerSpike } from "../../lib/construtor/webcontainerSpikeRunner.js";
import WebContainerSpike from "../WebContainerSpike.jsx";

const repoRoot = path.resolve(process.cwd());

describe("WebContainerSpike page", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
    Object.defineProperty(globalThis, "crossOriginIsolated", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("renderiza aviso experimental e botão de execução", () => {
    render(<WebContainerSpike />);

    expect(
      screen.getByText(
        "Spike experimental client-side. Não executa no servidor. Não representa ainda a demo final."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rodar spike WebContainers" })).toBeInTheDocument();
  });

  test("não chama /api na renderização nem no fluxo do spike", async () => {
    render(<WebContainerSpike />);

    expect(runWebContainerSpike).not.toHaveBeenCalled();
    let apiCalls = globalThis.fetch.mock.calls.filter(([url]) => String(url).includes("/api/"));
    expect(apiCalls).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Rodar spike WebContainers" }));

    await waitFor(() => {
      expect(runWebContainerSpike).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/Status:/i).closest("p")).toHaveTextContent("sucesso");
    });

    apiCalls = globalThis.fetch.mock.calls.filter(([url]) => String(url).includes("/api/"));
    expect(apiCalls).toHaveLength(0);
  });

  test("rota do spike é pública no AuthGate e não aparece no Header/menu", () => {
    const authGateSource = fs.readFileSync(path.join(repoRoot, "src/auth/AuthGate.jsx"), "utf8");
    const headerSource = fs.readFileSync(path.join(repoRoot, "src/components/Header.jsx"), "utf8");

    expect(authGateSource).toContain('"/webcontainer-spike"');
    expect(headerSource).not.toContain('to="/webcontainer-spike"');
  });
});
