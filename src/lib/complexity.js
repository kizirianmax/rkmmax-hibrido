// src/lib/complexity.js
// Heurística simples: decide quando subir pro modelo "full"
export function needsFullModel(prompt = "", opts = {}) {
  const text = `${prompt} ${opts?.system || ""} ${
    (opts?.history || []).map((h) => h.content).join(" ") || ""
  }`.toLowerCase();

  const hardSignals = [
    "análise jurídica",
    "parecer jurídico",
    "prova matemática",
    "demonstre",
    "complexidade",
    "otimize este código",
    "arquitetura",
    "plano de negócios",
    "projeção financeira",
    "explica em detalhes",
    "passo a passo avançado",
    "pesquisa acadêmica",
    "citar fontes",
    "tese",
    "modelagem estatística",
    "derivada",
    "integral",
    "transformada",
    "pseudocódigo",
    "benchmark",
    "segurança da informação",
    "vulnerabilidade",
  ];

  const long = text.length > 1200; // muito conteúdo
  const hasCode = /```|function|class|import|SELECT |INSERT |UPDATE |curl |-H /.test(text);
  const manyQuestions = (text.match(/\?/g) || []).length >= 4;
  const hard = hardSignals.some((w) => text.includes(w));

  return long || hasCode || manyQuestions || hard;
}
