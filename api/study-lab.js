/**
 * STUDY LAB ENDPOINT — backend Groq (studyLabClient), server-side
 *
 * Centraliza todas as ferramentas do Study Lab.
 * Nenhuma chave de API é exposta ao frontend.
 * Todas as chamadas de IA passam pelo gateway serginho-orchestrator.js.
 *
 * Tools disponíveis (via body.tool):
 *   - resumo       → gerarResumo(texto, estilo, tamanho)
 *   - flashcards   → gerarFlashcards(texto, quantidade)
 *   - mapa-mental  → gerarMapaMental(texto, temaCentral)
 *   - cronograma   → gerarCronograma(config)
 *   - source-proof → analisarFontes(urls)
 *
 * Request: POST /api/study-lab
 * Body: { tool: string, ...params }
 *
 * Response: { success: true, data: any }
 * Error:    { success: false, error: string }
 */

import serginho from "./lib/serginho-orchestrator.js";

async function callAI(systemPrompt, userPrompt) {
  const result = await serginho.handleRequest({
    message: userPrompt,
    context: { systemPrompt },
    options: {},
  });
  return result.text || "";
}

// ─── TOOLS ──────────────────────────────────────────────────────────────────

async function gerarResumo(texto, estilo = "academico", tamanho = "medio") {
  const tamanhoConfig = {
    curto: "150-250 palavras",
    medio: "300-500 palavras",
    longo: "600-900 palavras",
  };
  const estiloConfig = {
    academico: "formal, objetivo, com terminologia técnica",
    simples: "linguagem acessível, sem jargões, fácil de entender",
    bullet: "em tópicos/bullets, destacando pontos principais",
    fichamento: "fichamento acadêmico com: Referência, Citações importantes, Palavras-chave, Resumo crítico",
  };

  const system = "Você é um especialista em síntese de conteúdo acadêmico. Retorne APENAS o resumo solicitado, sem explicações adicionais.";
  const user = `Analise o texto abaixo e crie um resumo de alta qualidade.

TEXTO ORIGINAL:
${texto.slice(0, 6000)}

INSTRUÇÕES:
- Tamanho: ${tamanhoConfig[tamanho] || tamanhoConfig.medio}
- Estilo: ${estiloConfig[estilo] || estiloConfig.academico}
- Mantenha as informações mais importantes
- Preserve termos técnicos e conceitos-chave
- Seja preciso e objetivo
- Não invente informações que não estão no texto

Retorne APENAS o resumo.`;

  const resumo = await callAI(system, user);

  // Extrair palavras-chave em chamada separada
  const kwSystem = "Você extrai palavras-chave de textos acadêmicos. Retorne APENAS as palavras separadas por vírgula, sem explicações.";
  const kwUser = `Extraia as 8 palavras-chave mais importantes do texto abaixo.\n\nTEXTO:\n${texto.slice(0, 3000)}\n\nPALAVRAS-CHAVE:`;
  const kwResult = await callAI(kwSystem, kwUser);
  const palavrasChave = kwResult.split(",").map((p) => p.trim()).filter((p) => p.length > 0);

  return {
    resumo,
    palavrasChave,
    estatisticas: {
      palavrasOriginal: texto.split(/\s+/).length,
      palavrasResumo: resumo.split(/\s+/).length,
      reducao: Math.round((1 - resumo.split(/\s+/).length / texto.split(/\s+/).length) * 100),
    },
  };
}

async function gerarFlashcards(texto, quantidade = 10) {
  const system = "Você é um especialista em educação e memorização. Retorne APENAS JSON válido, sem explicações.";
  const user = `Crie ${quantidade} flashcards de alta qualidade baseados no texto abaixo.

TEXTO:
${texto.slice(0, 5000)}

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

Retorne APENAS o JSON.`;

  const resultado = await callAI(system, user);

  try {
    const jsonMatch = resultado.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("JSON não encontrado");
  } catch {
    // Fallback determinístico sem IA
    const frases = texto.split(/[.!?]+/).filter((f) => f.trim().length > 20);
    return frases.slice(0, quantidade).map((frase, i) => ({
      pergunta: `Explique: "${frase.trim().slice(0, 60)}..."`,
      resposta: frase.trim(),
      dificuldade: ["facil", "medio", "dificil"][i % 3],
    }));
  }
}

async function gerarMapaMental(texto, temaCentral) {
  const system = "Você é um especialista em organização de conhecimento. Retorne APENAS JSON válido, sem explicações.";
  const user = `Analise o texto e crie a estrutura de um mapa mental.

TEMA CENTRAL: ${temaCentral}
TEXTO:
${texto.slice(0, 5000)}

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
    }
  ]
}

Retorne APENAS o JSON.`;

  const resultado = await callAI(system, user);

  try {
    const jsonMatch = resultado.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("JSON não encontrado");
  } catch {
    // Fallback determinístico
    const palavras = texto
      .toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 4);
    const freq = {};
    palavras.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
    const top = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
    return {
      centro: temaCentral,
      ramos: [0, 1, 2, 3].map((i) => ({
        titulo: top[i * 4] || `Conceito ${i + 1}`,
        subtopicos: top.slice(i * 4 + 1, i * 4 + 4),
      })),
    };
  }
}

async function gerarCronograma(config) {
  const { materia, dataProva, horasPorDia, topicos } = config;
  const system = "Você é um especialista em planejamento de estudos acadêmicos. Retorne APENAS JSON válido.";
  const user = `Crie um cronograma de estudos detalhado.

MATÉRIA: ${materia}
DATA DA PROVA: ${dataProva}
HORAS POR DIA: ${horasPorDia}
TÓPICOS: ${topicos?.join(", ") || "Conteúdo geral da matéria"}

INSTRUÇÕES:
- Distribua os tópicos de forma equilibrada
- Inclua revisões periódicas
- Reserve os últimos dias para revisão geral
- Alterne teoria, exercícios e revisão
- Seja realista com o tempo disponível

FORMATO DE RESPOSTA (JSON):
{
  "cronograma": [
    {
      "data": "DD/MM",
      "dia": "Segunda-feira",
      "atividades": [
        {"horario": "HH:MM-HH:MM", "topico": "...", "tipo": "teoria|exercicios|revisao", "duracao": 60}
      ]
    }
  ],
  "resumo": {"totalHoras": 0, "diasEstudo": 0, "topicosAbordados": []}
}

Retorne APENAS o JSON.`;

  const resultado = await callAI(system, user);

  try {
    const jsonMatch = resultado.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error("JSON não encontrado");
  } catch {
    return { cronograma: [], resumo: { totalHoras: 0, diasEstudo: 0, topicosAbordados: [] } };
  }
}

async function analisarFontes(urls) {
  // Validação determinística (sem IA) — igual ao original
  const ALTA = ["scielo", "pubmed", "scholar.google", "doi.org", "jstor", "springer", "wiley", "elsevier", "nature.com", "science.org", "ieee.org", "gov.br", "edu.br", ".edu", ".gov", "repositorio"];
  const MEDIA = ["wikipedia", "britannica", "infopedia", "infoescola", "mundoeducacao", "brasilescola", "todamateria", "khanacademy"];
  const BAIXA = ["brainly", "yahoo.respostas", "answers.yahoo", "quora", "reddit", "blogspot", "wordpress.com", "medium.com", "linkedin.com/pulse"];

  const resultados = urls.map((url) => {
    const u = url.toLowerCase();
    let credibilidade = "media";
    let motivo = "Fonte de credibilidade média";
    let recomendacao = "Use com cautela e verifique as informações";

    if (ALTA.some((d) => u.includes(d))) {
      credibilidade = "alta";
      motivo = "Fonte acadêmica ou governamental reconhecida";
      recomendacao = "Fonte confiável para trabalhos acadêmicos";
    } else if (BAIXA.some((d) => u.includes(d))) {
      credibilidade = "baixa";
      motivo = "Fonte colaborativa ou de baixa curadoria";
      recomendacao = "Não recomendada para trabalhos acadêmicos";
    }

    return { url, credibilidade, motivo, recomendacao };
  });

  return {
    fontes: resultados,
    resumo: {
      total: resultados.length,
      alta: resultados.filter((r) => r.credibilidade === "alta").length,
      media: resultados.filter((r) => r.credibilidade === "media").length,
      baixa: resultados.filter((r) => r.credibilidade === "baixa").length,
    },
  };
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { tool, ...params } = req.body || {};

  if (!tool) {
    return res.status(400).json({ success: false, error: "Campo 'tool' é obrigatório." });
  }

  console.log(`[STUDY-LAB] tool=${tool} via serginho-orchestrator`);

  try {
    let data;

    switch (tool) {
      case "resumo":
        data = await gerarResumo(params.texto, params.estilo, params.tamanho);
        break;
      case "flashcards":
        data = await gerarFlashcards(params.texto, params.quantidade);
        break;
      case "mapa-mental":
        data = await gerarMapaMental(params.texto, params.temaCentral);
        break;
      case "cronograma":
        data = await gerarCronograma(params.config || params);
        break;
      case "source-proof":
        data = await analisarFontes(params.urls || []);
        break;
      default:
        return res.status(400).json({ success: false, error: `Tool desconhecida: ${tool}` });
    }

    return res.status(200).json({ success: true, tool, data });
  } catch (error) {
    console.error(`[STUDY-LAB] error tool=${tool}:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro interno no servidor",
    });
  }
}
