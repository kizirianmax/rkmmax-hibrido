/** @jest-environment jsdom */
import { jest } from "@jest/globals";

const mockMount = jest.fn();
const mockTeardown = jest.fn();
const mockWebContainerModuleFactory = jest.fn(() => ({
  WebContainer: {
    boot: mockBoot,
  },
}));
const mockOutputChunks = [
  "Artifact: controlled-webcontainer-artifact@0.0.0-spike\n",
  "Resultado controlado: 42\n",
  "RKMMAX artifact run OK\n",
];
const mockSpawn = jest.fn(async () => ({
  output: {
    getReader() {
      let index = 0;
      return {
        async read() {
          if (index >= mockOutputChunks.length) {
            return { done: true };
          }
          return { done: false, value: mockOutputChunks[index++] };
        },
      };
    },
  },
  exit: Promise.resolve(0),
}));
const mockBoot = jest.fn(async () => ({
  mount: mockMount,
  spawn: mockSpawn,
  teardown: mockTeardown,
}));

jest.unstable_mockModule("@webcontainer/api", mockWebContainerModuleFactory);

const { CONTROLLED_ARTIFACT_ENTRYPOINT, CONTROLLED_ARTIFACT_SANITIZED } = await import("../webcontainerArtifactFixture.js");
const { getControlledApprovedWebContainerRuntimeInput } = await import(
  "../constructorApprovedArtifactWebContainerFixture.js"
);
const { runWebContainerSpike } = await import("../webcontainerSpikeRunner.js");

describe("runWebContainerSpike", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMount.mockResolvedValue(undefined);
    mockSpawn.mockImplementation(async () => ({
      output: {
        getReader() {
          let index = 0;
          return {
            async read() {
              if (index >= mockOutputChunks.length) {
                return { done: true };
              }
              return { done: false, value: mockOutputChunks[index++] };
            },
          };
        },
      },
      exit: Promise.resolve(0),
    }));
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("não faz boot automático ao importar o runner", () => {
    expect(mockBoot).not.toHaveBeenCalled();
    expect(mockWebContainerModuleFactory).not.toHaveBeenCalled();
  });

  test("retorna cedo sem importar/bootar quando cross-origin isolation está indisponível", async () => {
    Object.defineProperty(globalThis, "crossOriginIsolated", {
      configurable: true,
      value: false,
    });

    expect(mockBoot).not.toHaveBeenCalled();
    const result = await runWebContainerSpike();

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("cross-origin-isolation-indisponivel");
    expect(mockWebContainerModuleFactory).not.toHaveBeenCalled();
    expect(mockBoot).not.toHaveBeenCalled();
  });

  test("faz boot e executa o artefato controlado multi-arquivo quando houver isolamento", async () => {
    Object.defineProperty(globalThis, "crossOriginIsolated", {
      configurable: true,
      value: true,
    });

    const result = await runWebContainerSpike();
    expect(mockBoot).toHaveBeenCalledTimes(1);
    expect(mockMount).toHaveBeenCalledTimes(1);
    const mountedFixture = mockMount.mock.calls[0][0];
    expect(mountedFixture).toEqual(CONTROLLED_ARTIFACT_SANITIZED.mountTree);
    expect(mountedFixture).toHaveProperty(["package.json", "file", "contents"]);
    expect(mountedFixture).toHaveProperty([CONTROLLED_ARTIFACT_ENTRYPOINT, "file", "contents"]);
    expect(mountedFixture).toHaveProperty(["lib", "directory", "sum.js", "file", "contents"]);
    expect(mountedFixture).not.toHaveProperty(["lib/sum.js"]);
    expect(mockSpawn).toHaveBeenCalledWith("node", [CONTROLLED_ARTIFACT_ENTRYPOINT]);
    expect(mockTeardown).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    expect(result.stdout).toContain("Artifact: controlled-webcontainer-artifact@0.0.0-spike");
    expect(result.stdout).toContain("Resultado controlado: 42");
    expect(result.stdout).toContain("RKMMAX artifact run OK");
    expect(result.stderr).toBe("");
    const apiCalls = globalThis.fetch.mock.calls.filter(([url]) => String(url).includes("/api/"));
    expect(apiCalls).toHaveLength(0);
  });

  test("aceita runtime input controlado da bridge e mantém execução client-side", async () => {
    Object.defineProperty(globalThis, "crossOriginIsolated", {
      configurable: true,
      value: true,
    });
    const approvedRuntimeInput = getControlledApprovedWebContainerRuntimeInput();

    const result = await runWebContainerSpike({
      approvedRuntimeInput,
    });

    expect(result.ok).toBe(true);
    expect(mockMount).toHaveBeenCalledWith(approvedRuntimeInput.mountTree);
    expect(mockSpawn).toHaveBeenCalledWith("node", ["index.js"]);
  });

  test("preserva fallback para fixture quando runtime input confiável não é fornecido", async () => {
    Object.defineProperty(globalThis, "crossOriginIsolated", {
      configurable: true,
      value: true,
    });

    await runWebContainerSpike();

    expect(mockMount).toHaveBeenCalledWith(CONTROLLED_ARTIFACT_SANITIZED.mountTree);
    expect(mockSpawn).toHaveBeenCalledWith("node", [CONTROLLED_ARTIFACT_ENTRYPOINT]);
  });

  test("ignora mountTree/entrypoint arbitrários fora do runtime input confiável", async () => {
    Object.defineProperty(globalThis, "crossOriginIsolated", {
      configurable: true,
      value: true,
    });

    await runWebContainerSpike({
      mountTree: {
        "index.js": { file: { contents: "console.log('arbitrary')" } },
      },
      entrypoint: "index.js",
    });

    expect(mockMount).toHaveBeenCalledWith(CONTROLLED_ARTIFACT_SANITIZED.mountTree);
    expect(mockSpawn).toHaveBeenCalledWith("node", [CONTROLLED_ARTIFACT_ENTRYPOINT]);
  });

  test("chama teardown em finally quando a execução falha após o boot", async () => {
    Object.defineProperty(globalThis, "crossOriginIsolated", {
      configurable: true,
      value: true,
    });
    mockSpawn.mockRejectedValueOnce(new Error("falha controlada"));

    const result = await runWebContainerSpike();

    expect(result.ok).toBe(false);
    expect(mockBoot).toHaveBeenCalledTimes(1);
    expect(mockTeardown).toHaveBeenCalledTimes(1);
  });
});
