/** @jest-environment jsdom */
import React from "react";
import fs from "fs";
import path from "path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("../WebContainerSpike.css", () => ({}), { virtual: true });
jest.mock("../../lib/construtor/webcontainerSpikeEvidence.js", () => ({
  ARTIFACT_SOURCE: {
    fixture: "controlled-fixture",
    approved: "approved-constructor",
  },
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
  getApprovedConstructorArtifactBridgeStatus: jest.fn(() => ({
    status: "approved-constructor-artifact: unavailable",
    available: false,
    activeSource: "controlled-fixture",
    reason: "no-safe-client-side-approved-source",
    rawPayloadAccessed: false,
    apiUsed: false,
    executeArtifactServerSide: "disabled",
    note: "Bridge preparada estruturalmente; ainda não executa artefato real aprovado.",
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
        "Spike experimental client-side com bridge segura em preparação. Execução atual usa fixture controlado, não artefato real aprovado."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rodar artefato controlado no WebContainer" })).toBeInTheDocument();
  });

  test("renderiza card de evidência segura sem payload bruto", () => {
    render(<WebContainerSpike />);

    expect(screen.getByText("Origem ativa do artefato: fixture controlado")).toBeInTheDocument();
    expect(screen.getByText("Status bridge approved-constructor: approved-constructor-artifact: unavailable")).toBeInTheDocument();
    expect(screen.getByText("Bridge disponível no client: não")).toBeInTheDocument();
    expect(screen.getByText("Motivo bridge indisponível: no-safe-client-side-approved-source")).toBeInTheDocument();
    expect(screen.getByText("Adapter: aprovado")).toBeInTheDocument();
    expect(screen.getByText("Contrato sanitizado: aprovado")).toBeInTheDocument();
    expect(screen.getByText("Execução: client-side / WebContainer")).toBeInTheDocument();
    expect(screen.getByText("Leitura de payload bruto: não")).toBeInTheDocument();
    expect(screen.getByText("Payload bruto: não exibido")).toBeInTheDocument();
    expect(screen.getByText("Backend/API: não usado")).toBeInTheDocument();
    expect(screen.getByText("executeArtifact server-side: desativado")).toBeInTheDocument();
    expect(
      screen.getByText("Bridge preparada estruturalmente; ainda não executa artefato real aprovado.")
    ).toBeInTheDocument();
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

  test("não chama /api na renderização nem no fluxo do spike", async () => {
    render(<WebContainerSpike />);

    expect(runWebContainerSpike).not.toHaveBeenCalled();
    let apiCalls = globalThis.fetch.mock.calls.filter(([url]) => String(url).includes("/api/"));
    expect(apiCalls).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Rodar artefato controlado no WebContainer" }));

    await waitFor(() => {
      expect(runWebContainerSpike).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByText(/Status:/i).closest("p")).toHaveTextContent("sucesso");
    });
    expect(screen.getByText(/Artifact: controlled-webcontainer-artifact@0.0.0-spike/)).toBeInTheDocument();
    expect(screen.getByText(/Resultado controlado: 42/)).toBeInTheDocument();
    expect(screen.getByText(/RKMMAX artifact run OK/)).toBeInTheDocument();

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
