/** @jest-environment jsdom */
import { jest } from "@jest/globals";

const mockMount = jest.fn();
const mockTeardown = jest.fn();
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

jest.unstable_mockModule("@webcontainer/api", () => ({
  WebContainer: {
    boot: mockBoot,
  },
}));

const { CONTROLLED_ARTIFACT_ENTRYPOINT } = await import("../webcontainerArtifactFixture.js");
const { runWebContainerSpike } = await import("../webcontainerSpikeRunner.js");

describe("runWebContainerSpike", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(mountedFixture).toHaveProperty(["package.json", "file", "contents"]);
    expect(mountedFixture).toHaveProperty([CONTROLLED_ARTIFACT_ENTRYPOINT, "file", "contents"]);
    expect(mountedFixture).toHaveProperty(["lib", "directory", "sum.js", "file", "contents"]);
    expect(mockSpawn).toHaveBeenCalledWith("node", [CONTROLLED_ARTIFACT_ENTRYPOINT]);
    expect(mockTeardown).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    expect(result.stdout).toContain("Resultado controlado: 42");
    expect(result.stdout).toContain("RKMMAX artifact run OK");
    expect(result.stderr).toBe("");
  });
});
