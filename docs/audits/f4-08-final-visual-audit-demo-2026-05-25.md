# F4-08 — Auditoria Visual Final da Demo em Produção

**Data:** 2026-05-25  
**Fase:** 4 — Demo/Showcase  
**Passo:** F4-08  
**Auditor:** Copilot Coding Agent  
**Status:** ✅ CONCLUÍDO — Correção mínima aplicada

---

## O que foi auditado

- `src/pages/Demo.jsx` — estrutura JSX, hero, seções, cards, previews, footer
- `src/pages/Demo.css` — estilos de todos os elementos, mobile (480px, 720px, 1024px) e desktop
- Revisão de espaçamentos, tipografia, badges, botões, CTA, previews e footer
- Cobertura de viewports: 320px, 375px, 480px, 720px, 1024px+

---

## Resultado da auditoria — elementos verificados

| Elemento | Status | Observação |
|----------|--------|------------|
| Hero (`demo-page__hero`) | ✅ OK | Padding, border, box-shadow e tipografia adequados |
| CTA autoplay | ✅ OK | min-height 44px, width 100% no mobile, gradiente correto |
| Notice badge | ✅ OK | display block no mobile, word-break configurado |
| Section titles | ✅ OK | border-left accent visível, fonte 1.12rem/700 |
| Cards grid | ✅ OK | 1-col → 2-col → 3-col responsivo |
| Card header badges | ✅ OK | flex-wrap, tamanho uniforme 0.72rem |
| Card title | ✅ OK | margin: 0, font-weight 700, cor #f8fafc |
| Card description | ✅ OK | margin-top 8px, line-height 1.55 |
| Card problem/stack/score | ✅ OK | margin: 8px 0 0 uniformes |
| Card rastreabilidade | ✅ OK | usa classe demo-card__stack, hierarquia visual correta |
| **Card hint** | **🔧 CORRIGIDO** | **margin-top 8px adicionado (faltava — reset global zeroa tudo)** |
| Card footer/actions | ✅ OK | border-top, margin-top 18px, botões responsivos |
| Botões "Ver exemplo"/"Ver estrutura" | ✅ OK | min-width 96px, gradiente, hover com outline de foco |
| Listas (ul/ol) | ✅ OK | padding-left 20px, li + li com gap 6px |
| Previews estáticos | ✅ OK | border, border-radius 14px, h3 #f8fafc, p #cbd5e1 |
| Footer da página | ✅ OK | padding 20/16px responsive, links em bloco no mobile |
| Mobile 480px | ✅ OK | todos os targets de toque ≥44px, sem overflow horizontal |
| Desktop 1024px+ | ✅ OK | grid 3 colunas, espaçamentos corretos |

---

## Correção aplicada

**Arquivo:** `src/pages/Demo.css`  
**Classe:** `.demo-card__hint`  
**Problema:** A propriedade `margin` estava ausente. O reset global (`* { margin: 0; padding: 0; }` em `src/index.css`) zera todos os margens de parágrafo, incluindo o `<p className="demo-card__hint">`. Isso fazia o texto de disclaimer aparecer colado ao bloco de rastreabilidade acima, sem o espaçamento de 8px presente em todos os demais parágrafos do card.

**Fix:**
```css
/* Antes */
.demo-card__hint {
  color: #64748b;
  font-size: 0.78rem;
}

/* Depois */
.demo-card__hint {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 0.78rem;
}
```

**Impacto:** Puramente visual — o texto de disclaimer agora tem o mesmo espaçamento de 8px acima que os demais parágrafos do card, mantendo consistência visual com `.demo-card__problem`, `.demo-card__stack` e `.demo-card__score`.

---

## Escopo desta auditoria

- Alteração exclusivamente visual/CSS da demo estática
- Nenhum runtime alterado
- Sem novas dependências
- Serginho, Construtor, Especialistas, Auth, SaaS, Payments, ABNT inalterados

---

## Validação executada

- `npm run build` — PASS
- `npm test -- --runInBand` — PASS

---

## Rollback

```
git revert <commit-sha>
```

---

## Declaração de encerramento

F4-08 concluído. A página `/demo` foi auditada visualmente em mobile e desktop. Uma correção mínima de espaçamento foi aplicada. A vitrine está pronta para apresentação a banca/incubadora.
