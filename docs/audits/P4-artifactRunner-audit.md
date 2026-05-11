# P4 — Auditoria Técnica: `artifactRunner.js`

> **Escopo:** somente documentação. Nenhum código foi alterado.
> **Data:** 2026-05-11
> **Fase:** Construtor/Híbrido — Fase 2C (Executor Controlado)
> **Arquivo auditado:** `src/lib/construtor/artifactRunner.js`

---

## Verdade Arquitetural

| Camada | Papel |
|---|---|
| Serginho | Orquestrador soberano — não tocado por este módulo |
| Construtor/Híbrido | Geração de artefatos — **este módulo pertence a esta camada** |
| Especialistas | Especialistas de domínio — não relacionados a este módulo |
| ABNT | Validação/conformidade — não relacionada a este módulo |

---

## 1. Papel do arquivo no pipeline do Construtor/Híbrido

O `artifactRunner.js` é o executor da **Fase 2C** dentro do pipeline do Construtor/Híbrido. Sua posição no pipeline é:

```
Fase 2A — artifactPackager.js  →  ZIP + manifest gerados
Fase 2B — artifactValidator.js →  validação estrutural
Fase 2C — artifactRunner.js    →  execução controlada (ESTE ARQUIVO)
Fase 2D — artifactPreview.js   →  orquestração do preview completo
```

O módulo recebe um artefato já empacotado e validado e executa de forma isolada e opcional o conteúdo executável (atualmente apenas arquivos `.js`), retornando um resultado estruturado com `stdout`, `stderr`, `exitCode`, `timedOut` e `durationMs`.

**A execução é opcional:** se o artefato não contiver arquivo executável reconhecido, o módulo retorna `executed: false` sem erro, não bloqueando o fluxo de preview.

---

## 2. Entradas e saídas

### Entrada — `executeArtifact(artifact, options?)`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `artifact.manifest` | `object` | sim | manifest gerado pela Fase 2A |
| `artifact.zipBuffer` | `Buffer` | sim | buffer ZIP gerado pela Fase 2A |
| `options.timeout` | `number` | não | timeout em ms (padrão: 5 000) |
| `options.command` | `string` | não | comando customizado (deve estar na allowlist) |
| `options.args` | `string[]` | não | argumentos adicionais |
| `options.cwd` | `string` | não | diretório de trabalho customizado |

### Saída — objeto de resultado

| Campo | Tipo | Descrição |
|---|---|---|
| `executed` | `boolean` | `true` se houve tentativa de execução |
| `success` | `boolean` | `true` se exitCode === 0 |
| `command` | `string \| null` | comando executado (ex.: `node script.js`) |
| `durationMs` | `number` | duração da execução em ms |
| `stdout` | `string` | saída padrão capturada |
| `stderr` | `string` | saída de erro capturada |
| `timedOut` | `boolean` | `true` se o processo foi abortado por timeout |
| `exitCode` | `number \| null` | código de saída do processo |
| `reason` | `string?` | motivo de não-execução (ex.: `not-executable`, `validation-failed`, `command-not-allowed`) |
| `errors` | `string[]?` | lista de erros de validação (quando `reason: 'validation-failed'`) |

---

## 3. Dependências internas

| Dependência | Tipo | Papel |
|---|---|---|
| `node:child_process` (`execFile`) | Node built-in | execução do subprocess sem shell intermediário |
| `node:fs/promises` (`mkdtemp`, `rm`) | Node built-in | criação e limpeza de diretório temporário |
| `node:os` (`tmpdir`) | Node built-in | diretório base para temporários do sistema |
| `node:path` (`join`) | Node built-in | composição de caminhos de arquivo |
| `node:util` (`promisify`) | Node built-in | promisificação de `execFile` |
| `adm-zip` | npm (puro JS) | extração do `zipBuffer` no diretório temporário |
| `./artifactValidator.js` | interna (Fase 2B) | pré-validação do artefato antes da execução |

**Nenhuma dependência de rede, Supabase, Stripe, auth, providers de IA ou Serginho.**

---

## 4. Riscos técnicos visíveis

### RT-01 — Execução em diretório `tmp` sem sandbox de sistema operacional
**Severidade:** Média  
O `tmpdir()` aponta para o diretório temporário do SO (ex.: `/tmp`). O script executado tem acesso ao filesystem a partir do `cwd`, mas não há isolamento via container, chroot, seccomp ou namespace. Um script malicioso com permissões suficientes poderia ler/escrever fora do diretório de execução.  
**Mitigação existente:** ambiente limpo (`buildCleanEnv`), sem variáveis sensíveis.  
**Mitigação ausente:** sandbox de OS.

### RT-02 — `adm-zip` extrai todos os arquivos do ZIP sem validação de path traversal
**Severidade:** Média  
`zip.extractAllTo(tmpDir, true)` extrai todos os arquivos do ZIP sem verificar se algum entry contém `../` no caminho (path traversal). Um artefato com entry `../../etc/cron.d/evil` poderia sobrescrever arquivos fora do `tmpDir`.  
**Mitigação existente:** o artefato passa por `artifactValidator.js` antes da extração, mas o validador atual não inspeciona entries de path traversal.  
**Mitigação ausente:** validação explícita de entries do ZIP antes de `extractAllTo`.

### RT-03 — Timeout padrão de 5 000 ms pode ser insuficiente ou excessivo
**Severidade:** Baixa  
5 000 ms é razoável para scripts simples, mas pode ser longo demais em ambientes serverless (Vercel Functions têm limite de 10s por padrão no plano gratuito) e curto demais para scripts legítimos de maior processamento.  
**Mitigação existente:** `killSignal: 'SIGKILL'` garante término forçado.

### RT-04 — `maxBuffer` de 1 MB pode ser insuficiente para artefatos que geram saída volumosa
**Severidade:** Baixa  
Se `stdout + stderr > 1 MB`, `execFile` lança `RangeError: stdout maxBuffer length exceeded`, que é capturado pelo `catch` e retorna `success: false` sem `timedOut`.  
**Mitigação existente:** erro é capturado e retornado como falha não-crítica.

---

## 5. Riscos de segurança ou execução

### RS-01 — Allowlist de comandos eficaz mas com vetor de substituição por `options.command`
**Severidade:** Média  
O parâmetro `options.command` permite ao chamador especificar um runtime alternativo, mas este é validado contra `ALLOWED_COMMANDS = ['node']`. O risco existe se o chamador for controlável por input externo não sanitizado.  
**Chamadores atuais:** somente `api/artifact-preview.js` chama `executeArtifact(artifact)` sem `options.command`. Risco atual: baixo.  
**Risco futuro:** se um endpoint expuser `options.command` como parâmetro de request HTTP, seria um RCE.

### RS-02 — Ambiente limpo (`buildCleanEnv`) não inclui NODE_PATH
**Severidade:** Baixa — favorável  
O `NODE_PATH` não está no `buildCleanEnv`. Scripts que tentarem `require()` módulos do projeto falharão, o que é o comportamento desejado (isolamento). Porém, módulos built-in (`fs`, `path`, `os`, `crypto`, `net`) ainda são acessíveis ao script executado.

### RS-03 — Módulos built-in do Node (fs, net, crypto) acessíveis ao script
**Severidade:** Alta (latente)  
Scripts `.js` executados via `node` têm acesso completo à API do Node.js. Um script com `require('net').connect(...)` ou `require('fs').readFileSync('/etc/passwd')` seria executado sem restrição de rede ou filesystem além do timeout.  
**Mitigação existente:** ambiente limpo sem credenciais. Scripts maliciosos não teriam tokens/chaves para uso direto.  
**Mitigação ausente:** restrição de módulos Node (ex.: `--disallow-code-generation`, VM sandbox, Deno sandbox).  
**Contexto atual:** artefatos são gerados pela pipeline do Construtor/Híbrido com conteúdo controlado pelo LLM. Risco concreto depende de confiança no LLM output.

### RS-04 — Cleanup (`rm tmpDir`) executa no `finally` mas pode falhar silenciosamente
**Severidade:** Baixa  
`rm(tmpDir, { recursive: true, force: true })` usa `force: true`, então falhas são silenciosas. Em ambientes serverless com disco efêmero, isso é aceitável. Em ambientes persistentes, acúmulo de diretórios `artifact-runner-*` em `/tmp` é possível.

---

## 6. Limites já existentes

| Limite | Implementação | Eficácia |
|---|---|---|
| Allowlist de comandos (`ALLOWED_COMMANDS`) | Verificado antes de `execFileAsync` | ✅ eficaz |
| Timeout rígido (`DEFAULT_TIMEOUT_MS = 5 000`) com `SIGKILL` | `execFile timeout + killSignal` | ✅ eficaz |
| `maxBuffer` de 1 MB | `maxBuffer: MAX_BUFFER_BYTES` | ✅ eficaz |
| Ambiente limpo (sem tokens/API keys) | `buildCleanEnv()` — somente PATH, HOME, TMPDIR, NODE_ENV | ✅ eficaz |
| Sem shell intermediário | `execFile` (não `exec`) | ✅ eficaz |
| Pré-validação via Fase 2B | `validateArtifact(artifact)` antes de qualquer extração | ✅ eficaz |
| Cleanup garantido no `finally` | `await cleanup()` | ✅ eficaz |
| Execução opcional (sem bloqueio de preview) | `executed: false` para não-executáveis | ✅ eficaz |

---

## 7. Limites ausentes ou frágeis

| Limite | Risco associado | Prioridade de hardening |
|---|---|---|
| Validação de path traversal nos entries do ZIP | RT-02 | Alta |
| Sandbox de OS (seccomp, namespace, container) | RT-01, RS-03 | Alta (P13 ou posterior) |
| Restrição de módulos Node no subprocess | RS-03 | Média |
| Validação do tamanho do ZIP antes da extração | (implícito RT-04) | Baixa |
| Limite de arquivos extraídos (zip bomb) | Não identificado explicitamente | Média |

---

## 8. Pontos que NÃO devem ser alterados agora

- **Integração com `artifactValidator.js` (Fase 2B):** a pré-validação é o único portão de entrada antes da extração. Qualquer alteração nesse ponto requer auditoria conjunta de 2B.
- **`buildCleanEnv()`:** a lista mínima de variáveis está correta. Não adicionar variáveis de ambiente sensíveis.
- **`execFile` (não `exec`):** o uso sem shell é uma decisão de segurança deliberada. Não substituir por `exec` ou `spawn` com shell.
- **`ALLOWED_COMMANDS = ['node']`:** a allowlist atual é o mínimo correto. Não expandir sem auditoria de segurança dedicada.
- **Fluxo de `finally` + cleanup:** garante que `tmpDir` seja sempre removido. Não alterar a estrutura try/finally.
- **Caráter opcional da execução:** `executed: false` para não-executáveis não bloqueia o preview. Não tornar a execução obrigatória.

---

## 9. Recomendações futuras por prioridade

### 🔴 Alta prioridade

**HARD-01 — Validar entries do ZIP contra path traversal antes de `extractAllTo`**  
Antes de `zip.extractAllTo(tmpDir, true)`, iterar sobre `zip.getEntries()` e rejeitar qualquer entry cujo `entryName` contenha `..` ou seja um caminho absoluto.  
Candidato para P5 ou P6.

**HARD-02 — Limit de tamanho do ZIP antes da extração**  
Verificar `zipBuffer.length` contra um limite máximo configurável (ex.: 5 MB) antes de qualquer extração, para evitar zip bomb ou DoS por disco.  
Candidato para P5 ou P6.

### 🟡 Média prioridade

**HARD-03 — Restrição de módulos Node no subprocess**  
Avaliar uso de `--experimental-permission` (Node 20+) ou `--disallow-code-generation` para limitar o que o script executado pode fazer.  
Candidato para P8–P10.

**HARD-04 — Monitorar acúmulo de `artifact-runner-*` em `/tmp`**  
Em ambientes persistentes, adicionar log de warning se `cleanup()` falhar.  
Candidato para P7.

### 🟢 Baixa prioridade

**HARD-05 — Documentar contrato de `options.command` como internal-only**  
Garantir que `options.command` nunca seja exposto como parâmetro de request HTTP em nenhum endpoint futuro.  
Candidato para P5 (documental).

**HARD-06 — Revisitar `maxBuffer` quando artefatos de maior volume forem suportados**  
1 MB é adequado hoje. Se o roadmap incluir artefatos com output volumoso, aumentar proporcionalmente.  
Candidato para revisão no P13.

---

## 10. Conclusão

### Pode continuar como está até o P13?

**Sim, com ressalva sobre RS-03 e RT-02.**

O `artifactRunner.js` está tecnicamente bem construído para o estágio atual do projeto:
- allowlist de comandos funcional
- timeout com `SIGKILL` garantido
- ambiente limpo sem credenciais sensíveis
- execução opcional que não bloqueia o fluxo
- integração correta com Fase 2B (validação)
- cleanup garantido no `finally`
- testes unitários cobrindo os cenários principais (sucesso, falha, timeout, não-executável)

**Não há risco crítico imediato** que exija intervenção antes do P13, desde que:
1. `options.command` nunca seja exposto como parâmetro de request HTTP externo (RS-01)
2. Os artefatos gerados pelo LLM continuem sendo conteúdo controlado (RS-03 latente)

**O único risco que merece atenção antes do P13** é o **RT-02 (path traversal no ZIP)**, que deveria ser endereçado no **P5 ou P6** como hardening preventivo antes de qualquer uso em produção com artefatos gerados por usuários externos.

### Veredicto

| Dimensão | Status |
|---|---|
| Funcionalidade para o roadmap atual | ✅ aprovada |
| Segurança para uso interno/controlado | ✅ adequada |
| Segurança para artefatos de usuários externos | ⚠️ condicional — RT-02 e RS-03 devem ser endereçados |
| Risco crítico imediato | ❌ nenhum identificado |
| Pode aguardar até P13 | ✅ sim, com hardening de RT-02 recomendado no P5/P6 |

---

*Auditoria P4 — gerada documentalmente, sem alteração de código.*
