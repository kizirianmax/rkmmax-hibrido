/**
 * Testes estáticos para premiumWebPresets.js
 *
 * Verificam:
 * 1. Paletas de design contêm todas as variáveis CSS obrigatórias
 * 2. Presets de estrutura existem para os 3 tipos de página
 * 3. Blocos CSS contêm os padrões premium obrigatórios
 * 4. Blocos JS contêm IntersectionObserver e smooth scroll
 * 5. Copy patterns existem para hero, CTA e benefit cards
 * 6. getWebPresetBlock() retorna bloco condensado com todos os elementos
 */

import {
  DESIGN_PALETTES,
  PAGE_STRUCTURE_PRESETS,
  PREMIUM_CSS_BLOCKS,
  PREMIUM_JS_BLOCKS,
  COPY_PATTERNS,
  getWebPresetBlock,
} from '../premiumWebPresets.js';

// ─── Bloco 1: Paletas de Design Premium ──────────────────────────────────────

describe('DESIGN_PALETTES — paletas premium', () => {
  const REQUIRED_CSS_VARS = [
    '--color-primary',
    '--color-primary-light',
    '--color-accent',
    '--color-bg',
    '--color-bg-card',
    '--color-text',
    '--color-text-muted',
    '--color-border',
    '--font-heading',
    '--font-body',
    '--radius',
    '--shadow',
    '--transition',
  ];

  it('contém 4 paletas premium', () => {
    expect(Object.keys(DESIGN_PALETTES)).toHaveLength(4);
  });

  it('contém as paletas midnightPro, sunriseWarm, oceanCorporate, natureFresh', () => {
    expect(DESIGN_PALETTES).toHaveProperty('midnightPro');
    expect(DESIGN_PALETTES).toHaveProperty('sunriseWarm');
    expect(DESIGN_PALETTES).toHaveProperty('oceanCorporate');
    expect(DESIGN_PALETTES).toHaveProperty('natureFresh');
  });

  describe.each(Object.entries(DESIGN_PALETTES))('paleta %s', (key, palette) => {
    it('tem propriedades name, mood, font, googleFont, css', () => {
      expect(palette).toHaveProperty('name');
      expect(palette).toHaveProperty('mood');
      expect(palette).toHaveProperty('font');
      expect(palette).toHaveProperty('googleFont');
      expect(palette).toHaveProperty('css');
    });

    it.each(REQUIRED_CSS_VARS)('css contém variável %s', (cssVar) => {
      expect(palette.css).toContain(cssVar);
    });

    it('googleFont aponta para fonts.googleapis.com', () => {
      expect(palette.googleFont).toContain('fonts.googleapis.com');
    });
  });

  it('paletas usam cores primárias distintas (não todas roxo)', () => {
    const primaries = Object.values(DESIGN_PALETTES).map(p => {
      const match = p.css.match(/--color-primary:\s*(#[0-9A-Fa-f]{6})/);
      return match ? match[1].toUpperCase() : null;
    });
    const uniquePrimaries = new Set(primaries);
    expect(uniquePrimaries.size).toBeGreaterThanOrEqual(3);
  });
});

// ─── Bloco 2: Presets de Estrutura por Tipo de Página ────────────────────────

describe('PAGE_STRUCTURE_PRESETS — estrutura por tipo de página', () => {
  it('contém preset para landingPage', () => {
    expect(PAGE_STRUCTURE_PRESETS).toHaveProperty('landingPage');
  });

  it('contém preset para institutionalProduct', () => {
    expect(PAGE_STRUCTURE_PRESETS).toHaveProperty('institutionalProduct');
  });

  it('contém preset para startupPresentation', () => {
    expect(PAGE_STRUCTURE_PRESETS).toHaveProperty('startupPresentation');
  });

  describe('landingPage', () => {
    it('tem 7 ou mais seções obrigatórias', () => {
      expect(PAGE_STRUCTURE_PRESETS.landingPage.sections.length).toBeGreaterThanOrEqual(7);
    });

    it('inclui seção navbar', () => {
      const ids = PAGE_STRUCTURE_PRESETS.landingPage.sections.map(s => s.id);
      expect(ids).toContain('navbar');
    });

    it('inclui seção hero', () => {
      const ids = PAGE_STRUCTURE_PRESETS.landingPage.sections.map(s => s.id);
      expect(ids).toContain('hero');
    });

    it('inclui seção cta-final', () => {
      const ids = PAGE_STRUCTURE_PRESETS.landingPage.sections.map(s => s.id);
      expect(ids).toContain('cta-final');
    });

    it('inclui seção footer', () => {
      const ids = PAGE_STRUCTURE_PRESETS.landingPage.sections.map(s => s.id);
      expect(ids).toContain('footer');
    });

    it('inclui seção faq com accordion', () => {
      const faqSection = PAGE_STRUCTURE_PRESETS.landingPage.sections.find(s => s.id === 'faq');
      expect(faqSection).toBeDefined();
      expect(faqSection.description.toLowerCase()).toContain('accordion');
    });

    it('cada seção tem id, label e description', () => {
      PAGE_STRUCTURE_PRESETS.landingPage.sections.forEach(s => {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('label');
        expect(s).toHaveProperty('description');
      });
    });
  });

  describe('institutionalProduct', () => {
    it('tem 6 ou mais seções', () => {
      expect(PAGE_STRUCTURE_PRESETS.institutionalProduct.sections.length).toBeGreaterThanOrEqual(6);
    });

    it('inclui seção hero-product', () => {
      const ids = PAGE_STRUCTURE_PRESETS.institutionalProduct.sections.map(s => s.id);
      expect(ids).toContain('hero-product');
    });

    it('inclui seção features-grid', () => {
      const ids = PAGE_STRUCTURE_PRESETS.institutionalProduct.sections.map(s => s.id);
      expect(ids).toContain('features-grid');
    });

    it('inclui seção trust-badges', () => {
      const ids = PAGE_STRUCTURE_PRESETS.institutionalProduct.sections.map(s => s.id);
      expect(ids).toContain('trust-badges');
    });
  });

  describe('startupPresentation', () => {
    it('tem 7 ou mais seções', () => {
      expect(PAGE_STRUCTURE_PRESETS.startupPresentation.sections.length).toBeGreaterThanOrEqual(7);
    });

    it('inclui seção hero-statement', () => {
      const ids = PAGE_STRUCTURE_PRESETS.startupPresentation.sections.map(s => s.id);
      expect(ids).toContain('hero-statement');
    });

    it('inclui seção problem', () => {
      const ids = PAGE_STRUCTURE_PRESETS.startupPresentation.sections.map(s => s.id);
      expect(ids).toContain('problem');
    });

    it('inclui seção traction com counters', () => {
      const tractionSection = PAGE_STRUCTURE_PRESETS.startupPresentation.sections.find(s => s.id === 'traction');
      expect(tractionSection).toBeDefined();
      expect(tractionSection.description.toLowerCase()).toContain('counter');
    });

    it('inclui seção roadmap', () => {
      const ids = PAGE_STRUCTURE_PRESETS.startupPresentation.sections.map(s => s.id);
      expect(ids).toContain('roadmap');
    });
  });
});

// ─── Bloco 3: Blocos CSS Premium ─────────────────────────────────────────────

describe('PREMIUM_CSS_BLOCKS — blocos CSS premium', () => {
  it('contém glassMorphismNavbar', () => {
    expect(PREMIUM_CSS_BLOCKS).toHaveProperty('glassMorphismNavbar');
  });

  it('glassMorphismNavbar usa backdrop-filter blur', () => {
    expect(PREMIUM_CSS_BLOCKS.glassMorphismNavbar).toContain('backdrop-filter');
    expect(PREMIUM_CSS_BLOCKS.glassMorphismNavbar).toContain('blur');
  });

  it('glassMorphismNavbar usa position sticky', () => {
    expect(PREMIUM_CSS_BLOCKS.glassMorphismNavbar).toContain('sticky');
  });

  it('contém gradientText com background-clip', () => {
    expect(PREMIUM_CSS_BLOCKS.gradientText).toContain('-webkit-background-clip');
    expect(PREMIUM_CSS_BLOCKS.gradientText).toContain('background-clip');
  });

  it('contém cardHoverAnimation com transform translateY', () => {
    expect(PREMIUM_CSS_BLOCKS.cardHoverAnimation).toContain('translateY');
    expect(PREMIUM_CSS_BLOCKS.cardHoverAnimation).toContain(':hover');
  });

  it('contém scrollFadeIn com classe visible', () => {
    expect(PREMIUM_CSS_BLOCKS.scrollFadeIn).toContain('.fade-in');
    expect(PREMIUM_CSS_BLOCKS.scrollFadeIn).toContain('.visible');
  });

  it('contém responsiveGrid com @media breakpoints', () => {
    expect(PREMIUM_CSS_BLOCKS.responsiveGrid).toContain('@media');
    expect(PREMIUM_CSS_BLOCKS.responsiveGrid).toContain('max-width');
  });

  it('contém buttonVariants com btn-primary, btn-ghost', () => {
    expect(PREMIUM_CSS_BLOCKS.buttonVariants).toContain('.btn-primary');
    expect(PREMIUM_CSS_BLOCKS.buttonVariants).toContain('.btn-ghost');
  });

  it('contém typographyScale com clamp e line-height', () => {
    expect(PREMIUM_CSS_BLOCKS.typographyScale).toContain('clamp');
    expect(PREMIUM_CSS_BLOCKS.typographyScale).toContain('line-height');
  });
});

// ─── Bloco 4: Blocos JS Premium ───────────────────────────────────────────────

describe('PREMIUM_JS_BLOCKS — blocos JS premium', () => {
  it('contém smoothScrollWithOffset com offset para navbar', () => {
    expect(PREMIUM_JS_BLOCKS.smoothScrollWithOffset).toContain('window.scrollTo');
  });

  it('smoothScrollWithOffset usa behavior smooth', () => {
    expect(PREMIUM_JS_BLOCKS.smoothScrollWithOffset).toContain("behavior: 'smooth'");
  });

  it('smoothScrollWithOffset compensa altura da navbar (offset)', () => {
    expect(PREMIUM_JS_BLOCKS.smoothScrollWithOffset).toContain('offsetHeight');
  });

  it('contém intersectionObserverFadeIn com IntersectionObserver', () => {
    expect(PREMIUM_JS_BLOCKS.intersectionObserverFadeIn).toContain('IntersectionObserver');
  });

  it('intersectionObserverFadeIn adiciona classe visible', () => {
    expect(PREMIUM_JS_BLOCKS.intersectionObserverFadeIn).toContain('visible');
  });

  it('contém navbarScrollEffect com classe scrolled', () => {
    expect(PREMIUM_JS_BLOCKS.navbarScrollEffect).toContain('scrolled');
    expect(PREMIUM_JS_BLOCKS.navbarScrollEffect).toContain('scroll');
  });

  it('contém counterAnimation com requestAnimationFrame e data-target', () => {
    expect(PREMIUM_JS_BLOCKS.counterAnimation).toContain('requestAnimationFrame');
    expect(PREMIUM_JS_BLOCKS.counterAnimation).toContain('data-target');
  });

  it('counterAnimation usa IntersectionObserver para disparar', () => {
    expect(PREMIUM_JS_BLOCKS.counterAnimation).toContain('IntersectionObserver');
  });

  it('contém faqAccordion com maxHeight e toggle de classe open', () => {
    expect(PREMIUM_JS_BLOCKS.faqAccordion).toContain('maxHeight');
    expect(PREMIUM_JS_BLOCKS.faqAccordion).toContain('open');
  });

  it('contém mobileMenuHamburger com aria-expanded', () => {
    expect(PREMIUM_JS_BLOCKS.mobileMenuHamburger).toContain('aria-expanded');
  });

  it('contém typingEffect para headline', () => {
    expect(PREMIUM_JS_BLOCKS.typingEffect).toContain('typeWriter');
  });
});

// ─── Bloco 5: Copy Patterns ───────────────────────────────────────────────────

describe('COPY_PATTERNS — padrões de copy', () => {
  it('contém heroHeadlines com ao menos 4 padrões', () => {
    expect(COPY_PATTERNS.heroHeadlines.length).toBeGreaterThanOrEqual(4);
  });

  it('heroHeadlines inclui padrão "Pare de X. Comece a Y."', () => {
    const hasPattern = COPY_PATTERNS.heroHeadlines.some(h => h.includes('Pare de') && h.includes('Comece'));
    expect(hasPattern).toBe(true);
  });

  it('contém ctaPatterns com ao menos 4 CTAs', () => {
    expect(COPY_PATTERNS.ctaPatterns.length).toBeGreaterThanOrEqual(4);
  });

  it('ctaPatterns inclui "Começar agora"', () => {
    const hasComecando = COPY_PATTERNS.ctaPatterns.some(c => c.includes('Começar'));
    expect(hasComecando).toBe(true);
  });

  it('ctaPatterns inclui CTA para demonstração', () => {
    const hasDemo = COPY_PATTERNS.ctaPatterns.some(c => c.toLowerCase().includes('demonstra'));
    expect(hasDemo).toBe(true);
  });

  it('contém benefitCardPatterns com ao menos 1 padrão', () => {
    expect(COPY_PATTERNS.benefitCardPatterns.length).toBeGreaterThanOrEqual(1);
  });

  it('benefitCardPatterns menciona emoji e resultado', () => {
    const hasEmoji = COPY_PATTERNS.benefitCardPatterns.some(p => p.includes('Emoji'));
    expect(hasEmoji).toBe(true);
  });

  it('contém sectionTransitions com ao menos 4 transições', () => {
    expect(COPY_PATTERNS.sectionTransitions.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── Bloco 6: getWebPresetBlock() — bloco condensado para injeção no prompt ──

describe('getWebPresetBlock() — bloco para injeção no prompt hybrid', () => {
  let block;

  beforeAll(() => {
    block = getWebPresetBlock();
  });

  it('retorna uma string não-vazia', () => {
    expect(typeof block).toBe('string');
    expect(block.length).toBeGreaterThan(500);
  });

  it('contém header "PRESETS PREMIUM PARA ARTEFATOS WEB"', () => {
    expect(block).toContain('PRESETS PREMIUM PARA ARTEFATOS WEB');
  });

  it('contém instrução de seleção de paleta baseada no contexto', () => {
    expect(block).toContain('Analise o pedido e selecione a paleta');
  });

  it('menciona todas as 4 paletas de design por nome', () => {
    expect(block).toContain('Midnight Pro');
    expect(block).toContain('Sunrise Warm');
    expect(block).toContain('Ocean Corporate');
    expect(block).toContain('Nature Fresh');
  });

  it('contém instrução para não usar sempre a mesma cor roxa', () => {
    expect(block).toContain('NÃO use sempre a mesma paleta roxa');
  });

  it('contém estrutura para Landing Page Premium', () => {
    expect(block).toContain('Landing Page Premium');
  });

  it('contém estrutura para Página Institucional de Produto', () => {
    expect(block).toContain('Página Institucional de Produto');
  });

  it('contém estrutura para Apresentação de Startup', () => {
    expect(block).toContain('Apresentação de Startup');
  });

  it('contém blocos CSS com backdrop-filter (glass morphism)', () => {
    expect(block).toContain('backdrop-filter');
  });

  it('contém blocos CSS com fade-in para IntersectionObserver', () => {
    expect(block).toContain('.fade-in');
    expect(block).toContain('.visible');
  });

  it('contém blocos JS com IntersectionObserver', () => {
    expect(block).toContain('IntersectionObserver');
  });

  it('contém blocos JS com smooth scroll', () => {
    expect(block).toContain("behavior: 'smooth'");
  });

  it('contém blocos JS com counter animation (data-target)', () => {
    expect(block).toContain('data-target');
  });

  it('contém blocos JS com FAQ accordion', () => {
    expect(block).toContain('faq-item');
    expect(block).toContain('maxHeight');
  });

  it('contém copy patterns de hero headlines', () => {
    expect(block).toContain('Pare de');
    expect(block).toContain('Comece');
  });

  it('contém copy patterns de CTAs', () => {
    expect(block).toContain('Começar agora');
  });

  it('contém few-shot de página institucional com HTML completo', () => {
    expect(block).toContain('FEW-SHOT: PÁGINA INSTITUCIONAL DE PRODUTO');
    expect(block).toContain('DataStream');
    expect(block).toContain('Ver demonstração');
  });

  it('contém few-shot de apresentação de startup com HTML completo', () => {
    expect(block).toContain('FEW-SHOT: APRESENTAÇÃO DE STARTUP');
    expect(block).toContain('GreenRoute');
    expect(block).toContain('logística');
  });

  it('few-shots contêm HTML5 semântico completo (DOCTYPE, html, head, body)', () => {
    expect(block).toContain('<!DOCTYPE html>');
    expect(block).toContain('<html lang="pt-BR">');
    expect(block).toContain('</body>');
  });

  it('contém regra crítica final sobre paletas, estrutura e JS', () => {
    expect(block).toContain('REGRA CRÍTICA');
    expect(block).toContain('IntersectionObserver');
  });
});
