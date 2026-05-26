# Referência de API — RKMMAX Híbrido

> Escopo: referência canônica ativa da API; `docs/API.md` existe apenas como stub de compatibilidade.

Todas as rotas são funções serverless em `api/`.

## Endpoints ativos

| Endpoint | Método(s) | Arquivo | Observação |
|---|---|---|---|
| `/api/health` | GET | `api/health.js` | Health check |
| `/api/chat` | POST | `api/chat.js` | Chat principal |
| `/api/ai` | POST | `api/ai.js` | Roteamento IA (Serginho/especialistas/híbrido) |
| `/api/transcribe` | POST | `api/transcribe.js` | Atualmente retorna `501 TRANSCRIPTION_NOT_AVAILABLE` |
| `/api/abnt-extract-url` | POST | `api/abnt-extract-url.js` | Extração de conteúdo ABNT |
| `/api/study-lab` | POST | `api/study-lab.js` | Ferramentas de estudo |
| `/api/checkout` | POST | `api/checkout.js` | Checkout Stripe |
| `/api/stripe-webhook` | POST | `api/stripe-webhook.js` | Webhook Stripe |
| `/api/github-oauth` | GET | `api/github-oauth.js` | Callback OAuth GitHub |
| `/api/github` | GET/POST | `api/github.js` | Integração GitHub (backend) |
| `/api/admin` | POST | `api/admin.js` | Operações administrativas |
| `/api/artifact` | POST | `api/artifact.js` | Empacotamento de artefatos |
| `/api/artifact-preview` | POST/PATCH | `api/artifact-preview.js` | Preview, revisão e exportação de artefatos |

## Garantias de transparência

- `executeArtifact` permanece desativado por decisão arquitetural.
- Não há bypass direto frontend → provider.
- Multi-provider (Groq + Gemini) permanece em estabilização sob orquestração do Serginho.

## Referências

- [../README.md](../README.md)
- [architecture.md](architecture.md)
- [deployment.md](deployment.md)
