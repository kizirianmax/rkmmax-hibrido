# 🛡️ Guia de Configuração de Branch Protection

## 📍 Passo a Passo

### 1. Acessar Configurações

1. Vá para: https://github.com/kizirianmax/rkmmax-hibrido/settings/branches
2. Clique em **Add rule**
3. Branch name pattern: `main`

---

### 2. Configurar Proteções Obrigatórias

#### ✅ Require a pull request before merging
- [x] Require approvals: **1**
- [x] Dismiss stale pull request approvals when new commits are pushed

#### ✅ Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- **Status checks obrigatórios**:
  - `test` (do workflow ci-tests.yml)
  - `coverage` (do workflow ci-coverage.yml)

#### ✅ Outras proteções
- [x] Require conversation resolution before merging
- [x] Do not allow bypassing the above settings

---

### 3. Salvar

Clique em **Create** ou **Save changes**

---

## 🧪 Como Testar

### Teste 1: CI funcionando

```bash
# Criar branch de teste
git checkout -b test/ci-validation
git push origin test/ci-validation

# Criar PR
# Verificar que workflows rodam automaticamente
```

### Teste 2: Bloqueio de merge com teste falhando

```bash
# Criar branch com teste que falha
git checkout -b test/failing-test

# Adicionar teste que falha
cat > src/__tests__/fail.test.js << 'EOF'
describe('Failing Test', () => {
  test('should fail', () => {
    expect(true).toBe(false);
  });
});
EOF

git add .
git commit -m "test: add failing test"
git push origin test/failing-test

# Criar PR e verificar que merge está bloqueado
```

---

## ✅ Resultado Esperado

Após configuração:
- ✅ Workflows rodam automaticamente em push/PR
- ✅ Merge é bloqueado se CI falhar
- ✅ Coverage é validado (>= 50% atualmente)
- ✅ Branch main está protegida

---

## 🔧 Troubleshooting

### Se CI falhar:

```bash
# Executar localmente
npm ci
npm test
npm run test:coverage

# Verificar versões
node --version  # Deve ser 22.x
npm --version   # Deve ser >=10
```

### Se package-lock.json estiver fora de sinc:

```bash
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "chore: regenerate package-lock.json"
```
