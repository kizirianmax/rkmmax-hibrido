/** @jest-environment jsdom */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("../WebContainerSpike.css", () => ({}), { virtual: true });
jest.mock("../../lib/construtor/webcontainerSpikeEvidence.js", () => ({
  getWebContainerSpikeEvidence: jest.fn(() => ({
    ok: true,
    source: "controlled-constructor-artifact",
    adapter: "passed",
    sanitization: "passed",
    entrypoint: "index.js",
    allowedFiles: ["package.json", "artifact-manifest.json", "index.js", "lib/sum.js"],
    mountTreeFiles: ["package.json", "artifact-manifest.json", "index.js", "lib/sum.js"],
    blockedPayloadPolicy: ["content", "contentPreview", "zipBase64", "user_email", "secrets", "network", "shell"],
    warning: "Fixture controlado; não usa dados reais de usuário.",
  })),
}));
jest.mock("../../lib/construtor/webcontainerSpikeRunner.js", () => ({
  runWebContainerSpike: jest.fn(async () => ({
    ok: true,
    stdout:
      "Artifact: controlled-webcontainer-artifact@0.0.0-spike\nResultado controlado: 42\nRKMMAX artifact run OK\n",
    stderr: "",
    exitCode: 0,
    durationMs: 10,
  })),
}));

import { runWebContainerSpike } from "../../lib/construtor/webcontainerSpikeRunner.js";
import WebContainerSpike from "../WebContainerSpike.jsx";

describe("WebContainerSpike safe evidence", () => {
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

  test("renderiza card de evidência segura sem payload bruto", () => {
    render(<WebContainerSpike />);

    expect(screen.getByText("Candidate controlado do Construtor")).toBeInTheDocument();
    expect(screen.getByText("Adapter: aprovado")).toBeInTheDocument();
    expect(screen.getByText("Contrato sanitizado: aprovado")).toBeInTheDocument();
    expect(screen.getByText("Execução: client-side / WebContainer")).toBeInTheDocument();
    expect(screen.getByText("Payload bruto: não exibido")).toBeInTheDocument();
    expect(screen.getByText("Backend/API: não usado")).toBeInTheDocument();
    expect(screen.getByText("executeArtifact server-side: desativado")).toBeInTheDocument();
    expect(screen.getByText("Ainda é spike experimental; não é demo final de produção.")).toBeInTheDocument();

    expect(screen.getByText("package.json")).toBeInTheDocument();
    expect(screen.getByText("artifact-manifest.json")).toBeInTheDocument();
    expect(screen.getByText("index.js")).toBeInTheDocument();
    expect(screen.getByText("lib/sum.js")).toBeInTheDocument();

    expect(screen.queryByText(/zipBase64/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/contentPreview/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/user_email/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/const manifest = require/i)).not.toBeInTheDocument();
  });

  test("mantém runner manual/lazy: não chama no render e chama no clique", async () => {
    render(<WebContainerSpike />);

    expect(runWebContainerSpike).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Rodar artefato controlado no WebContainer" }));

    await waitFor(() => {
      expect(runWebContainerSpike).toHaveBeenCalledTimes(1);
    });
  });

  test("não chama /api no render nem no clique", async () => {
    render(<WebContainerSpike />);

    let apiCalls = globalThis.fetch.mock.calls.filter(([url]) => String(url).includes("/api/"));
    expect(apiCalls).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Rodar artefato controlado no WebContainer" }));

    await waitFor(() => {
      expect(runWebContainerSpike).toHaveBeenCalledTimes(1);
    });

    apiCalls = globalThis.fetch.mock.calls.filter(([url]) => String(url).includes("/api/"));
    expect(apiCalls).toHaveLength(0);
  });
});
