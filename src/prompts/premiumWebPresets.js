/**
 * RKMMAX Premium Web Presets
 * Presets de alta qualidade para artefatos web gerados pelo Construtor/Híbrido.
 *
 * Conteúdo:
 * A. Paletas de design premium (4 paletas com variáveis CSS completas)
 * B. Presets de estrutura por tipo de página (landing, institucional, startup)
 * C. Blocos CSS premium reutilizáveis
 * D. Blocos JS premium reutilizáveis
 * E. Biblioteca de copy patterns
 *
 * Exportação principal: getWebPresetBlock() — bloco de texto pronto para injeção no prompt
 */

// ─── A. Paletas de Design Premium ────────────────────────────────────────────

export const DESIGN_PALETTES = {
  midnightPro: {
    name: 'Midnight Pro',
    mood: 'dark premium — ideal para tech, SaaS, IA, ferramentas de produtividade',
    font: 'Inter',
    googleFont: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    css: `
:root {
  --color-primary: #7C3AED;
  --color-primary-light: #A78BFA;
  --color-accent: #06FFA5;
  --color-bg: #0D0D14;
  --color-bg-surface: #16161F;
  --color-bg-card: #1E1E2E;
  --color-text: #F0F0FF;
  --color-text-muted: #8B8BA8;
  --color-border: rgba(124,58,237,0.2);
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --radius: 12px;
  --radius-lg: 20px;
  --shadow: 0 4px 32px rgba(124,58,237,0.2);
  --shadow-card: 0 2px 16px rgba(0,0,0,0.4);
  --transition: 0.25s ease;
}`,
  },

  sunriseWarm: {
    name: 'Sunrise Warm',
    mood: 'warm / friendly — ideal para startups, criativos, educação, bem-estar',
    font: 'Plus Jakarta Sans',
    googleFont: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    css: `
:root {
  --color-primary: #F97316;
  --color-primary-light: #FED7AA;
  --color-accent: #8B5CF6;
  --color-bg: #FFFBF7;
  --color-bg-surface: #FEF3E2;
  --color-bg-card: #FFFFFF;
  --color-text: #1C1917;
  --color-text-muted: #78716C;
  --color-border: rgba(249,115,22,0.15);
  --font-heading: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --radius: 14px;
  --radius-lg: 24px;
  --shadow: 0 4px 24px rgba(249,115,22,0.15);
  --shadow-card: 0 2px 12px rgba(0,0,0,0.06);
  --transition: 0.3s ease;
}`,
  },

  oceanCorporate: {
    name: 'Ocean Corporate',
    mood: 'corporate blue — ideal para institucional, B2B, consultorias, finanças',
    font: 'DM Sans',
    googleFont: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap",
    css: `
:root {
  --color-primary: #1D4ED8;
  --color-primary-light: #DBEAFE;
  --color-accent: #0EA5E9;
  --color-bg: #F8FAFC;
  --color-bg-surface: #EFF6FF;
  --color-bg-card: #FFFFFF;
  --color-text: #0F172A;
  --color-text-muted: #64748B;
  --color-border: rgba(29,78,216,0.12);
  --font-heading: 'DM Sans', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --radius: 10px;
  --radius-lg: 18px;
  --shadow: 0 4px 20px rgba(29,78,216,0.12);
  --shadow-card: 0 1px 8px rgba(0,0,0,0.06);
  --transition: 0.2s ease;
}`,
  },

  natureFresh: {
    name: 'Nature Fresh',
    mood: 'green / organic — ideal para sustentabilidade, saúde, alimentação, impacto social',
    font: 'Nunito',
    googleFont: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap",
    css: `
:root {
  --color-primary: #16A34A;
  --color-primary-light: #DCFCE7;
  --color-accent: #F59E0B;
  --color-bg: #F7FFF9;
  --color-bg-surface: #ECFDF5;
  --color-bg-card: #FFFFFF;
  --color-text: #14532D;
  --color-text-muted: #6B7280;
  --color-border: rgba(22,163,74,0.15);
  --font-heading: 'Nunito', sans-serif;
  --font-body: 'Nunito', sans-serif;
  --radius: 16px;
  --radius-lg: 28px;
  --shadow: 0 4px 20px rgba(22,163,74,0.15);
  --shadow-card: 0 2px 10px rgba(0,0,0,0.05);
  --transition: 0.3s ease;
}`,
  },
};

// ─── B. Presets de Estrutura por Tipo de Página ───────────────────────────────

export const PAGE_STRUCTURE_PRESETS = {
  landingPage: {
    name: 'Landing Page Premium',
    sections: [
      {
        id: 'navbar',
        label: 'Navbar Sticky com Glass Effect',
        description: 'Logo + links de navegação + CTA primário. Position sticky, backdrop-filter blur, sombra ao rolar.',
      },
      {
        id: 'hero',
        label: 'Hero com Split Layout',
        description: 'Lado esquerdo: headline magnética (H1 grande, clamp), subtítulo persuasivo, 2 CTAs (primário + secundário). Lado direito: visual placeholder com gradiente ou mockup. Mobile: stack vertical.',
      },
      {
        id: 'social-proof',
        label: 'Social Proof / Trust Bar',
        description: 'Logos de clientes/parceiros ou métricas em destaque (ex: "+5.000 usuários", "4.9★"). Grid horizontal com separadores.',
      },
      {
        id: 'benefits',
        label: 'Benefícios / Features Grid',
        description: 'Grid 3 colunas (2 em tablet, 1 em mobile). Cada card: emoji/ícone + título curto + 2-3 linhas de benefício orientado ao resultado. Hover animation.',
      },
      {
        id: 'how-it-works',
        label: 'Como Funciona (3 passos)',
        description: 'Numeração grande colorida (01, 02, 03) + título + parágrafo explicativo. Layout horizontal desktop, vertical mobile.',
      },
      {
        id: 'faq',
        label: 'FAQ com Accordion JS',
        description: '4-6 perguntas frequentes. Accordion com animação de expand/collapse. Cada item: ícone + / − com rotação CSS.',
      },
      {
        id: 'cta-final',
        label: 'CTA Final Full-Bleed',
        description: 'Seção com background primary color ou gradiente. Headline reforçando a proposta de valor, subtítulo curto, botão CTA grande, zero distrações.',
      },
      {
        id: 'footer',
        label: 'Footer Rico com Colunas',
        description: 'Grid 4 colunas: logo + tagline | Links produto | Links empresa | Newsletter/Contato. Copyright. Links de redes sociais com ícones SVG inline.',
      },
    ],
  },

  institutionalProduct: {
    name: 'Página Institucional de Produto',
    sections: [
      {
        id: 'navbar',
        label: 'Navbar Institucional',
        description: 'Logo + navegação com dropdown (se necessário) + CTA "Ver demonstração" ou "Falar com vendas".',
      },
      {
        id: 'hero-product',
        label: 'Hero com Product Showcase',
        description: 'Headline focada no produto, subtítulo com proposta única de valor, CTA duplo, placeholder de screenshot/vídeo do produto com frame.',
      },
      {
        id: 'features-grid',
        label: 'Features Grid com Iconografia',
        description: 'Grid de 6 features (2×3 ou 3×2). Cada feature: ícone SVG inline ou emoji + título + descrição concisa do diferencial.',
      },
      {
        id: 'specs-tabs',
        label: 'Especificações / Tabs ou Accordion',
        description: 'Tabs JS para alternar entre categorias de features ou planos. Cada tab com lista de itens com checkmarks.',
      },
      {
        id: 'trust-badges',
        label: 'Trust Badges / Certificações',
        description: 'Barra de logos (clientes ou prêmios) + depoimento em destaque com avatar placeholder e nome/cargo.',
      },
      {
        id: 'cta-demo',
        label: 'CTA de Contato / Demonstração',
        description: 'Formulário simples (nome, email, empresa) ou botões de contato direto. Fundo contrastante.',
      },
      {
        id: 'footer-institutional',
        label: 'Footer Institucional',
        description: 'Completo com endereço/contato, links legais, redes sociais.',
      },
    ],
  },

  startupPresentation: {
    name: 'Apresentação de Startup / Produto',
    sections: [
      {
        id: 'navbar',
        label: 'Navbar Minimalista',
        description: 'Logo + 2-3 links + CTA "Quero acesso antecipado" ou "Investir".',
      },
      {
        id: 'hero-statement',
        label: 'Hero Statement Bold',
        description: 'Headline de impacto máximo (fonte grande, peso 800+). Tagline de uma linha. CTA principal. Visual de fundo com gradiente dinâmico ou partículas CSS.',
      },
      {
        id: 'problem',
        label: 'Problema / Oportunidade',
        description: 'Seção emocional descrevendo a dor do mercado com dados (placeholder seguro) e visual de impacto. Máximo 3 pontos de dor.',
      },
      {
        id: 'solution',
        label: 'Solução / Produto Showcase',
        description: 'Como o produto resolve o problema. Split layout: copy + mockup/diagrama placeholder. Destaque para o diferencial único.',
      },
      {
        id: 'traction',
        label: 'Traction / Métricas',
        description: 'Counter animado com JS para números de tração (usuários, ARR, parceiros). Placeholders seguros. Fundo escuro contrastante.',
      },
      {
        id: 'team',
        label: 'Time / Visão',
        description: 'Grid de fundadores: avatar circular placeholder + nome + cargo + LinkedIn icon. Parágrafo de visão abaixo.',
      },
      {
        id: 'roadmap',
        label: 'Roadmap Visual',
        description: 'Timeline horizontal (desktop) / vertical (mobile). 4 marcos com ícone, período e descrição curta.',
      },
      {
        id: 'investor-cta',
        label: 'CTA para Investidor / Parceiro',
        description: 'Headline de urgência/oportunidade, formulário de contato ou link direto para deck/email.',
      },
    ],
  },
};

// ─── C. Blocos CSS Premium Reutilizáveis ──────────────────────────────────────

export const PREMIUM_CSS_BLOCKS = {
  glassMorphismNavbar: `
/* Glass Morphism Navbar */
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  padding: 1rem 0;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  transition: var(--transition);
}
.navbar.scrolled {
  background: rgba(255,255,255,0.92);
  box-shadow: var(--shadow-card);
}`,

  gradientText: `
/* Gradient Text Effect */
.gradient-text {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}`,

  cardHoverAnimation: `
/* Card Hover Animations */
.card {
  background: var(--color-bg-card);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
  padding: 2rem;
  transition: var(--transition);
  will-change: transform;
}
.card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow);
  border-color: var(--color-primary-light);
}`,

  scrollFadeIn: `
/* Scroll Fade-In via IntersectionObserver class toggle */
.fade-in {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.fade-in.visible {
  opacity: 1;
  transform: translateY(0);
}`,

  responsiveGrid: `
/* Premium Responsive Grid */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
@media (max-width: 1024px) {
  .grid-3 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .grid-3 { grid-template-columns: 1fr; gap: 1.25rem; }
}`,

  buttonVariants: `
/* Button Variants */
.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.875rem 2rem; border-radius: var(--radius); font-weight: 700; font-size: 1rem; cursor: pointer; border: none; transition: var(--transition); text-decoration: none; }
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow); }
.btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
.btn-secondary { background: var(--color-primary-light); color: var(--color-primary); }
.btn-secondary:hover { filter: brightness(0.95); transform: translateY(-2px); }
.btn-ghost { background: transparent; color: var(--color-primary); border: 2px solid var(--color-primary); }
.btn-ghost:hover { background: var(--color-primary); color: #fff; }`,

  typographyScale: `
/* Typography Scale */
h1 { font-size: clamp(2.2rem, 5vw, 3.75rem); font-weight: 800; line-height: 1.12; letter-spacing: -0.02em; }
h2 { font-size: clamp(1.75rem, 3.5vw, 2.75rem); font-weight: 700; line-height: 1.2; }
h3 { font-size: clamp(1.2rem, 2vw, 1.5rem); font-weight: 600; line-height: 1.35; }
p { line-height: 1.7; color: var(--color-text-muted); }
.lead { font-size: 1.2rem; line-height: 1.65; }`,
};

// ─── D. Blocos JS Premium Reutilizáveis ───────────────────────────────────────

export const PREMIUM_JS_BLOCKS = {
  smoothScrollWithOffset: `
// Smooth scroll com offset para navbar sticky
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    const offset = document.querySelector('.navbar')?.offsetHeight || 72;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});`,

  intersectionObserverFadeIn: `
// IntersectionObserver — fade-in / slide-up ao entrar na viewport
const fadeObserver = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); } }),
  { threshold: 0.12 }
);
document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));`,

  navbarScrollEffect: `
// Navbar: adiciona classe .scrolled ao rolar
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
}`,

  counterAnimation: `
// Counter animation para métricas/traction
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString('pt-BR') + (el.dataset.suffix || '');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); } });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));`,

  faqAccordion: `
// FAQ Accordion toggle
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-answer').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});`,

  mobileMenuHamburger: `
// Mobile menu hamburger toggle
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
if (menuToggle && mobileMenu) {
  menuToggle.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
}`,

  typingEffect: `
// Typing effect para headline (opcional)
function typeWriter(el, text, speed = 60) {
  let i = 0;
  el.textContent = '';
  const type = () => { if (i < text.length) { el.textContent += text[i++]; setTimeout(type, speed); } };
  type();
}
// Uso: typeWriter(document.querySelector('.typing-headline'), 'Seu título aqui');`,
};

// ─── E. Biblioteca de Copy Patterns ──────────────────────────────────────────

export const COPY_PATTERNS = {
  heroHeadlines: [
    'Pare de [problema comum]. Comece a [resultado desejado].',
    'O [produto/serviço] que [resultado transformador] — sem [dor ou fricção].',
    '[Resultado concreto] em [prazo ou forma] para [persona].',
    'Tudo que você precisa para [objetivo]. Nada que atrapalha.',
    'De [estado atual ruim] para [estado futuro desejado] — em [prazo ou passos].',
  ],

  ctaPatterns: [
    'Começar agora — é grátis',
    'Quero acesso antecipado',
    'Ver demonstração ao vivo',
    'Acelerar meus resultados',
    'Falar com especialista',
    'Testar por 14 dias grátis',
  ],

  benefitCardPatterns: [
    '[Emoji] **[Título orientado ao resultado]** — [2-3 linhas descrevendo como isso elimina uma dor ou entrega um ganho específico para o usuário].',
    '[Emoji] **[Título com verbo de ação]** — [benefício concreto com contexto de uso real].',
  ],

  sectionTransitions: [
    'Hero → Social Proof: "Mais de [X] profissionais já usam o [produto]"',
    'Features → How it works: "Veja como funciona na prática"',
    'How it works → Testimonials: "Não acredite só em nós — veja quem já usa"',
    'Testimonials → Pricing: "Escolha o plano ideal para você"',
    'Pricing → FAQ: "Ficou alguma dúvida?"',
    'FAQ → CTA Final: "Pronto para começar?"',
  ],
};

// ─── Função principal: getWebPresetBlock() ────────────────────────────────────

/**
 * Retorna bloco de texto condensado com presets premium para injeção no prompt hybrid.
 * Inclui:
 * - Instrução de seleção de paleta baseada no contexto
 * - Resumo dos templates de estrutura por tipo de página
 * - Blocos CSS/JS prontos a serem usados como referência
 * - Copy patterns compactos
 * - Few-shot adicional (página institucional e apresentação de startup)
 */
export function getWebPresetBlock() {
  const paletteSummary = Object.values(DESIGN_PALETTES)
    .map(p => `• **${p.name}** (${p.mood}) — fonte: ${p.font}`)
    .join('\n');

  const landingSections = PAGE_STRUCTURE_PRESETS.landingPage.sections
    .map((s, i) => `  ${i + 1}. ${s.label}: ${s.description}`)
    .join('\n');

  const institutionalSections = PAGE_STRUCTURE_PRESETS.institutionalProduct.sections
    .map((s, i) => `  ${i + 1}. ${s.label}: ${s.description}`)
    .join('\n');

  const startupSections = PAGE_STRUCTURE_PRESETS.startupPresentation.sections
    .map((s, i) => `  ${i + 1}. ${s.label}: ${s.description}`)
    .join('\n');

  const headlineExamples = COPY_PATTERNS.heroHeadlines.map(h => `  • ${h}`).join('\n');
  const ctaExamples = COPY_PATTERNS.ctaPatterns.map(c => `  • ${c}`).join('\n');

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRESETS PREMIUM PARA ARTEFATOS WEB — USE SEMPRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PALETAS DE DESIGN — ESCOLHA BASEADO NO CONTEXTO

Analise o pedido e selecione a paleta mais adequada ao contexto e público-alvo:

${paletteSummary}

Cada paleta define variáveis CSS completas (:root) com --color-primary, --color-primary-light,
--color-accent, --color-bg, --color-bg-surface, --color-bg-card, --color-text, --color-text-muted,
--color-border, --font-heading, --font-body, --radius, --radius-lg, --shadow, --shadow-card, --transition.
Use Google Fonts correspondente com preconnect. NÃO use sempre a mesma paleta roxa.

## ESTRUTURA OBRIGATÓRIA POR TIPO DE PÁGINA

### Landing Page Premium (pedidos: landing, página de vendas, capture)
Deve ter 7+ seções desenvolvidas:
${landingSections}

### Página Institucional de Produto (pedidos: página do produto, site institucional, B2B)
Deve ter 6+ seções desenvolvidas:
${institutionalSections}

### Apresentação de Startup / Produto (pedidos: startup, pitch, apresentação, captação)
Deve ter 7+ seções desenvolvidas:
${startupSections}

## BLOCOS CSS OBRIGATÓRIOS (use sempre em artefatos web)

\`\`\`css
/* Glass Morphism Navbar */
.navbar { position: sticky; top: 0; z-index: 1000; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-border); transition: var(--transition); }
.navbar.scrolled { box-shadow: var(--shadow-card); }

/* Gradient Text */
.gradient-text { background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

/* Card com Hover */
.card { background: var(--color-bg-card); border-radius: var(--radius); border: 1px solid var(--color-border); padding: 2rem; transition: var(--transition); }
.card:hover { transform: translateY(-6px); box-shadow: var(--shadow); }

/* Fade-in via IntersectionObserver */
.fade-in { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
.fade-in.visible { opacity: 1; transform: translateY(0); }

/* Botões */
.btn { display: inline-flex; align-items: center; padding: 0.875rem 2rem; border-radius: var(--radius); font-weight: 700; cursor: pointer; border: none; transition: var(--transition); text-decoration: none; }
.btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow); }
.btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
.btn-ghost { background: transparent; color: var(--color-primary); border: 2px solid var(--color-primary); }
.btn-ghost:hover { background: var(--color-primary); color: #fff; }

/* Typography Scale */
h1 { font-size: clamp(2.2rem, 5vw, 3.75rem); font-weight: 800; line-height: 1.12; letter-spacing: -0.02em; }
h2 { font-size: clamp(1.75rem, 3.5vw, 2.75rem); font-weight: 700; line-height: 1.2; }
p { line-height: 1.7; }

/* Grid Responsivo */
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
@media (max-width: 1024px) { .grid-3 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .grid-3 { grid-template-columns: 1fr; } }
\`\`\`

## BLOCOS JS OBRIGATÓRIOS (use sempre em artefatos web)

\`\`\`javascript
// Smooth scroll com offset para navbar
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    const offset = document.querySelector('.navbar')?.offsetHeight || 72;
    window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
  });
});

// IntersectionObserver — fade-in ao entrar na viewport
const fadeObserver = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); fadeObserver.unobserve(e.target); } }),
  { threshold: 0.12 }
);
document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
}

// Counter animation para métricas (use data-target="5000" data-suffix="+")
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target).toLocaleString('pt-BR') + (el.dataset.suffix || '');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); } });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// FAQ Accordion
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-question').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-answer').style.maxHeight = null; });
    if (!isOpen) { item.classList.add('open'); item.querySelector('.faq-answer').style.maxHeight = item.querySelector('.faq-answer').scrollHeight + 'px'; }
  });
});
\`\`\`

## COPY PATTERNS (use como referência para headlines e CTAs)

Hero headlines (adapte ao produto/serviço):
${headlineExamples}

CTAs de alto desempenho:
${ctaExamples}

Benefit cards: [Emoji] **[Título orientado ao resultado]** — [2-3 linhas com benefício concreto orientado ao usuário, não à feature técnica].

## FEW-SHOT: PÁGINA INSTITUCIONAL DE PRODUTO

Pedido: "Crie uma página institucional para uma plataforma B2B de automação de relatórios"

Resposta FORTE ✅:
\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DataStream — Relatórios automáticos para equipes B2B</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-primary: #1D4ED8; --color-primary-light: #DBEAFE; --color-accent: #0EA5E9;
      --color-bg: #F8FAFC; --color-bg-card: #FFFFFF; --color-text: #0F172A;
      --color-text-muted: #64748B; --color-border: rgba(29,78,216,0.12);
      --font-heading: 'DM Sans', sans-serif; --radius: 10px;
      --shadow: 0 4px 20px rgba(29,78,216,0.12); --transition: 0.2s ease;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--font-heading); background: var(--color-bg); color: var(--color-text); }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .navbar { position: sticky; top: 0; z-index: 100; padding: 1rem 0; background: rgba(248,250,252,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-border); transition: var(--transition); }
    .navbar nav { display: flex; justify-content: space-between; align-items: center; }
    .navbar.scrolled { box-shadow: var(--shadow); }
    .btn { display: inline-flex; padding: 0.75rem 1.75rem; border-radius: var(--radius); font-weight: 700; cursor: pointer; border: none; transition: var(--transition); text-decoration: none; font-size: 0.95rem; }
    .btn-primary { background: var(--color-primary); color: #fff; }
    .btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
    .hero { padding: 7rem 0 5rem; }
    .hero-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
    h1 { font-size: clamp(2rem, 4vw, 3.25rem); font-weight: 800; line-height: 1.12; margin-bottom: 1.25rem; letter-spacing: -0.02em; }
    h2 { font-size: clamp(1.6rem, 3vw, 2.25rem); font-weight: 700; text-align: center; margin-bottom: 3rem; }
    .hero p { font-size: 1.1rem; color: var(--color-text-muted); line-height: 1.7; margin-bottom: 2rem; max-width: 480px; }
    .hero-visual { background: var(--color-primary-light); border-radius: 16px; aspect-ratio: 16/10; display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-weight: 700; font-size: 1.1rem; border: 2px dashed rgba(29,78,216,0.3); }
    .features { padding: 6rem 0; background: #fff; }
    .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .feature-card { padding: 2rem; border-radius: var(--radius); border: 1px solid var(--color-border); transition: var(--transition); }
    .feature-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
    .feature-card .icon { font-size: 2rem; margin-bottom: 1rem; }
    .feature-card h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 0.75rem; }
    .feature-card p { color: var(--color-text-muted); line-height: 1.65; font-size: 0.95rem; }
    .cta-section { padding: 7rem 0; background: var(--color-primary); text-align: center; }
    .cta-section h2 { color: #fff; }
    .cta-section p { color: rgba(255,255,255,0.8); max-width: 520px; margin: 0 auto 2.5rem; font-size: 1.1rem; line-height: 1.7; }
    .btn-white { background: #fff; color: var(--color-primary); }
    .btn-white:hover { background: var(--color-primary-light); transform: translateY(-2px); }
    footer { background: #0F172A; color: rgba(255,255,255,0.6); padding: 3rem 0; text-align: center; }
    .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .fade-in.visible { opacity: 1; transform: translateY(0); }
    @media (max-width: 768px) {
      .hero-inner { grid-template-columns: 1fr; }
      .features-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header class="navbar" id="navbar">
    <nav class="container">
      <span style="font-weight:800;font-size:1.2rem;color:var(--color-primary);">DataStream</span>
      <div style="display:flex;gap:1rem;align-items:center;">
        <a href="#features" style="color:var(--color-text-muted);text-decoration:none;font-weight:600;">Funcionalidades</a>
        <a href="#cta" class="btn btn-primary">Ver demonstração</a>
      </div>
    </nav>
  </header>
  <main>
    <section class="hero container">
      <div class="hero-inner">
        <div>
          <h1>Relatórios automáticos que sua equipe <em>realmente</em> vai usar</h1>
          <p>DataStream conecta suas fontes de dados e entrega relatórios personalizados e automáticos para cada área da empresa — sem planilhas manuais, sem atraso.</p>
          <div style="display:flex;gap:1rem;flex-wrap:wrap;">
            <a href="#cta" class="btn btn-primary">Agendar demonstração</a>
            <a href="#features" class="btn" style="background:var(--color-primary-light);color:var(--color-primary);">Ver funcionalidades</a>
          </div>
        </div>
        <div class="hero-visual">[ Dashboard do produto ]</div>
      </div>
    </section>
    <section class="features" id="features">
      <div class="container">
        <h2>Por que equipes B2B escolhem o DataStream</h2>
        <div class="features-grid">
          <div class="feature-card fade-in"><div class="icon">⚡</div><h3>Dados em tempo real</h3><p>Conecte CRM, ERP e BI em minutos. Relatórios atualizados automaticamente, sem intervenção manual da equipe de dados.</p></div>
          <div class="feature-card fade-in"><div class="icon">🎯</div><h3>Relatórios por área</h3><p>Cada departamento recebe exatamente o que precisa: vendas vê pipeline, marketing vê conversão, operações vê eficiência.</p></div>
          <div class="feature-card fade-in"><div class="icon">🔒</div><h3>Acesso controlado</h3><p>Permissões granulares por usuário e equipe. Conformidade com LGPD. Audit trail completo de quem acessou o quê.</p></div>
          <div class="feature-card fade-in"><div class="icon">📤</div><h3>Distribuição automática</h3><p>Relatórios entregues via email, Slack ou portal interno no horário configurado. Zero esforço recorrente para sua equipe.</p></div>
          <div class="feature-card fade-in"><div class="icon">📊</div><h3>Visualizações ricas</h3><p>Gráficos interativos, tabelas dinâmicas e KPIs em destaque. Exportação para PDF e Excel com um clique.</p></div>
          <div class="feature-card fade-in"><div class="icon">🤝</div><h3>Integração garantida</h3><p>Conectores nativos para Salesforce, HubSpot, SAP, Google Sheets e mais de [X] ferramentas do seu stack atual.</p></div>
        </div>
      </div>
    </section>
    <section id="cta" class="cta-section">
      <div class="container">
        <h2 style="margin-bottom:1.25rem;">Pronto para eliminar relatórios manuais?</h2>
        <p>Nossa equipe mostra em 30 minutos como o DataStream funciona para o seu caso específico — sem compromisso.</p>
        <a href="mailto:[CONTATO]" class="btn btn-white">Agendar demonstração gratuita</a>
      </div>
    </section>
  </main>
  <footer><div class="container"><p>© 2025 DataStream. Todos os direitos reservados.</p></div></footer>
  <script>
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        if (t) window.scrollTo({ top: t.offsetTop - 72, behavior: 'smooth' });
      });
    });
    const nav = document.querySelector('.navbar');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
    const obs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } }), { threshold: 0.12 });
    document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
  </script>
</body>
</html>
\`\`\`

## FEW-SHOT: APRESENTAÇÃO DE STARTUP

Pedido: "Crie uma página de apresentação para uma startup de logística verde"

Resposta FORTE ✅:
\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GreenRoute — Logística sustentável para o próximo século</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-primary: #16A34A; --color-primary-light: #DCFCE7; --color-accent: #F59E0B;
      --color-bg: #F7FFF9; --color-bg-card: #FFFFFF; --color-text: #14532D;
      --color-text-muted: #6B7280; --color-border: rgba(22,163,74,0.15);
      --font-heading: 'Nunito', sans-serif; --radius: 16px;
      --shadow: 0 4px 20px rgba(22,163,74,0.15); --transition: 0.3s ease;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--font-heading); background: var(--color-bg); color: var(--color-text); }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .navbar { position: sticky; top: 0; z-index: 100; padding: 1rem 0; background: rgba(247,255,249,0.88); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-border); transition: var(--transition); }
    .navbar nav { display: flex; justify-content: space-between; align-items: center; }
    .btn { display: inline-flex; padding: 0.875rem 2rem; border-radius: var(--radius); font-weight: 700; cursor: pointer; border: none; transition: var(--transition); text-decoration: none; font-size: 1rem; }
    .btn-primary { background: var(--color-primary); color: #fff; box-shadow: var(--shadow); }
    .btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }
    .hero { padding: 8rem 0 6rem; background: linear-gradient(160deg, var(--color-primary-light) 0%, var(--color-bg) 60%); text-align: center; }
    h1 { font-size: clamp(2.4rem, 5vw, 4rem); font-weight: 800; line-height: 1.1; margin-bottom: 1.25rem; letter-spacing: -0.02em; }
    h2 { font-size: clamp(1.75rem, 3.5vw, 2.5rem); font-weight: 700; margin-bottom: 2.5rem; }
    .hero p { font-size: 1.2rem; color: var(--color-text-muted); max-width: 560px; margin: 0 auto 2.5rem; line-height: 1.7; }
    .metrics { padding: 5rem 0; background: var(--color-primary); }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; text-align: center; }
    .metric-number { font-size: clamp(2.5rem, 5vw, 3.5rem); font-weight: 800; color: #fff; display: block; }
    .metric-label { color: rgba(255,255,255,0.75); font-size: 1rem; margin-top: 0.5rem; }
    .problem { padding: 6rem 0; }
    .problem-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .problem-card { background: #fff; border-radius: var(--radius); padding: 2rem; border: 1px solid var(--color-border); }
    .solution { padding: 6rem 0; background: #fff; }
    .solution-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
    .solution-visual { background: var(--color-primary-light); border-radius: 20px; aspect-ratio: 4/3; display: flex; align-items: center; justify-content: center; color: var(--color-primary); font-weight: 700; border: 2px dashed rgba(22,163,74,0.3); }
    .cta-final { padding: 8rem 0; background: linear-gradient(135deg, var(--color-primary) 0%, #065F46 100%); text-align: center; }
    .cta-final h2 { color: #fff; }
    .cta-final p { color: rgba(255,255,255,0.8); max-width: 520px; margin: 0 auto 2.5rem; font-size: 1.1rem; line-height: 1.7; }
    .btn-accent { background: var(--color-accent); color: #fff; }
    .btn-accent:hover { filter: brightness(1.08); transform: translateY(-2px); }
    footer { background: #052E16; color: rgba(255,255,255,0.55); padding: 2.5rem 0; text-align: center; }
    .fade-in { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
    .fade-in.visible { opacity: 1; transform: translateY(0); }
    @media (max-width: 768px) {
      .metrics-grid, .problem-grid, .solution-inner { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header class="navbar">
    <nav class="container">
      <span style="font-weight:800;font-size:1.25rem;color:var(--color-primary);">🌿 GreenRoute</span>
      <a href="#contato" class="btn btn-primary" style="padding:0.6rem 1.5rem;font-size:0.95rem;">Quero investir</a>
    </nav>
  </header>
  <main>
    <section class="hero">
      <div class="container">
        <h1>Logística que move o mundo<br><span style="color:var(--color-primary);">sem destruir o planeta</span></h1>
        <p>GreenRoute é a plataforma de roteirização inteligente que reduz emissões de CO₂ e custos operacionais simultaneamente — para transportadoras que querem competir no futuro.</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          <a href="#contato" class="btn btn-primary">Quero acesso antecipado</a>
          <a href="#solucao" class="btn" style="background:var(--color-primary-light);color:var(--color-primary);">Ver como funciona</a>
        </div>
      </div>
    </section>
    <section class="metrics">
      <div class="container">
        <div class="metrics-grid">
          <div><span class="metric-number" data-target="40" data-suffix="%">0%</span><p class="metric-label">redução média de emissões de CO₂</p></div>
          <div><span class="metric-number" data-target="28" data-suffix="%">0%</span><p class="metric-label">redução de custos operacionais</p></div>
          <div><span class="metric-number" data-target="120" data-suffix="+ parceiros">0</span><p class="metric-label">transportadoras na fila de espera</p></div>
        </div>
      </div>
    </section>
    <section class="problem fade-in" id="problema" style="padding:6rem 0;">
      <div class="container">
        <h2 style="text-align:center;">O setor de logística ainda opera como nos anos 90</h2>
        <div class="problem-grid">
          <div class="problem-card"><div style="font-size:2rem;margin-bottom:1rem;">🔥</div><h3 style="margin-bottom:0.75rem;">Emissões fora de controle</h3><p style="color:var(--color-text-muted);line-height:1.65;">O transporte rodoviário responde por [X]% das emissões de CO₂ do setor produtivo — e a regulação ambiental está se tornando uma barreira real de negócio.</p></div>
          <div class="problem-card"><div style="font-size:2rem;margin-bottom:1rem;">💸</div><h3 style="margin-bottom:0.75rem;">Roteiros ineficientes = dinheiro na janela</h3><p style="color:var(--color-text-muted);line-height:1.65;">Rotas mal planejadas geram ociosidade de frota, retrabalho e custo de combustível que come a margem — enquanto a concorrência apertar cada vez mais.</p></div>
          <div class="problem-card"><div style="font-size:2rem;margin-bottom:1rem;">📊</div><h3 style="margin-bottom:0.75rem;">Dados que ninguém consegue usar</h3><p style="color:var(--color-text-muted);line-height:1.65;">Dados de telemetria, entrega e emissão existem — mas ficam em silos. Sem inteligência integrada, a decisão ainda é feita no feeling do gestor.</p></div>
        </div>
      </div>
    </section>
    <section class="solution fade-in" id="solucao">
      <div class="container">
        <div class="solution-inner">
          <div>
            <h2>Roteirização inteligente que otimiza custo e emissão ao mesmo tempo</h2>
            <p style="color:var(--color-text-muted);line-height:1.7;margin-bottom:1.5rem;font-size:1.05rem;">GreenRoute combina dados de tráfego em tempo real, perfil de emissão de cada veículo e janelas de entrega para gerar rotas que são mais baratas e mais verdes — simultaneamente.</p>
            <ul style="list-style:none;display:flex;flex-direction:column;gap:0.75rem;">
              <li style="display:flex;gap:0.75rem;align-items:flex-start;"><span style="color:var(--color-primary);font-size:1.25rem;margin-top:0.1rem;">✓</span><span>Dashboard de emissões em tempo real por veículo e rota</span></li>
              <li style="display:flex;gap:0.75rem;align-items:flex-start;"><span style="color:var(--color-primary);font-size:1.25rem;margin-top:0.1rem;">✓</span><span>Relatório automático de carbono para compliance e certificações</span></li>
              <li style="display:flex;gap:0.75rem;align-items:flex-start;"><span style="color:var(--color-primary);font-size:1.25rem;margin-top:0.1rem;">✓</span><span>Integração com sistemas TMS existentes via API REST</span></li>
            </ul>
          </div>
          <div class="solution-visual">[ Mapa / Dashboard GreenRoute ]</div>
        </div>
      </div>
    </section>
    <section class="cta-final fade-in" id="contato">
      <div class="container">
        <h2 style="margin-bottom:1.25rem;">Faça parte da logística do futuro</h2>
        <p>Estamos em fase de acesso antecipado. Transportadoras e investidores alinhados à agenda ESG têm prioridade.</p>
        <a href="mailto:[EMAIL]" class="btn btn-accent">Quero entrar em contato</a>
      </div>
    </section>
  </main>
  <footer><div class="container"><p>© 2025 GreenRoute. Todos os direitos reservados.</p></div></footer>
  <script>
    const nav = document.querySelector('.navbar');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 60), { passive: true });
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        if (t) window.scrollTo({ top: t.offsetTop - 72, behavior: 'smooth' });
      });
    });
    function animateCounter(el) {
      const target = parseInt(el.dataset.target, 10);
      const duration = 1800;
      const start = performance.now();
      const update = now => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString('pt-BR') + (el.dataset.suffix || '');
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    }
    const cObs = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); cObs.unobserve(e.target); } }); }, { threshold: 0.5 });
    document.querySelectorAll('[data-target]').forEach(el => cObs.observe(el));
    const fObs = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); fObs.unobserve(e.target); } }), { threshold: 0.12 });
    document.querySelectorAll('.fade-in').forEach(el => fObs.observe(el));
  </script>
</body>
</html>
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA CRÍTICA: Artefatos web devem SEMPRE usar uma das paletas acima (não sempre a mesma roxa),
SEMPRE ter a estrutura completa do tipo de página detectado, SEMPRE incluir os blocos JS de
IntersectionObserver + smooth scroll + navbar effect, e SEMPRE ter copy orientada ao resultado.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

export default {
  DESIGN_PALETTES,
  PAGE_STRUCTURE_PRESETS,
  PREMIUM_CSS_BLOCKS,
  PREMIUM_JS_BLOCKS,
  COPY_PATTERNS,
  getWebPresetBlock,
};
