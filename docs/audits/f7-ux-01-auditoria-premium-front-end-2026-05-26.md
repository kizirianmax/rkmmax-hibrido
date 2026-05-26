# F7-UX-01 — Auditoria premium de interface do front-end (2026-05-26)

## 1) Diagnóstico geral

O front-end atual está funcional e cobre bem o escopo de produto, mas a percepção visual ainda oscila entre **“app improvisado/mobile-first”** e **“produto SaaS premium”**. Há telas com bom acabamento (ex.: demo), porém falta consistência sistêmica de design entre rotas críticas. Para banca/incubadora/investidor, isso reduz percepção de maturidade de produto, mesmo com arquitetura técnica forte.

Diagnóstico honesto:
- **Nível atual**: intermediário (funcional, porém inconsistente).
- **Gargalo principal**: ausência de linguagem visual unificada (tokens, escala tipográfica, grid, estados interativos e padrão de componentes).
- **Impacto externo**: pode transmitir menor robustez comercial do que a robustez real de engenharia.

---

## 2) Telas auditadas (somente leitura)

| Rota / área | Arquivos auditados |
|---|---|
| `/` (Home) | `src/pages/Home.jsx` |
| `/startup` | `src/pages/Projects.jsx`, `src/pages/Projects.css` |
| `/demo` | `src/pages/Demo.jsx`, `src/pages/Demo.css` |
| `/demo-autoplay` | `src/pages/DemoAutoplay.jsx`, `src/pages/DemoAutoplay.css` |
| `/serginho` | `src/pages/Serginho.jsx`, `src/pages/Serginho.css` |
| `/hybrid` | `src/pages/HybridAgentSimple.jsx`, `src/styles/HybridAgent.css` |
| `/specialists` | `src/pages/Specialists.jsx` |
| `/login` | `src/pages/Auth.jsx` |
| Navegação / layout global | `src/App.jsx`, `src/components/Header.jsx`, `src/index.css`, `src/components/OptionalSignupBanner.jsx`, `src/components/OptionalSignupBanner.css`, `src/components/ConsentBanner.jsx`, `src/components/ConsentBanner.css`, `src/components/Footer.jsx`, `src/components/Footer.css` |

Observação: `Footer` existe em código, mas não está montado no `App.jsx`.

---

## 3) Problemas encontrados por tela (objetivos e verificáveis)

### Home (`/`)
- **Excesso de estilo inline** em vez de sistema de componentes/tokens reutilizáveis.
- Bloco principal com CTAs empilhados em coluna (desktop), com sensação de layout mobile expandido.
- Hierarquia visual com muitas cores/gradientes simultâneos, sem foco claro de ação primária.
- Botões sem estados explícitos de `:hover/:focus-visible/:active/:disabled` no nível de CSS global de componente.

Prioridade: **P1**

### Startup (`/startup`)
- Melhor estrutura textual/institucional, mas ainda com estética “documento + cards simples”, abaixo de padrão premium enterprise.
- Escala tipográfica conservadora e pouca variação de peso/ritmo para destacar mensagem executiva.
- Cards e tabela com pouca profundidade visual (densidade informativa alta, acabamento mediano).

Prioridade: **P1**

### Demo (`/demo`)
- É uma das telas mais maduras visualmente, porém ainda há densidade alta de informação nos cards.
- Em desktop, o volume de texto por card pode reduzir escaneabilidade executiva rápida.
- Estados interativos estão presentes, mas sem padronização com outras rotas.

Prioridade: **P2**

### Demo Autoplay (`/demo-autoplay`)
- Boa coerência com `/demo`, mas mantém tipografia e espaçamento mais compactos que o ideal para “premium presentation mode”.
- Controles funcionais, porém visualmente utilitários (mais “ferramenta interna” que “apresentação enterprise”).

Prioridade: **P2**

### Serginho (`/serginho`)
- Layout `position: fixed` em tela cheia com linguagem de app mobile/chat.
- Elementos com aparência informal (emojis e múltiplos badges compactos), reduzindo tom institucional.
- Densidade visual alta na base (muitos botões de ação), com hierarquia fraca entre ações principais e secundárias.

Prioridade: **P0**

### Hybrid (`/hybrid`)
- Forte viés de console/tooling técnico (bom para operação, fraco para percepção premium externa).
- Header e painéis densos, com grande volume de informações simultâneas.
- Paleta e microdetalhes destoam de outras telas (inconsistência de identidade visual).

Prioridade: **P0**

### Specialists (`/specialists`)
- Página 100% com inline styles, sem sistema visual reutilizável.
- Escalas pequenas (chips, botões, textos) em desktop, reforçando sensação mobile.
- Cards com aparência genérica (sombras/raios/tamanhos pouco refinados para padrão premium).

Prioridade: **P0**

### Login (`/login`)
- Uso de classes utilitárias estilo Tailwind (`flex`, `bg-gray-900`, etc.) sem evidência de Tailwind no stack atual, gerando risco de visual inconsistente/não aplicado conforme esperado.
- Layout e linguagem visual não seguem o mesmo padrão das demais telas-chave.
- Percepção de tela provisória para etapa crítica do funil (auth).

Prioridade: **P0**

### Navegação, header, footer e layout global
- Header com estilo muito básico para posicionamento premium.
- `index.css` mistura reset global e estilos de navegação genéricos; falta camada de design system.
- `Footer` estilizado existe, mas não está integrado ao layout principal.
- `OptionalSignupBanner` e `ConsentBanner` têm linguagem visual distinta entre si e do restante do produto.

Prioridade: **P0**

---

## 4) Prioridade consolidada de correção (P0/P1/P2)

### P0 (impacto direto em percepção de produto)
1. Consistência visual global (header/layout/base tokens/estados de foco e hover).
2. Refino premium de `/serginho`, `/hybrid`, `/specialists`, `/login`.
3. Redução de “aparência mobile improvisada” em desktop.

### P1 (elevação de qualidade percebida)
1. Refinar hero, ritmo tipográfico e CTAs da Home.
2. Evoluir `/startup` para leitura executiva mais premium.

### P2 (polimento e harmonização)
1. Ajuste fino de densidade e escaneabilidade em `/demo` e `/demo-autoplay`.
2. Microinterações e padronização final de componentes de apoio.

---

## 5) Comparação conceitual com padrão SaaS/IA moderno (sem cópia de marca)

Padrão de referência conceitual observado em produtos premium:
- **Hero com contraste alto** e tipografia display clara (1 mensagem principal + 1 CTA primária inequívoca).
- **Grid de 12 colunas** com gutters consistentes e respiração generosa em desktop.
- **Paleta neutra dominante** com 1 cor de acento (evitar competição de muitos gradientes).
- **Cards com borda suave + sombra discreta + estados previsíveis** (hover/focus) e densidade textual controlada.
- **Escala tipográfica consistente** (display/headline/body/caption) com pesos previsíveis.
- **Estados interativos acessíveis** (`focus-visible` forte, contraste adequado, disabled legível).
- **Mesma linguagem visual entre páginas de landing, produto e auth**.

Gap atual do RKMMAX:
- Boa base funcional, porém sem sistema visual único aplicado ponta a ponta.

---

## 6) Recomendações visuais (sem alterar runtime agora)

1. **Tipografia**
   - Definir escala única (ex.: display, h1, h2, body, caption) e line-height por nível.
   - Reduzir variações ad-hoc de tamanho/peso inline.

2. **Paleta e tokens**
   - Consolidar tokens de cor (fundo, superfície, borda, texto, acento).
   - Limitar gradientes a usos estratégicos.

3. **Espaçamento e layout**
   - Padronizar escala de spacing (ex.: 4/8/12/16/24/32/48).
   - Reforçar layout desktop com containers/gutters consistentes.

4. **Componentes**
   - Criar padrão visual único para botões, cards, badges, inputs, barras de topo.
   - Definir estados de interação e foco visível em todos os componentes-chave.

5. **Hierarquia visual**
   - Clarificar ação principal por tela (1 CTA principal, secundárias de apoio).
   - Reduzir ruído visual e priorizar escaneabilidade executiva.

6. **Acessibilidade básica**
   - Garantir contraste AA em textos e botões críticos.
   - Garantir `:focus-visible` consistente para teclado.

---

## 7) Riscos de mexer demais agora

- Regressão visual em rotas críticas (chat, builder, auth) por mudanças amplas sem faseamento.
- Quebra de fluxo de uso já conhecido por usuários atuais.
- Retrabalho por redesign grande sem design tokens definidos antes.
- Perda de consistência temporária se ajustes forem feitos tela a tela sem base comum.

Mitigação: evolução faseada (tokens → layout base → componentes → polimento), com PRs pequenos e reversíveis.

---

## 8) Proposta de sequência segura (F7-UX-02+)

- **F7-UX-02**: definir design tokens globais (cores, tipografia, spacing, radius, shadow, foco).
- **F7-UX-03**: refino de header/navegação e estrutura global de layout desktop.
- **F7-UX-04**: padronização premium de botões, inputs, cards e badges.
- **F7-UX-05**: refino de Home e `/startup` com hierarquia executiva.
- **F7-UX-06**: refino de `/serginho` e `/hybrid` para equilíbrio entre operação e apresentação premium.
- **F7-UX-07**: refino de `/specialists` e `/login` com padrão visual unificado.
- **F7-UX-08**: acessibilidade visual final + QA cross-screen + checklist de consistência.

---

## 9) O que NÃO deve ser alterado agora

- Serginho como orquestrador soberano.
- Runtime funcional do Híbrido/Construtor (geração/validação/preview/revisão/exportação).
- Especialistas de domínio.
- ABNT (validação/conformidade).
- Camada Auth/SaaS/Payments.
- Providers/modelos/prompts.
- Reativação de `executeArtifact`.
- Qualquer bypass do Serginho.

---

## 10) Critérios de sucesso para front-end premium (mensuráveis)

1. **Consistência**: mesmas regras de tipografia, cores, raios, sombras e espaçamento em todas as telas alvo.
2. **Hierarquia**: cada tela com CTA primária clara em até 3 segundos de leitura.
3. **Desktop-first premium**: layouts principais sem aparência de “mobile ampliado”.
4. **Componentes**: botões/inputs/cards com estados `default/hover/focus/disabled` padronizados.
5. **Acessibilidade básica**: contraste AA e foco visível navegável por teclado nas ações críticas.
6. **Percepção executiva**: avaliação interna qualitativa (banca/incubadora/investidor) sem sinais de “interface improvisada”.
7. **Segurança de evolução**: zero alteração de runtime funcional durante a trilha F7-UX.

---

## 11) Registro de escopo desta entrega (F7-UX-01)

- Esta fase é **apenas auditoria**.
- Não houve proposta de redesign amplo neste PR.
- Não houve alteração de runtime, endpoints, providers, modelos ou prompts.
