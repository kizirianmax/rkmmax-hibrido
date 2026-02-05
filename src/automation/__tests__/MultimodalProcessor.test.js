/**
 * MULTIMODAL PROCESSOR TESTS
 * Testes unitários para processamento multimodal
 */

// Dynamic import para ES modules
let MultimodalProcessor;

beforeAll(async () => {
  const module = await import("../MultimodalProcessor.js");
  MultimodalProcessor = module.default;
});

describe("MultimodalProcessor", () => {
  let processor;

  beforeEach(() => {
    if (!MultimodalProcessor) {
      throw new Error("MultimodalProcessor not loaded");
    }
    processor = new MultimodalProcessor();
  });

  describe("Audio Processing", () => {
    describe("validateAudioFile", () => {
      test("deve aceitar formato MP3", () => {
        const validation = processor.validateAudioFile("audio.mp3", 1000000);

        expect(validation.valid).toBe(true);
      });

      test("deve aceitar formato WAV", () => {
        const validation = processor.validateAudioFile("audio.wav", 1000000);

        expect(validation.valid).toBe(true);
      });

      test("deve rejeitar formato inválido", () => {
        const validation = processor.validateAudioFile("audio.exe", 1000000);

        expect(validation.valid).toBe(false);
        expect(validation.error).toContain("não suportado");
      });

      test("deve rejeitar arquivo muito grande", () => {
        const validation = processor.validateAudioFile("audio.mp3", 30 * 1024 * 1024);

        expect(validation.valid).toBe(false);
        expect(validation.error).toContain("muito grande");
      });
    });

    describe("processAudio", () => {
      test("deve processar áudio válido", async () => {
        const audioBuffer = Buffer.from("fake audio data");

        // Mock da API de transcrição
        processor.transcribeAudio = async () => "cria um componente de login";

        const result = await processor.processAudio(audioBuffer, "mp3");

        expect(result.type).toBe("audio");
        expect(result.format).toBe("mp3");
        expect(result.transcript).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });

      test("deve rejeitar formato não suportado", async () => {
        const audioBuffer = Buffer.from("fake audio data");

        await expect(processor.processAudio(audioBuffer, "exe")).rejects.toThrow();
      });

      test("deve rejeitar arquivo muito grande", async () => {
        const largeBuffer = Buffer.alloc(30 * 1024 * 1024);

        await expect(processor.processAudio(largeBuffer, "mp3")).rejects.toThrow();
      });
    });

    describe("estimateAudioDuration", () => {
      test("deve estimar duração do áudio", async () => {
        const audioBuffer = Buffer.alloc(128000); // ~1 segundo a 128kbps

        const duration = await processor.estimateAudioDuration(audioBuffer, "mp3");

        expect(duration).toBeGreaterThan(0);
      });
    });
  });

  describe("Image Processing", () => {
    describe("validateImageFile", () => {
      test("deve aceitar formato PNG", () => {
        const validation = processor.validateImageFile("image.png", 1000000);

        expect(validation.valid).toBe(true);
      });

      test("deve aceitar formato JPG", () => {
        const validation = processor.validateImageFile("image.jpg", 1000000);

        expect(validation.valid).toBe(true);
      });

      test("deve rejeitar formato inválido", () => {
        const validation = processor.validateImageFile("image.exe", 1000000);

        expect(validation.valid).toBe(false);
      });

      test("deve rejeitar arquivo muito grande", () => {
        const validation = processor.validateImageFile("image.png", 25 * 1024 * 1024);

        expect(validation.valid).toBe(false);
      });
    });

    describe("processImage", () => {
      test("deve processar imagem válida", async () => {
        const imageBuffer = Buffer.from("fake image data");

        // Mock da API de análise
        processor.analyzeImage = async () => ({
          description: "Uma imagem de código",
          labels: ["código", "terminal"],
          confidence: 0.95,
        });

        const result = await processor.processImage(imageBuffer, "png");

        expect(result.type).toBe("image");
        expect(result.format).toBe("png");
        expect(result.analysis).toBeDefined();
      });

      test("deve rejeitar formato não suportado", async () => {
        const imageBuffer = Buffer.from("fake image data");

        await expect(processor.processImage(imageBuffer, "exe")).rejects.toThrow();
      });
    });

    describe("extractTextFromImage", () => {
      test("deve extrair texto da imagem", async () => {
        const imageBuffer = Buffer.from("fake image data");

        // Mock da análise
        processor.analyzeImage = async () => ({
          textDetection: [
            { text: "function test()", confidence: 0.95 },
            { text: "return true;", confidence: 0.93 },
          ],
          description: "Código JavaScript",
        });

        const result = await processor.extractTextFromImage(imageBuffer, "png");

        expect(result.success).toBe(true);
        expect(result.text).toContain("function test()");
        expect(result.confidence).toBeGreaterThan(0);
      });

      test("deve retornar sucesso false quando nenhum texto é encontrado", async () => {
        const imageBuffer = Buffer.from("fake image data");

        processor.analyzeImage = async () => ({
          textDetection: [],
          description: "Imagem sem texto",
        });

        const result = await processor.extractTextFromImage(imageBuffer, "png");

        expect(result.success).toBe(false);
        expect(result.text).toBe("");
      });
    });

    describe("describeImage", () => {
      test("deve descrever imagem", async () => {
        const imageBuffer = Buffer.from("fake image data");

        processor.analyzeImage = async () => ({
          description: "Uma imagem de código JavaScript",
          labels: ["código", "javascript", "terminal"],
          objects: ["monitor", "teclado"],
          confidence: 0.92,
        });

        const result = await processor.describeImage(imageBuffer, "png");

        expect(result.description).toBeDefined();
        expect(result.labels.length).toBeGreaterThan(0);
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    describe("detectCodeInImage", () => {
      test("deve detectar código em imagem", async () => {
        const imageBuffer = Buffer.from("fake image data");

        processor.extractTextFromImage = async () => ({
          success: true,
          text: "function login() { return true; }",
          confidence: 0.95,
        });

        const result = await processor.detectCodeInImage(imageBuffer, "png");

        expect(result.success).toBe(true);
        expect(result.code).toContain("function");
        expect(result.language).toBeDefined();
      });

      test("deve identificar linguagem JavaScript", async () => {
        const imageBuffer = Buffer.from("fake image data");

        processor.extractTextFromImage = async () => ({
          success: true,
          text: "const x = 10; function test() {}",
          confidence: 0.95,
        });

        const result = await processor.detectCodeInImage(imageBuffer, "png");

        expect(result.language).toBe("javascript");
      });

      test("deve identificar linguagem Python", async () => {
        const imageBuffer = Buffer.from("fake image data");

        processor.extractTextFromImage = async () => ({
          success: true,
          text: 'def test(): print("hello")',
          confidence: 0.95,
        });

        const result = await processor.detectCodeInImage(imageBuffer, "png");

        expect(result.language).toBe("python");
      });

      test("deve identificar linguagem SQL", async () => {
        const imageBuffer = Buffer.from("fake image data");

        processor.extractTextFromImage = async () => ({
          success: true,
          text: "SELECT * FROM users WHERE id = 1",
          confidence: 0.95,
        });

        const result = await processor.detectCodeInImage(imageBuffer, "png");

        expect(result.language).toBe("sql");
      });
    });

    describe("detectProgrammingLanguage", () => {
      test("deve detectar JavaScript", () => {
        const code = "const x = 10; function test() {}";
        const language = processor.detectProgrammingLanguage(code);

        expect(language).toBe("javascript");
      });

      test("deve detectar Python", () => {
        const code = "def test(): return True";
        const language = processor.detectProgrammingLanguage(code);

        expect(language).toBe("python");
      });

      test("deve detectar Java", () => {
        const code = "public class Test { public static void main() {} }";
        const language = processor.detectProgrammingLanguage(code);

        expect(language).toBe("java");
      });

      test("deve detectar SQL", () => {
        const code = "SELECT * FROM users WHERE id = 1";
        const language = processor.detectProgrammingLanguage(code);

        expect(language).toBe("sql");
      });

      test("deve retornar null para linguagem desconhecida", () => {
        const code = "some random text without code";
        const language = processor.detectProgrammingLanguage(code);

        expect(language).toBeNull();
      });
    });
  });

  describe("Multimodal Processing", () => {
    test("deve processar áudio e imagem simultaneamente", async () => {
      const inputs = {
        audio: {
          buffer: Buffer.from("fake audio"),
          format: "mp3",
        },
        image: {
          buffer: Buffer.from("fake image"),
          format: "png",
        },
      };

      processor.processAudio = async () => ({
        transcript: "cria um componente",
        confidence: 0.95,
      });

      processor.processImage = async () => ({
        analysis: { description: "Imagem de código" },
      });

      const result = await processor.processMultimodal(inputs);

      expect(result.audio).toBeDefined();
      expect(result.image).toBeDefined();
      expect(result.combined).toBeDefined();
    });

    test("deve combinar resultados corretamente", async () => {
      const inputs = {
        audio: {
          buffer: Buffer.from("fake audio"),
          format: "mp3",
        },
        image: {
          buffer: Buffer.from("fake image"),
          format: "png",
        },
      };

      processor.processAudio = async () => ({
        transcript: "cria um componente",
        confidence: 0.95,
      });

      processor.processImage = async () => ({
        analysis: { description: "Imagem de código" },
      });

      const result = await processor.processMultimodal(inputs);

      expect(result.combined.transcript).toBe("cria um componente");
      expect(result.combined.imageAnalysis.description).toBe("Imagem de código");
      expect(result.combined.confidence).toBeDefined();
    });
  });

  describe("Support Information", () => {
    test("deve retornar informações de suporte", () => {
      const info = processor.getSupportInfo();

      expect(info.audio).toBeDefined();
      expect(info.image).toBeDefined();
      expect(info.audio.formats).toContain("mp3");
      expect(info.audio.formats).toContain("wav");
      expect(info.image.formats).toContain("png");
      expect(info.image.formats).toContain("jpg");
    });

    test("deve incluir tamanho máximo de arquivo", () => {
      const info = processor.getSupportInfo();

      expect(info.audio.maxSize).toBe(25 * 1024 * 1024);
      expect(info.image.maxSize).toBe(20 * 1024 * 1024);
    });

    test("deve listar features disponíveis", () => {
      const info = processor.getSupportInfo();

      expect(info.audio.features).toContain("Speech-to-Text");
      expect(info.image.features).toContain("OCR");
      expect(info.image.features).toContain("Code Detection");
    });
  });

  describe("Error Handling", () => {
    test("deve lançar erro para áudio inválido", async () => {
      const audioBuffer = Buffer.from("fake audio");

      processor.transcribeAudio = async () => {
        throw new Error("Erro na transcrição");
      };

      await expect(processor.processAudio(audioBuffer, "mp3")).rejects.toThrow();
    });

    test("deve lançar erro para imagem inválida", async () => {
      const imageBuffer = Buffer.from("fake image");

      processor.analyzeImage = async () => {
        throw new Error("Erro na análise");
      };

      await expect(processor.processImage(imageBuffer, "png")).rejects.toThrow();
    });
  });
});
