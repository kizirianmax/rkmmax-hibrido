# 📋 Diretrizes de Desenvolvimento - RKMMAX Híbrido

## 👨‍💻 Informações do Projeto

**Desenvolvedor Principal:** @kizirianmax  
**Status:** Projeto individual em desenvolvimento ativo  
**Data de atualização:** 2026-02-12

---

## ⚠️ POLÍTICA DE MERGE - REGRAS OBRIGATÓRIAS

### 🔒 Requisitos para Merge na Branch `main`

**Esta é uma regra ABSOLUTA do projeto:**

✅ **TODO merge na branch `main` será feito APENAS quando:**
- ✅ Todos os testes estiverem passando (CI verde)
- ✅ Nenhuma falha crítica no pipeline de CI/CD
- ✅ Coverage de testes mantido ou aumentado
- ✅ Sem alertas de segurança críticos

❌ **NENHUM código será mesclado se:**
- ❌ Houver falhas nos testes
- ❌ O CI estiver vermelho (failed)
- ❌ Existirem problemas críticos não resolvidos
- ❌ Dependências com vulnerabilidades críticas

---

## 🧪 Padrão de Qualidade

### Testes (obrigatório)
```bash
# Antes de qualquer commit ou PR
npm test

# Para verificar cobertura
npm run test:coverage

# CI local (simula GitHub Actions)
npm run test:ci
```

**Resultado esperado:** ✅ Todos os testes passando antes do merge

### Linting (recomendado)
```bash
npm run lint
```

---

## 🚀 Workflow de Desenvolvimento

### 1. Criar branch de feature
```bash
git checkout -b feature/nome-da-feature
```

### 2. Desenvolver e testar localmente
```bash
npm test
npm run lint
```

### 3. Commit com mensagens descritivas
```bash
git commit -m "feat: descrição da feature"
```

### 4. Push e criar Pull Request
```bash
git push origin feature/nome-da-feature
```

### 5. Aguardar CI passar
- ⏳ Workflows `ci-tests` e `ci-coverage` devem passar
- ✅ Todos os checks devem estar verdes

### 6. Merge apenas com CI verde
- ✅ Se todos os testes passarem → Merge permitido
- ❌ Se algum teste falhar → Corrigir antes do merge

---

## 🛡️ Proteção da Branch Main

### Configurações de Branch Protection (Recomendado)

Para garantir a qualidade, configure em:  
`Settings → Branches → Branch protection rules`

**Regras recomendadas:**
- ☑️ Require a pull request before merging
- ☑️ Require status checks to pass before merging
  - Status checks obrigatórios: `test`, `coverage`
- ☑️ Require branches to be up to date before merging
- ☑️ Do not allow bypassing the above settings

---

## 📊 Checklist de Qualidade

Antes de fazer merge, verifique:

- [ ] ✅ `npm test` passou localmente
- [ ] ✅ CI/CD workflows passaram no GitHub Actions
- [ ] ✅ Nenhum alerta de segurança crítico
- [ ] ✅ Código revisado (self-review se dev solo)
- [ ] ✅ Documentação atualizada (se necessário)
- [ ] ✅ CHANGELOG.md atualizado (se aplicável)

---

## 🔄 Integração Contínua (CI/CD)

### Workflows Ativos

**ci-tests.yml** - Executa em todo push/PR
- Roda testes em Node 22.x
- Valida que nada quebrou

**ci-coverage.yml** - Executa em PRs
- Gera relatório de cobertura
- Upload para Codecov (se configurado)

### Status dos Workflows

Sempre verifique antes do merge:  
https://github.com/kizirianmax/rkmmax-hibrido/actions

---

## 📝 Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nova funcionalidade
fix: correção de bug
docs: mudanças na documentação
test: adição/correção de testes
refactor: refatoração de código
chore: tarefas de manutenção
ci: mudanças no CI/CD
```

---

## 🎯 Resumo Executivo

> **"Apenas código testado e funcionando entra na main"**

Esta política garante:
- ✅ Estabilidade da branch principal
- ✅ Confiança no código em produção
- ✅ Histórico limpo e rastreável
- ✅ Qualidade consistente do projeto

---

## 📞 Contato

**Desenvolvedor:** @kizirianmax  
**Repositório:** https://github.com/kizirianmax/rkmmax-hibrido

---

**Última atualização:** 2026-02-12  
**Versão:** 1.0.0