⚠️ POLÍTICA DE DESENVOLVIMENTO - Este é um projeto individual desenvolvido por @kizirianmax. Regra absoluta: Todo merge na branch main é feito APENAS com todos os testes passando (CI verde). Veja detalhes completos em DEVELOPMENT_GUIDELINES.md

# RKMMAX HÍBRIDO - Betinho Híbrido

Sistema inteligente com agentes de IA integrados.

## 🤖 Inteligência Artificial

O Betinho Híbrido usa **Groq** como provedor de IA:

### Modelos Configurados

| Modelo | Parâmetros | Uso | Custo |
|--------|-----------|-----|-------|
| `openai/gpt-oss-120b` | 120B | **Principal** - Raciocínio complexo | $0.00027/1K tokens |
| `llama-3.3-70b-versatile` | 70B | **Fallback** - Respostas rápidas | $0.00015/1K tokens |

### Fallback Automático

Se o modelo principal (120B) falhar por qualquer motivo:
- ✅ Sistema tenta automaticamente o fallback (70B)
- ✅ Resposta continua funcionando
- ✅ Usuário não percebe a diferença

## 📦 Configuração

Para configurar o sistema, adicione a variável de ambiente:

```bash
GROQ_API_KEY=your_groq_api_key_here
```