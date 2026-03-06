/**
 * STUDY LAB AI SERVICE
 * 
 * Serviço centralizado de IA para todas as ferramentas do Study Lab.
 * Usa a API do Gemini para gerar conteúdo de alta qualidade.
 */

const GEMINI_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

class StudyLabAI {
  constructor() {
    this.apiKey = GEMINI_API_KEY;
    this.cache = new Map();
  }

  /**
   * Chamar API do Gemini
   */
  async callGemini(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('API Key do Gemini não configurada');
    }

    // Verificar cache
    const cacheKey = `${prompt.slice(0, 100)}:${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: options.maxTokens || 2048,
            temperature: options.temperature || 0.7,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro na API do Gemini');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Cachear resultado
      this.cache.set(cacheKey, text);
      if (this.cache.size > 100) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return text;
    } catch (error) {
      console.error('Erro ao chamar Gemini:', error);
      throw error;
    }
  }

  /**
   * GERADOR DE RESUMOS
   */
  async gerarResumo(texto, estilo = 'academico', tamanho = 'medio') {
    const tamanhoConfig = {
      curto: '100-150 palavras',
      medio: '200-300 palavras',
      longo: '400-500 palavras',
      detalhado: '600-800 palavras'
    };

    const estiloConfig = {
      academico: 'Escreva em linguagem acadêmica formal, com introdução, desenvolvimento e conclusão. Use conectivos adequados e mantenha objetividade.',
      bullet: 'Organize em tópicos com bullet points. Cada tópico deve ser claro e conciso. Agrupe informações relacionadas.',
      mapa: 'Estruture como um mapa mental textual com tema central, subtemas e detalhes. Use indentação para hierarquia.',
      fichamento: 'Faça um fichamento acadêmico com: Referência, Citações importantes, Palavras-chave, Resumo crítico.',
      esquema: 'Crie um esquema estruturado com numeração (1, 1.1, 1.2, 2, etc). Ideal para revisão rápida.'
    };

    const prompt = `Você é um especialista em síntese de conteúdo acadêmico. Analise o texto abaixo e crie um resumo de alta qualidade.

TEXTO ORIGINAL:
${texto}

INSTRUÇÕES:
- Tamanho: ${tamanhoConfig[tamanho]}
- Estilo: ${estiloConfig[estilo]}
- Mantenha as informações mais importantes
- Preserve termos técnicos e conceitos-chave
- Seja preciso e objetivo
- Não invente informações que não estão no texto

FORMATO DE RESPOSTA:
Retorne APENAS o resumo, sem explicações adicionais.`;

    const resumo = await this.callGemini(prompt, { maxTokens: 1500, temperature: 0.3 });
    
    // Extrair palavras-chave
    const palavrasChave = await this.extrairPalavrasChave(texto);

    return {
      resumo,
      palavrasChave,
      estatisticas: {
        palavrasOriginal: texto.split(/\s+/).length,
        palavrasResumo: resumo.split(/\s+/).length,
        reducao: Math.round((1 - resumo.split(/\s+/).length / texto.split(/\s+/).length) * 100)
      }
    };
  }

  /**
   * Extrair palavras-chave
   */
  async extrairPalavrasChave(texto) {
    const prompt = `Extraia as 8 palavras-chave mais importantes do texto abaixo. Retorne apenas as palavras separadas por vírgula, sem explicações.

TEXTO:
${texto.slice(0, 3000)}

PALAVRAS-CHAVE:`;

    const resultado = await this.callGemini(prompt, { maxTokens: 100, temperature: 0.2 });
    return resultado.split(',').map(p => p.trim()).filter(p => p.length > 0);
  }

  /**
   * GERADOR DE FLASHCARDS
   */
  async gerarFlashcards(texto, quantidade = 10) {
    const prompt = `Você é um especialista em educação e memorização. Crie ${quantidade} flashcards de alta qualidade baseados no texto abaixo.

TEXTO:
${texto}

INSTRUÇÕES:
- Crie perguntas que testem compreensão, não apenas memorização
- Varie os tipos de pergunta (conceito, aplicação, análise, comparação)
- As respostas devem ser completas mas concisas
- Inclua perguntas de diferentes níveis de dificuldade
- Foque nos conceitos mais importantes

FORMATO DE RESPOSTA (JSON):
[
  {"pergunta": "...", "resposta": "...", "dificuldade": "facil|medio|dificil"},
  ...
]

Retorne APENAS o JSON, sem explicações.`;

    const resultado = await this.callGemini(prompt, { maxTokens: 2000, temperature: 0.5 });
    
    try {
      // Limpar o resultado e extrair JSON
      const jsonMatch = resultado.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('JSON não encontrado');
    } catch (e) {
      console.error('Erro ao parsear flashcards:', e);
      // Fallback: criar flashcards básicos
      return this.criarFlashcardsFallback(texto, quantidade);
    }
  }

  criarFlashcardsFallback(texto, quantidade) {
    const frases = texto.split(/[.!?]+/).filter(f => f.trim().length > 20);
    const flashcards = [];
    
    for (let i = 0; i < Math.min(quantidade, frases.length); i++) {
      const frase = frases[i].trim();
      flashcards.push({
        pergunta: `Explique o seguinte conceito: "${frase.slice(0, 50)}..."`,
        resposta: frase,
        dificuldade: 'medio'
      });
    }
    
    return flashcards;
  }

  /**
   * GERADOR DE MAPAS MENTAIS
   */
  async gerarMapaMental(texto, temaCentral) {
    const prompt = `Você é um especialista em organização de conhecimento. Analise o texto e crie a estrutura de um mapa mental.

TEMA CENTRAL: ${temaCentral}

TEXTO:
${texto}

INSTRUÇÕES:
- Identifique 4-6 ramos principais (conceitos mais importantes)
- Para cada ramo, identifique 2-4 subtópicos
- Use palavras-chave, não frases longas
- Mantenha hierarquia lógica
- Agrupe conceitos relacionados

FORMATO DE RESPOSTA (JSON):
{
  "centro": "${temaCentral}",
  "ramos": [
    {
      "titulo": "Conceito Principal 1",
      "subtopicos": ["Subtópico A", "Subtópico B", "Subtópico C"]
    },
    ...
  ]
}

Retorne APENAS o JSON, sem explicações.`;

    const resultado = await this.callGemini(prompt, { maxTokens: 1500, temperature: 0.4 });
    
    try {
      const jsonMatch = resultado.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('JSON não encontrado');
    } catch (e) {
      console.error('Erro ao parsear mapa mental:', e);
      return this.criarMapaFallback(texto, temaCentral);
    }
  }

  criarMapaFallback(texto, temaCentral) {
    const palavras = texto.toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4);
    
    const frequency = {};
    palavras.forEach(w => frequency[w] = (frequency[w] || 0) + 1);
    
    const topWords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
    
    const ramos = [];
    for (let i = 0; i < 4; i++) {
      ramos.push({
        titulo: topWords[i * 4] || `Conceito ${i + 1}`,
        subtopicos: topWords.slice(i * 4 + 1, i * 4 + 4)
      });
    }
    
    return { centro: temaCentral, ramos };
  }

  /**
   * GERADOR DE CRONOGRAMAS
   */
  async gerarCronograma(config) {
    const { objetivo, tipoObjetivo, dataLimite, materias, diasDisponiveis, horasPorDia, observacoes } = config;

    const prompt = `Você é um especialista em planejamento de estudos. Crie um cronograma otimizado.

OBJETIVO: ${objetivo}
TIPO: ${tipoObjetivo}
DATA LIMITE: ${dataLimite}
MATÉRIAS: ${materias.map(m => `${m.nome} (${m.prioridade})`).join(', ')}
DIAS DISPONÍVEIS: ${diasDisponiveis.join(', ')}
HORAS POR DIA: ${horasPorDia}
OBSERVAÇÕES: ${observacoes || 'Nenhuma'}

INSTRUÇÕES:
- Distribua as matérias de forma equilibrada
- Priorize matérias com prioridade "alta"
- Alterne entre teoria e exercícios
- Inclua tempo para revisão
- Considere a curva de esquecimento
- Blocos de estudo de 25-50 minutos

FORMATO DE RESPOSTA (JSON):
{
  "semanas": [
    {
      "numero": 1,
      "dias": [
        {
          "dia": "Segunda",
          "blocos": [
            {"materia": "...", "duracao": "1h", "tipo": "teoria|exercicios|revisao"}
          ]
        }
      ]
    }
  ],
  "dicas": ["Dica 1", "Dica 2", ...],
  "metasSemana": ["Meta 1", "Meta 2", ...]
}

Retorne APENAS o JSON.`;

    const resultado = await this.callGemini(prompt, { maxTokens: 3000, temperature: 0.5 });
    
    try {
      const jsonMatch = resultado.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('JSON não encontrado');
    } catch (e) {
      console.error('Erro ao parsear cronograma:', e);
      return this.criarCronogramaFallback(config);
    }
  }

  criarCronogramaFallback(config) {
    const { materias, diasDisponiveis, horasPorDia } = config;
    const minutosTotal = horasPorDia * 60;
    const blocosPorDia = Math.floor(minutosTotal / 30);
    
    const semanas = [];
    for (let s = 0; s < 4; s++) {
      const dias = [];
      diasDisponiveis.forEach(dia => {
        const blocos = [];
        let materiaIndex = 0;
        
        for (let b = 0; b < blocosPorDia && materiaIndex < materias.length; b++) {
          const materia = materias[materiaIndex % materias.length];
          blocos.push({
            materia: materia.nome,
            duracao: '30min',
            tipo: b % 3 === 0 ? 'teoria' : b % 3 === 1 ? 'exercicios' : 'revisao'
          });
          materiaIndex++;
        }
        
        dias.push({ dia, blocos });
      });
      
      semanas.push({ numero: s + 1, dias });
    }
    
    return {
      semanas,
      dicas: [
        'Faça pausas de 5-10 minutos entre os blocos',
        'Revise o conteúdo do dia anterior',
        'Pratique exercícios regularmente'
      ],
      metasSemana: materias.map(m => `Dominar conceitos básicos de ${m.nome}`)
    };
  }

  /**
   * VALIDADOR DE FONTES (SOURCE-PROOF)
   */
  async validarFonte(url) {
    // Fontes acadêmicas conhecidas
    const fontesAcademicas = {
      alta: [
        'scielo', 'pubmed', 'scholar.google', 'doi.org', 'jstor', 'springer',
        'wiley', 'elsevier', 'nature.com', 'science.org', 'ieee.org',
        '.gov.br', '.gov', '.edu', '.edu.br', 'periodicos.capes'
      ],
      media: [
        'wikipedia', 'britannica', 'infopedia', 'infoescola', 'mundoeducacao',
        'brasilescola', 'todamateria', 'khanacademy'
      ],
      baixa: [
        'brainly', 'yahoo.respostas', 'answers.yahoo', 'quora', 'reddit',
        'blogspot', 'wordpress.com', 'medium.com', 'linkedin.com/pulse'
      ]
    };

    const urlLower = url.toLowerCase();
    
    // Verificar credibilidade
    let credibilidade = 'media';
    let motivo = 'Fonte não reconhecida automaticamente';
    let sugestoes = [];

    for (const fonte of fontesAcademicas.alta) {
      if (urlLower.includes(fonte)) {
        credibilidade = 'alta';
        motivo = `Fonte acadêmica reconhecida (${fonte})`;
        break;
      }
    }

    if (credibilidade === 'media') {
      for (const fonte of fontesAcademicas.baixa) {
        if (urlLower.includes(fonte)) {
          credibilidade = 'baixa';
          motivo = `Fonte não recomendada para trabalhos acadêmicos (${fonte})`;
          sugestoes = [
            'Busque a informação em fontes primárias',
            'Use Google Scholar para encontrar artigos científicos',
            'Consulte bases como SciELO ou Periódicos CAPES'
          ];
          break;
        }
      }
    }

    // Verificar se é artigo científico
    if (urlLower.includes('doi.org') || urlLower.includes('/article/') || urlLower.includes('/paper/')) {
      credibilidade = 'alta';
      motivo = 'Artigo científico identificado';
    }

    return {
      url,
      credibilidade,
      motivo,
      sugestoes,
      verificadoEm: new Date().toISOString()
    };
  }

  /**
   * Analisar múltiplas fontes de um texto
   */
  async analisarFontes(texto) {
    // Extrair URLs do texto
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
    const urls = texto.match(urlRegex) || [];
    
    const resultados = await Promise.all(
      urls.map(url => this.validarFonte(url))
    );
    
    const resumo = {
      total: resultados.length,
      alta: resultados.filter(r => r.credibilidade === 'alta').length,
      media: resultados.filter(r => r.credibilidade === 'media').length,
      baixa: resultados.filter(r => r.credibilidade === 'baixa').length
    };
    
    return { fontes: resultados, resumo };
  }

  /**
   * Limpar cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Exportar instância única
export const studyLabAI = new StudyLabAI();
export default StudyLabAI;
