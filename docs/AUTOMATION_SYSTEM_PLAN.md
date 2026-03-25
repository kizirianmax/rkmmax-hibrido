# 🤖 RKMMAX - Sistema de Automação Inteligente de Repositório

## 📋 Visão Geral

Sistema de automação que permite aos usuários solicitar modificações no repositório via comandos inteligentes, com Serginho (orquestrador) selecionando automaticamente o especialista mais adequado, ou permitindo seleção manual. Implementado com proteção rigorosa de segurança, protocolo de créditos diferenciado e funcionalidades multimodais.

---

## 🎯 Objetivos Principais

1. ✅ **Automação Inteligente**: Usuário digita "RKM, faz X" → Sistema executa automaticamente
2. ✅ **Proteção de Especialistas**: 54+ especialistas mantidos e funcionais
3. ✅ **Protocolo de Créditos**: Automação custa mais que IA normal
4. ✅ **Segurança Rigorosa**: Validação antes de commits
5. ✅ **Extensão GitHub**: Interagir com RKMMAX direto no GitHub
6. ✅ **Multimodal**: Voz e análise de imagens
7. ✅ **Pronto para React Native/Flutter**: Arquitetura preparada

---

## 🏗️ Arquitetura do Sistema

### 1. **Fluxo de Automação**

```
Usuário: "RKM, adiciona autenticação OAuth"
    ↓
Serginho (Orquestrador)
    ├─ Analisa comando
    ├─ Identifica tipo de tarefa
    ├─ Seleciona especialista automático
    │  (Modo Otimizado)
    │
    └─ OU usuário especifica especialista
       (Modo Híbrido)
    ↓
Especialista Selecionado
    ├─ Analisa repositório
    ├─ Gera código/mudanças
    ├─ Valida segurança
    ├─ Cria commit
    └─ Faz push automático
    ↓
Sistema de Segurança
    ├─ Valida código
    ├─ Verifica padrões perigosos
    ├─ Auditoria completa
    └─ Aprova/Rejeita
    ↓
GitHub
    └─ Commit + Push (se aprovado)
```

### 2. **Tipos de Créditos**

| Tipo | Custo | Uso |
|------|-------|-----|
| **Automação** | 5 créditos | RKM faz tudo automaticamente |
| **IA Normal** | 1 crédito | Chat normal com especialistas |
| **Híbrido** | 3 créditos | Usuário especifica especialista |

### 3. **Especialistas Disponíveis**

- **Serginho**: Orquestrador (coordena tudo)
- **54+ Especialistas**: Código, Design, Marketing, Dados, Segurança, etc.

---

## 📱 Funcionalidades Multimodais

### 1. **Voz (Speech-to-Text)**
- Usuário fala comando: "RKM, cria um componente React"
- Sistema transcreve e processa
- Resposta em voz (Text-to-Speech)

### 2. **Imagem (Vision)**
- Usuário envia screenshot de design
- IA analisa e gera código
- Exemplo: Screenshot → HTML/CSS automático

### 3. **Integração**
- Botão de microfone no chat
- Botão de câmera/galeria
- Processamento em tempo real

---

## 🔐 Sistema de Segurança

### 1. **Validação de Código**
```javascript
// Verificações antes de commit:
- Sintaxe válida (ESLint)
- Sem código malicioso
- Sem credenciais expostas
- Sem deletar arquivos críticos
- Sem modificar .env, secrets
```

### 2. **Padrões Bloqueados**
```
❌ rm -rf /
❌ DROP TABLE users
❌ process.env.SECRET_KEY
❌ Modificar package.json sem validação
❌ Deletar arquivos críticos (.git, node_modules)
```

### 3. **Auditoria**
- Log de cada automação
- Quem pediu
- O que foi feito
- Timestamp
- Status (sucesso/erro)

---

## 🐙 Extensão GitHub

### Funcionalidades
1. **Bot no GitHub**: Comentar no PR com comandos
2. **Webhook**: Receber eventos do GitHub
3. **Automação de PR**: Criar PRs automaticamente
4. **Análise de Código**: Revisar PRs com IA

### Exemplo de Uso
```
# No GitHub PR:
@rkmmax-bot adiciona testes para essa função

# Bot responde:
✅ Criando testes...
📝 Commit: feat: add tests for function
🔗 PR: #123
```

---

## 💾 Protocolo de Créditos Detalhado

### Automação (5 créditos)
```
Usuário: "RKM, faz X"
├─ Serginho analisa (0.5 crédito)
├─ Especialista executa (3 créditos)
├─ Validação segurança (1 crédito)
└─ Commit + Push (0.5 crédito)
Total: 5 créditos
```

### IA Normal (1 crédito)
```
Usuário: "Especialista, me ajuda com Y"
└─ Resposta de chat: 1 crédito
```

### Híbrido (3 créditos)
```
Usuário: "Dev, adiciona feature Z"
├─ Especialista específico (2 créditos)
├─ Validação (0.5 crédito)
└─ Commit (0.5 crédito)
Total: 3 créditos
```

---

## 🗂️ Estrutura de Arquivos

```
src/
├── automation/
│   ├── AutomationEngine.js          # Motor de automação
│   ├── SpecialistSelector.js        # Seleção inteligente
│   ├── SecurityValidator.js         # Validação de segurança
│   ├── CreditCalculator.js          # Cálculo de créditos
│   └── AuditLogger.js               # Log de auditoria
├── github/
│   ├── GitHubAutomation.js          # Automação GitHub
│   ├── CommitBuilder.js             # Construir commits
│   └── PRManager.js                 # Gerenciar PRs
├── multimodal/
│   ├── SpeechToText.js              # Voz → Texto
│   ├── TextToSpeech.js              # Texto → Voz
│   └── VisionAnalyzer.js            # Análise de imagens
├── pages/
│   ├── Automation.jsx               # Interface de automação
│   └── AutomationHistory.jsx        # Histórico
└── components/
    ├── AutomationPanel.jsx          # Painel de controle
    ├── SpecialistSelector.jsx       # Seletor de especialista
    └── SecurityAlert.jsx            # Alertas de segurança

api/
├── automation.js                    # Endpoint de automação
├── github-automation.js             # Automação GitHub
├── security-validator.js            # Validação
└── audit-log.js                     # Auditoria
```

---

## 🚀 Fases de Implementação

### Fase 1: Análise e Planejamento
- ✅ Documentação completa
- ✅ Arquitetura definida
- ✅ Especialistas mapeados

### Fase 2: Motor de Automação
- Serginho + Especialistas
- Seleção inteligente
- Modo Otimizado e Híbrido

### Fase 3: Protocolo de Créditos
- Sistema de cálculo
- Deduções automáticas
- Histórico de gastos

### Fase 4: Segurança
- Validação de código
- Padrões bloqueados
- Auditoria completa

### Fase 5: GitHub Integration
- API GitHub
- Commits automáticos
- Push automático

### Fase 6: Extensão GitHub
- Bot no GitHub
- Webhooks
- PR automation

### Fase 7: Multimodal
- Speech-to-Text
- Text-to-Speech
- Vision (imagens)

### Fase 8: Interface Web
- Painel de automação
- Histórico
- Configurações

### Fase 9: React Native/Flutter
- Adaptação de componentes
- APIs compartilhadas
- Funcionalidades nativas

### Fase 10: Testes
- Testes unitários
- Testes de integração
- Testes de segurança

---

## 📊 Exemplo de Fluxo Completo

### Cenário: Usuário pede "RKM, cria um formulário de login"

```
1. Usuário (via voz ou texto):
   "RKM, cria um formulário de login com validação"

2. Serginho (Orquestrador):
   - Identifica: "Tarefa de desenvolvimento"
   - Seleciona: "Dev" (especialista)
   - Modo: "Otimizado" (automático)

3. Dev (Especialista):
   - Analisa repositório
   - Gera: LoginForm.jsx, validation.js, styles.css
   - Testa código
   - Cria commit: "feat: add login form with validation"

4. SecurityValidator:
   - Verifica sintaxe ✅
   - Verifica padrões ✅
   - Verifica credenciais ✅
   - Aprova ✅

5. GitHub:
   - Faz commit
   - Faz push
   - Cria PR (opcional)

6. Sistema de Créditos:
   - Deduz 5 créditos
   - Log: "Automação concluída"
   - Notifica usuário

7. Usuário (via voz):
   "Pronto! Seu formulário de login foi criado!"
```

---

## 🔄 Modo Híbrido vs Otimizado

### Modo Otimizado (Automático)
```
Usuário: "RKM, faz X"
→ Serginho escolhe especialista
→ Executa automaticamente
→ Custa 5 créditos
```

### Modo Híbrido (Semiautomático)
```
Usuário: "Dev, faz X"
→ Especialista específico
→ Usuário pode revisar antes
→ Custa 3 créditos
```

### Modo Manual (Sem Automação)
```
Usuário: "Me ajuda com X"
→ Chat normal
→ Usuário faz manualmente
→ Custa 1 crédito
```

---

## 🎯 Próximos Passos

1. ✅ Documentação (FEITO)
2. 🔄 Implementar Motor de Automação
3. 🔄 Protocolo de Créditos
4. 🔄 Sistema de Segurança
5. 🔄 GitHub Integration
6. 🔄 Extensão GitHub
7. 🔄 Multimodal
8. 🔄 Interface Web
9. 🔄 React Native/Flutter
10. 🔄 Testes

---

## 📝 Notas Importantes

- **Especialistas**: NUNCA remover os 54+ especialistas
- **Segurança**: SEMPRE validar antes de commits
- **Créditos**: Automação custa mais que IA normal
- **Auditoria**: Log completo de cada ação
- **React Native**: Preparar para migração futura

---

## 🚀 Status

**Criado em**: 27 de Novembro de 2025  
**Versão**: 1.0.0  
**Status**: 📋 Planejamento Completo  
**Próximo**: 🔄 Implementação do Motor de Automação
