import { jest } from "@jest/globals";
import {
  buildControlledApprovedWebContainerFixture,
  CONTROLLED_APPROVED_PREVIEW_SUMMARY,
  CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE,
  getControlledApprovedWebContainerFixturePublicStatus,
  getControlledApprovedWebContainerRuntimeInput,
} from "../constructorApprovedArtifactWebContainerFixture.js";
import { validateApprovedConstructorArtifact } from "../approvedConstructorArtifactContract.js";
import { prepareApprovedConstructorArtifactForWebContainer } from "../approvedConstructorArtifactHandoff.js";
import { selectConstructorApprovedArtifactSnapshotInput } from "../constructorApprovedArtifactPreviewSelector.js";

describe("constructorApprovedArtifactWebContainerFixture", () => {
  test("encadeia selector #586 e handoff #582 para produzir mountTree seguro", () => {
    const selected = selectConstructorApprovedArtifactSnapshotInput(CONTROLLED_APPROVED_PREVIEW_SUMMARY, "approved");
    expect(selected.ok).toBe(true);

    const fixture = buildControlledApprovedWebContainerFixture();

    const prepared = prepareApprovedConstructorArtifactForWebContainer(selected.artifact);

    expect(fixture.ok).toBe(true);
    expect(fixture.status).toBe("approved-constructor-artifact: controlled-fixture-ready");
    expect(fixture.activeSource).toBe("controlled-approved-fixture");
    expect(fixture.sourceType).toBe("controlled-client-safe-approved-source");
    expect(fixture.available).toBe(true);
    expect(fixture.entrypoint).toBe("index.js");
    expect(fixture.safeFiles).toEqual(["package.json", "artifact-manifest.json", "index.js", "lib/sum.js"]);
    expect(fixture.fileCount).toBe(4);
    expect(fixture.apiUsed).toBe(false);
    expect(fixture.storageUsed).toBe(false);
    expect(fixture.rawPayloadAccessed).toBe(false);
    expect(fixture.executeArtifactServerSide).toBe("disabled");
    expect(fixture.note).toMatch(/fixture/i);
    expect(fixture.note).toMatch(/não é artefato real aprovado/i);
    expect(fixture.mountTree).toEqual(prepared.mountTree);
  });

  test("artefato selecionado passa no contrato #581 e handoff produz mountTree equivalente", () => {
    const selected = selectConstructorApprovedArtifactSnapshotInput(CONTROLLED_APPROVED_PREVIEW_SUMMARY, "approved");

    expect(selected.ok).toBe(true);

    const contractValidation = validateApprovedConstructorArtifact(selected.artifact);
    expect(contractValidation.ok).toBe(true);

    const prepared = prepareApprovedConstructorArtifactForWebContainer(selected.artifact);
    expect(prepared.ok).toBe(true);
    expect(prepared.mountTree).toBeDefined();

    expect(prepared.mountTree).toEqual(CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE.mountTree);
  });

  test("status público não expõe mountTree nem payload sensível e runtime retorna apenas dados de execução", () => {
    const publicStatus = getControlledApprovedWebContainerFixturePublicStatus();
    const runtimeInput = getControlledApprovedWebContainerRuntimeInput();

    expect(publicStatus).toEqual({
      ok: true,
      status: "approved-constructor-artifact: controlled-fixture-ready",
      activeSource: "controlled-approved-fixture",
      sourceType: "controlled-client-safe-approved-source",
      available: true,
      entrypoint: "index.js",
      safeFiles: ["package.json", "artifact-manifest.json", "index.js", "lib/sum.js"],
      fileCount: 4,
      apiUsed: false,
      storageUsed: false,
      rawPayloadAccessed: false,
      executeArtifactServerSide: "disabled",
      note: "Fonte aprovada controlada via fixture client-safe; ainda não é artefato real aprovado do Construtor.",
    });

    expect(runtimeInput).toEqual({
      mountTree: CONTROLLED_APPROVED_WEBCONTAINER_FIXTURE.mountTree,
      entrypoint: "index.js",
    });

    const serializedStatus = JSON.stringify(publicStatus);
    expect(serializedStatus).not.toContain("mountTree");
    expect(serializedStatus).not.toContain("content");
    expect(serializedStatus).not.toContain("contentPreview");
    expect(serializedStatus).not.toContain("zipBase64");
    expect(serializedStatus).not.toContain("user_email");
    expect(serializedStatus).not.toContain("token");
    expect(serializedStatus).not.toContain("secret");
  });

  test("builder não usa fetch/storage e não referencia /api", () => {
    const originalFetch = globalThis.fetch;
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy;

    const fixture = buildControlledApprovedWebContainerFixture();

    expect(fixture.ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    const source = JSON.stringify(CONTROLLED_APPROVED_PREVIEW_SUMMARY);
    expect(source).not.toContain("/api/");
    expect(source).not.toContain("sessionStorage");
    expect(source).not.toContain("localStorage");

    globalThis.fetch = originalFetch;
  });
});
