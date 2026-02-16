/**
 * API Integration Tests (Enterprise)
 * Basic validation tests for aiAdapter-based API endpoints
 */
import { jest } from '@jest/globals';

describe('API Integration Tests (Enterprise)', () => {
  beforeEach(() => {
    // Setup if needed
  });

  describe('API Endpoints - Basic Structure', () => {
    test('API endpoints exist and are importable', async () => {
      // Test that APIs can be imported
      const aiModule = await import('../ai.js');
      const transcribeModule = await import('../transcribe.js');
      
      expect(aiModule.default).toBeDefined();
      expect(typeof aiModule.default).toBe('function');
      expect(transcribeModule).toBeDefined();
    });
  });

  describe('AI API - CORS and Methods', () => {
    test('ai.js uses aiAdapter imports', async () => {
      const fs = await import('fs/promises');
      const content = await fs.readFile('./api/ai.js', 'utf8');
      
      // Verify aiAdapter imports
      expect(content).toContain('from "../src/utils/aiAdapter.js"');
      expect(content).toContain('askAI');
      expect(content).toContain('analyzeCode');
      expect(content).toContain('complexTask');
      
      // Verify NO direct provider references
      expect(content).not.toContain('llama-3.3-70b');
      expect(content).not.toContain('mixtral-8x7b');
      expect(content).not.toContain('gpt-oss-120b');
      expect(content).not.toContain('api.groq.com/openai/v1/chat');
    });

    test('ai.js has standardized error handling', async () => {
      const fs = await import('fs/promises');
      const content = await fs.readFile('./api/ai.js', 'utf8');
      
      // Verify error handling
      expect(content).toContain('Circuit breaker');
      expect(content).toContain('Timeout');
      expect(content).toContain('All providers failed');
      expect(content).toContain('503'); // Service unavailable
      expect(content).toContain('504'); // Gateway timeout
    });

    test('ai.js does not expose provider in responses', async () => {
      const fs = await import('fs/promises');
      const content = await fs.readFile('./api/ai.js', 'utf8');
      
      // Check that responses don't include provider field
      const responseBlocks = content.match(/return res\.status\(200\)\.json\({[\s\S]*?\}\);/g) || [];
      
      responseBlocks.forEach(block => {
        // Should not have 'provider:' in successful responses
        expect(block).not.toContain('provider:');
        expect(block).not.toContain('model:');
      });
    });
  });

  describe('Transcribe API - aiAdapter Integration', () => {
    test('transcribe.js uses aiAdapter imports', async () => {
      const fs = await import('fs/promises');
      const content = await fs.readFile('./api/transcribe.js', 'utf8');
      
      // Verify aiAdapter imports
      expect(content).toContain('from "../src/utils/aiAdapter.js"');
      expect(content).toContain('simpleQuery');
      expect(content).toContain('askAI');
      
      // Verify NO direct Gemini/Groq API calls
      expect(content).not.toContain('generativelanguage.googleapis.com');
      expect(content).not.toContain('api.groq.com/openai/v1/audio');
      expect(content).not.toContain('gemini-2.0-flash');
      expect(content).not.toContain('whisper-large-v3');
    });

    test('transcribe.js has standardized error handling', async () => {
      const fs = await import('fs/promises');
      const content = await fs.readFile('./api/transcribe.js', 'utf8');
      
      // Verify error handling
      expect(content).toContain('Circuit breaker');
      expect(content).toContain('Timeout');
      expect(content).toContain('All providers failed');
      expect(content).toContain('503'); // Service unavailable
      expect(content).toContain('504'); // Gateway timeout
    });
  });

  describe('Response Format Standardization', () => {
    test('all migrated APIs have consistent response structure', async () => {
      const fs = await import('fs/promises');
      
      // Check ai.js
      const aiContent = await fs.readFile('./api/ai.js', 'utf8');
      expect(aiContent).toContain('response:');
      expect(aiContent).toContain('confidence:');
      expect(aiContent).toContain('metadata:');
      
      // Check transcribe.js
      const transcribeContent = await fs.readFile('./api/transcribe.js', 'utf8');
      expect(transcribeContent).toContain('success:');
      expect(transcribeContent).toContain('transcript:');
    });

    test('no API exposes provider names in code', async () => {
      const fs = await import('fs/promises');
      
      const aiContent = await fs.readFile('./api/ai.js', 'utf8');
      const transcribeContent = await fs.readFile('./api/transcribe.js', 'utf8');
      
      // Check for provider names in response objects (not in comments)
      const codeOnlyAi = aiContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
      const codeOnlyTranscribe = transcribeContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
      
      // These should not appear in actual code (only in comments is OK)
      expect(codeOnlyAi.match(/provider:\s*["']groq["']/)).toBeNull();
      expect(codeOnlyAi.match(/model:\s*["']kizi-/)).toBeNull();
      expect(codeOnlyTranscribe.match(/provider:\s*["']/)).toBeNull();
    });
  });

  describe('aiAdapter Coverage', () => {
    test('ai.js uses all aiAdapter functions appropriately', async () => {
      const fs = await import('fs/promises');
      const content = await fs.readFile('./api/ai.js', 'utf8');
      
      // Verify usage of aiAdapter functions
      expect(content).toContain('await askAI(');
      expect(content).toContain('await analyzeCode(');
      expect(content).toContain('await complexTask(');
    });

    test('transcribe.js uses aiAdapter for transcription', async () => {
      const fs = await import('fs/promises');
      const content = await fs.readFile('./api/transcribe.js', 'utf8');
      
      // Verify transcription uses aiAdapter
      expect(content).toContain('await simpleQuery(');
      expect(content).toContain('await askAI(');
    });
  });

  describe('Enterprise Features', () => {
    test('APIs have circuit breaker awareness', async () => {
      const fs = await import('fs/promises');
      
      const apis = ['ai.js', 'transcribe.js'];
      
      for (const api of apis) {
        const content = await fs.readFile(`./api/${api}`, 'utf8');
        expect(content).toContain('Circuit breaker');
        expect(content).toContain('retryAfter');
      }
    });

    test('APIs have timeout protection awareness', async () => {
      const fs = await import('fs/promises');
      
      const apis = ['ai.js', 'transcribe.js'];
      
      for (const api of apis) {
        const content = await fs.readFile(`./api/${api}`, 'utf8');
        expect(content).toContain('Timeout');
        expect(content).toContain('maxTimeout');
      }
    });

    test('APIs have enterprise-grade documentation', async () => {
      const fs = await import('fs/promises');
      
      const aiContent = await fs.readFile('./api/ai.js', 'utf8');
      expect(aiContent).toContain('Enterprise-grade');
      expect(aiContent).toContain('aiAdapter');
      expect(aiContent).toContain('Circuit breaker protection');
      
      const transcribeContent = await fs.readFile('./api/transcribe.js', 'utf8');
      expect(transcribeContent).toContain('Enterprise-grade');
      expect(transcribeContent).toContain('aiAdapter');
    });
  });
});

