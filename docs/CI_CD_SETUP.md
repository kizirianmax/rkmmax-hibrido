# 🚀 CI/CD Setup Guide

## GitHub Actions Workflows

Este documento descreve os workflows de CI/CD configurados para o RKMMAX.

### 📋 Workflows Disponíveis

#### 1. **tests.yml** - Testes e Deploy
Executado em: `push` e `pull_request` para `main` e `develop`

**Jobs:**
- ✅ **test**: Executa testes em Node 18.x e 20.x
- ✅ **lint**: Verifica ESLint e Prettier
- ✅ **security**: Audit de segurança
- ✅ **build**: Build do projeto
- ✅ **deploy-staging**: Deploy para staging (branch develop)
- ✅ **deploy-production**: Deploy para produção (branch main)
- ✅ **notify**: Notificação no Slack

#### 2. **security.yml** - Segurança
Executado em: `push`, `pull_request` e diariamente às 2 AM

**Jobs:**
- ✅ **code-scanning**: CodeQL analysis
- ✅ **dependency-check**: Verificação de vulnerabilidades
- ✅ **secret-scanning**: Busca por secrets expostos
- ✅ **license-check**: Verificação de licenças
- ✅ **automation-security**: Testes de segurança da automação
- ✅ **report**: Relatório consolidado

#### 3. **quality.yml** - Qualidade de Código
Executado em: `push` e `pull_request`

**Jobs:**
- ✅ **quality-gate**: SonarCloud + Codecov
- ✅ **code-metrics**: Métricas de código
- ✅ **performance**: Testes de performance
- ✅ **documentation**: Verificação de documentação
- ✅ **report-pr**: Comentário no PR com resultados

---

## 🔧 Configuração Necessária

### 1. Secrets do GitHub

Adicione os seguintes secrets em: **Settings → Secrets and variables → Actions**

#### Deploy (Vercel)
```
VERCEL_TOKEN: seu_token_vercel
VERCEL_ORG_ID: seu_org_id
VERCEL_PROJECT_ID: seu_project_id_producao
VERCEL_PROJECT_ID_STAGING: seu_project_id_staging
```

#### Notificações (Slack)
```
SLACK_WEBHOOK: https://hooks.slack.com/services/...
```

#### Segurança
```
SNYK_TOKEN: seu_token_snyk
SONAR_TOKEN: seu_token_sonarcloud
```

### 2. Configurar SonarCloud

1. Acesse: https://sonarcloud.io
2. Crie uma organização
3. Importe seu repositório
4. Gere um token
5. Adicione como secret: `SONAR_TOKEN`

### 3. Configurar Codecov

1. Acesse: https://codecov.io
2. Conecte seu repositório GitHub
3. Ative integração (automático)

### 4. Configurar Slack

1. Crie um webhook em: https://api.slack.com/messaging/webhooks
2. Copie a URL
3. Adicione como secret: `SLACK_WEBHOOK`

---

## 📊 Métricas Monitoradas

### Testes
- ✅ Taxa de sucesso: 100%
- ✅ Cobertura: 85%+
- ✅ Tempo: < 5 minutos

### Segurança
- ✅ Vulnerabilidades críticas: 0
- ✅ Secrets expostos: 0
- ✅ Licenças compatíveis: 100%

### Qualidade
- ✅ Duplicação: < 3%
- ✅ Bugs: 0
- ✅ Code smells: < 10

---

## 🚀 Fluxo de Deploy

### Branch Develop → Staging
```
Push para develop
    ↓
Testes passam
    ↓
Build bem-sucedido
    ↓
Deploy automático para staging
    ↓
Notificação no Slack
```

### Branch Main → Produção
```
Push para main (geralmente via PR merge)
    ↓
Testes passam
    ↓
Build bem-sucedido
    ↓
Deploy automático para produção
    ↓
Notificação no Slack
```

---

## 📝 Exemplos de Uso

### Executar testes localmente antes de push
```bash
npm run test:ci
```

### Verificar cobertura
```bash
npm run test:coverage
```

### Verificar segurança
```bash
npm audit
npm run test:security
```

### Build local
```bash
npm run build
```

---

## 🔍 Monitoramento

### Dashboard GitHub
- Acesse: **Actions** no seu repositório
- Veja status de cada workflow
- Clique para ver detalhes

### SonarCloud
- Acesse: https://sonarcloud.io
- Veja métricas de qualidade
- Acompanhe tendências

### Codecov
- Acesse: https://codecov.io
- Veja cobertura de testes
- Compare com commits anteriores

### Slack
- Receba notificações de build
- Clique para ver detalhes
- Acompanhe deployments

---

## ⚠️ Troubleshooting

### Testes falhando no CI
```bash
# Limpar cache
git clean -fdx node_modules
npm ci

# Executar localmente
npm run test:ci
```

### Build falhando
```bash
# Verificar dependências
npm audit fix

# Verificar build
npm run build
```

### Deploy falhando
```bash
# Verificar secrets
# Settings → Secrets and variables → Actions

# Verificar token Vercel
vercel whoami
```

### Cobertura baixa
```bash
# Gerar relatório
npm run test:coverage

# Revisar arquivos não cobertos
open coverage/lcov-report/index.html
```

---

## 📚 Referências

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [SonarCloud](https://sonarcloud.io)
- [Codecov](https://codecov.io)
- [Vercel Deploy](https://vercel.com/docs)
- [Jest Testing](https://jestjs.io)

---

## ✅ Checklist de Configuração

- [ ] Adicionar secrets do GitHub
- [ ] Configurar SonarCloud
- [ ] Configurar Codecov
- [ ] Configurar Slack webhook
- [ ] Testar workflow de testes
- [ ] Testar workflow de segurança
- [ ] Testar workflow de qualidade
- [ ] Testar deploy para staging
- [ ] Testar deploy para produção
- [ ] Verificar notificações no Slack

---

## 🎯 Próximos Passos

1. ✅ Configurar todos os secrets
2. ✅ Fazer push para testar workflows
3. ✅ Monitorar resultados
4. ✅ Ajustar limites conforme necessário
5. ✅ Documentar padrões da equipe
