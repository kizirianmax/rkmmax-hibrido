/**
 * MULTIMODAL PROCESSOR
 * Processa entrada multimodal: Voz (Speech-to-Text) e Imagem (Vision)
 * Suporta: MP3, WAV, MP4, WebM, PNG, JPG, GIF, WebP
 */

class MultimodalProcessor {
  constructor() {
    this.supportedAudioFormats = ["mp3", "wav", "mp4", "webm", "ogg", "m4a"];
    this.supportedImageFormats = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];
    this.maxAudioSize = 25 * 1024 * 1024; // 25MB
    this.maxImageSize = 20 * 1024 * 1024; // 20MB
  }

  /**
   * Processar áudio (Speech-to-Text)
   */
  async processAudio(audioBuffer, format = "mp3") {
    console.log(`🎤 Processando áudio (${format})...`);

    // Validar formato
    if (!this.supportedAudioFormats.includes(format.toLowerCase())) {
      throw new Error(`Formato de áudio não suportado: ${format}`);
    }

    // Validar tamanho
    if (audioBuffer.length > this.maxAudioSize) {
      throw new Error(`Arquivo de áudio muito grande: ${audioBuffer.length} bytes`);
    }

    try {
      // Chamar API de Speech-to-Text (Google Cloud Speech-to-Text)
      const transcript = await this.transcribeAudio(audioBuffer, format);

      console.log(`✅ Áudio transcrito: "${transcript.substring(0, 50)}..."`);

      return {
        type: "audio",
        format,
        transcript,
        confidence: 0.95, // Confiança estimada
        duration: await this.estimateAudioDuration(audioBuffer, format),
      };
    } catch (error) {
      throw new Error(`Erro ao processar áudio: ${error.message}`);
    }
  }

  /**
   * Transcrever áudio via API
   */
  async transcribeAudio(audioBuffer, format) {
    try {
      // Converter buffer para base64
      const base64Audio = audioBuffer.toString("base64");

      // Chamar API de transcription (simulado)
      // Em produção, usar Google Cloud Speech-to-Text ou similar

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64Audio,
          format,
          language: "pt-BR",
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na transcrição: ${response.status}`);
      }

      const data = await response.json();
      return data.transcript;
    } catch (error) {
      // Fallback: retornar mensagem de erro
      throw error;
    }
  }

  /**
   * Estimar duração do áudio
   */
  async estimateAudioDuration(audioBuffer, format) {
    // Estimativa simples baseada no tamanho
    // Em produção, usar biblioteca de áudio
    const bitrate = 128; // kbps
    const durationSeconds = (audioBuffer.length * 8) / (bitrate * 1000);
    return Math.round(durationSeconds);
  }

  /**
   * Processar imagem (Vision)
   */
  async processImage(imageBuffer, format = "png") {
    console.log(`📸 Processando imagem (${format})...`);

    // Validar formato
    if (!this.supportedImageFormats.includes(format.toLowerCase())) {
      throw new Error(`Formato de imagem não suportado: ${format}`);
    }

    // Validar tamanho
    if (imageBuffer.length > this.maxImageSize) {
      throw new Error(`Arquivo de imagem muito grande: ${imageBuffer.length} bytes`);
    }

    try {
      // Analisar imagem
      const analysis = await this.analyzeImage(imageBuffer, format);

      console.log(`✅ Imagem analisada: ${analysis.description}`);

      return {
        type: "image",
        format,
        analysis,
        size: imageBuffer.length,
      };
    } catch (error) {
      throw new Error(`Erro ao processar imagem: ${error.message}`);
    }
  }

  /**
   * Analisar imagem via API
   */
  async analyzeImage(imageBuffer, format) {
    try {
      // Converter buffer para base64
      const base64Image = imageBuffer.toString("base64");

      // Chamar API de Vision (simulado)
      // Em produção, usar Google Cloud Vision ou similar

      const response = await fetch("/api/vision-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          format,
          features: [
            "LABEL_DETECTION",
            "TEXT_DETECTION",
            "OBJECT_LOCALIZATION",
            "SAFE_SEARCH_DETECTION",
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na análise: ${response.status}`);
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Processar entrada multimodal (áudio + imagem)
   */
  async processMultimodal(inputs) {
    console.log(`🎬 Processando entrada multimodal...`);

    const results = {
      audio: null,
      image: null,
      combined: null,
    };

    // Processar áudio se fornecido
    if (inputs.audio) {
      results.audio = await this.processAudio(inputs.audio.buffer, inputs.audio.format);
    }

    // Processar imagem se fornecida
    if (inputs.image) {
      results.image = await this.processImage(inputs.image.buffer, inputs.image.format);
    }

    // Combinar resultados
    if (results.audio && results.image) {
      results.combined = this.combineResults(results.audio, results.image);
    }

    return results;
  }

  /**
   * Combinar resultados de áudio e imagem
   */
  combineResults(audioResult, imageResult) {
    return {
      transcript: audioResult.transcript,
      imageAnalysis: imageResult.analysis,
      combinedContext: `Áudio: "${audioResult.transcript}"\n\nImagem: ${imageResult.analysis.description}`,
      confidence: {
        audio: audioResult.confidence,
        image: imageResult.analysis.confidence || 0.9,
      },
    };
  }

  /**
   * Extrair texto de imagem (OCR)
   */
  async extractTextFromImage(imageBuffer, format = "png") {
    console.log(`📄 Extraindo texto da imagem...`);

    const analysis = await this.analyzeImage(imageBuffer, format);

    if (analysis.textDetection && analysis.textDetection.length > 0) {
      const extractedText = analysis.textDetection.map((item) => item.text).join("\n");

      return {
        success: true,
        text: extractedText,
        confidence: analysis.textDetection[0].confidence || 0.9,
      };
    }

    return {
      success: false,
      text: "",
      message: "Nenhum texto encontrado na imagem",
    };
  }

  /**
   * Descrever imagem
   */
  async describeImage(imageBuffer, format = "png") {
    console.log(`📸 Descrevendo imagem...`);

    const analysis = await this.analyzeImage(imageBuffer, format);

    return {
      description: analysis.description,
      labels: analysis.labels || [],
      objects: analysis.objects || [],
      confidence: analysis.confidence || 0.9,
    };
  }

  /**
   * Detectar código em imagem
   */
  async detectCodeInImage(imageBuffer, format = "png") {
    console.log(`💻 Detectando código na imagem...`);

    const textResult = await this.extractTextFromImage(imageBuffer, format);

    if (!textResult.success) {
      return {
        success: false,
        code: "",
        language: null,
      };
    }

    // Detectar linguagem de programação
    const language = this.detectProgrammingLanguage(textResult.text);

    return {
      success: true,
      code: textResult.text,
      language,
      confidence: textResult.confidence,
    };
  }

  /**
   * Detectar linguagem de programação
   */
  detectProgrammingLanguage(code) {
    const patterns = {
      java: /public class|public static|import java/,
      javascript: /const|let|var|function|=>|async|await/,
      python: /def |import |if __name__|print\(/,
      cpp: /#include|std::|int main/,
      csharp: /using|namespace|public class|async Task/,
      go: /package main|func|import/,
      rust: /fn |let |pub |impl /,
      sql: /SELECT|INSERT|UPDATE|DELETE|FROM|WHERE/,
      html: /<!DOCTYPE|<html|<body|<div/,
      css: /@media|\.class|#id|{.*:.*;}/,
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(code)) {
        return lang;
      }
    }

    return null;
  }

  /**
   * Validar arquivo de áudio
   */
  validateAudioFile(filename, size) {
    const ext = filename.split(".").pop().toLowerCase();

    if (!this.supportedAudioFormats.includes(ext)) {
      return {
        valid: false,
        error: `Formato não suportado: ${ext}`,
      };
    }

    if (size > this.maxAudioSize) {
      return {
        valid: false,
        error: `Arquivo muito grande: ${size} bytes (máximo: ${this.maxAudioSize})`,
      };
    }

    return { valid: true };
  }

  /**
   * Validar arquivo de imagem
   */
  validateImageFile(filename, size) {
    const ext = filename.split(".").pop().toLowerCase();

    if (!this.supportedImageFormats.includes(ext)) {
      return {
        valid: false,
        error: `Formato não suportado: ${ext}`,
      };
    }

    if (size > this.maxImageSize) {
      return {
        valid: false,
        error: `Arquivo muito grande: ${size} bytes (máximo: ${this.maxImageSize})`,
      };
    }

    return { valid: true };
  }

  /**
   * Obter informações de suporte
   */
  getSupportInfo() {
    return {
      audio: {
        formats: this.supportedAudioFormats,
        maxSize: this.maxAudioSize,
        features: ["Speech-to-Text", "Transcription", "Language Detection"],
      },
      image: {
        formats: this.supportedImageFormats,
        maxSize: this.maxImageSize,
        features: ["OCR", "Object Detection", "Label Detection", "Code Detection"],
      },
    };
  }
}

export default MultimodalProcessor;
