# 🛡️ Guia de Configuração de Branch Protection

## 📍 Como Configurar Branch Protection Rules

### Passo 1: Acessar Configurações

1. Vá para o repositório no GitHub
2. Clique em **Settings**
3. No menu lateral, clique em **Branches**
4. Clique em **Add rule** (ou edite a regra existente para `main`)

---

### Passo 2: Configurar Branch Name Pattern

```
Branch name pattern: main
```

---

### Passo 3: Marcar as Opções Obrigatórias

#### ✅ Proteções de Merge

- [x] **Require a pull request before merging**
  - [x] **Require approvals**: 1 (mínimo)
  - [x] **Dismiss stale pull request approvals when new commits are pushed**

#### ✅ Status Checks (CRÍTICO)

- [x] **Require status checks to pass before merging**
  - [x] **Require branches to be up to date before merging**
  - **Adicionar os seguintes status checks**:
    - `test` (do workflow `ci-tests.yml`)
    - `coverage` (do workflow `ci-coverage.yml`)

#### ✅ Outras Proteções

- [x] **Require conversation resolution before merging**
- [x] **Do not allow bypassing the above settings** ⚠️ IMPORTANTE!
- [x] **Restrict who can push to matching branches**
  - Selecionar: Apenas admins

---

### Passo 4: Salvar

Clique em **Create** ou **Save changes**

---

## 🚨 Resultado Esperado

Após configurar, **NENHUM código poderá ser mergeado** na `main` se:

1. ❌ Algum teste falhar no workflow `CI - Tests`
2. ❌ Coverage estiver abaixo de 80% no workflow `CI - Coverage`
3. ❌ Houver exceções não tratadas detectadas pelo Jest
4. ❌ Não houver aprovação de pelo menos 1 revisor

---

## 📊 Como Verificar se Está Funcionando

### Teste 1: Criar PR com Teste Falhando

```bash
# Criar branch de teste
git checkout -b test/failing-test

# Adicionar teste que falha
echo "test('should fail', () => { expect(true).toBe(false); });" > src/test-fail.test.js

# Commit e push
git add .
git commit -m "test: add failing test"
git push origin test/failing-test
```

**Resultado esperado**: 
- ✅ Workflow `CI - Tests` deve **FALHAR**
- ✅ Botão "Merge" deve estar **BLOQUEADO**
- ✅ Mensagem: "Required status check 'test' has not passed"

### Teste 2: Criar PR com Coverage Baixo

```bash
# Criar branch de teste
git checkout -b test/low-coverage

# Adicionar arquivo sem testes
echo "export function untested() { return 'no tests'; }" > src/untested.js

# Commit e push
git add .
git commit -m "feat: add untested code"
git push origin test/low-coverage
```

**Resultado esperado**:
- ✅ Workflow `CI - Coverage` deve **FALHAR**
- ✅ Botão "Merge" deve estar **BLOQUEADO**
- ✅ Mensagem: "Required status check 'coverage' has not passed"

---

## 🔍 Verificação Manual

Execute localmente:

```bash
# 1. Rodar testes
npm test

# 2. Rodar coverage
npm run test:coverage

# 3. Verificar relatório HTML
open coverage/lcov-report/index.html
```

---

## 📚 Referências

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
