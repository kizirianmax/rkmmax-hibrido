/** @jest-environment jsdom */
import { jest } from "@jest/globals";

const mockMount = jest.fn();
const mockTeardown = jest.fn();
const mockSpawn = jest.fn(async () => ({
  output: new ReadableStream({
    start(controller) {
      controller.enqueue("RKMMAX WebContainer spike OK\n");
      controller.close();
    },
  }),
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

  test("faz boot e executa o script mínimo quando houver isolamento", async () => {
    Object.defineProperty(globalThis, "crossOriginIsolated", {
      configurable: true,
      value: true,
    });

    const result = await runWebContainerSpike();
    expect(mockBoot).toHaveBeenCalledTimes(1);
    expect(mockMount).toHaveBeenCalledTimes(1);
    expect(mockSpawn).toHaveBeenCalledWith("node", ["index.js"]);
    expect(mockTeardown).toHaveBeenCalledTimes(1);
    expect(typeof result.ok).toBe("boolean");
    if (result.ok) {
      expect(result.stdout).toContain("RKMMAX WebContainer spike OK");
    } else {
      expect(result.reason).toBeTruthy();
      expect(typeof result.error).toBe("string");
    }
  });
});
