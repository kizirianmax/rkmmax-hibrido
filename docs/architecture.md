# Arquitetura do Sistema RKMMAX Híbrido

> Escopo: documento canônico de arquitetura ativa; `docs/ARCHITECTURE.md` existe apenas como stub de compatibilidade.

## Visão Geral

A arquitetura ativa do projeto está organizada em **3 camadas**:

1. **Orquestração soberana (Serginho)** — `api/lib/serginho-orchestrator.js`
2. **Especialistas de domínio** — `src/config/specialists.js`
3. **Construtor/Híbrido (pipeline de artefatos)** — `src/lib/construtor/*` e endpoints de artefato

```text
Frontend React (Vite)
        │
        ▼
API Serverless (/api)
        │
        ▼
Serginho (orquestrador soberano)
   ├── Especialistas
   └── Construtor/Híbrido
        └── Pipeline: gerar → empacotar → validar → preview → revisar → aprovar/rejeitar → exportar
```

## Invariantes arquiteturais

- **Sem bypass do Serginho:** chamadas para providers passam pela orquestração soberana.
- **Multi-provider em estabilização:** Groq + Gemini ativos; prioridade definida em `src/config/modelPriority.js`.
- **`executeArtifact` desativado:** não há execução automática habilitada em produção.
- **ABNT em operação paralela:** existe também no repositório dedicado `formatador-abnt`.

## Referências

- [../README.md](../README.md)
- [AGENTS.md](AGENTS.md)
- [SPECIALISTS.md](SPECIALISTS.md)
- [api.md](api.md)
