/**
 * CREDIT CALCULATOR TESTS
 * Testes unitários para cálculo de créditos
 */

import CreditCalculator from '../CreditCalculator.js';

describe("CreditCalculator", () => {
  let calculator;

  beforeEach(() => {
    calculator = new CreditCalculator();
  });

  describe("calculateAutomationCost", () => {
    test("deve calcular custo para modo MANUAL", () => {
      const cost = calculator.calculateAutomationCost("MANUAL", 1000);

      expect(cost.mode).toBe("MANUAL");
      expect(cost.totalCost).toBeGreaterThan(0);
      expect(cost.aiCost).toBeGreaterThan(0);
      expect(cost.operationalCost).toBeGreaterThan(0);
    });

    test("deve calcular custo para modo HYBRID", () => {
      const cost = calculator.calculateAutomationCost("HYBRID", 1000);

      expect(cost.mode).toBe("HYBRID");
      expect(cost.totalCost).toBeGreaterThan(0);
    });

    test("deve calcular custo para modo OPTIMIZED", () => {
      const cost = calculator.calculateAutomationCost("OPTIMIZED", 1000);

      expect(cost.mode).toBe("OPTIMIZED");
      expect(cost.totalCost).toBeGreaterThan(0);
    });

    test("custo OPTIMIZED deve ser maior que MANUAL", () => {
      const manualCost = calculator.calculateAutomationCost("MANUAL", 1000).totalCost;
      const optimizedCost = calculator.calculateAutomationCost("OPTIMIZED", 1000).totalCost;

      expect(optimizedCost).toBeGreaterThan(manualCost);
    });

    test("deve incluir breakdown de custos", () => {
      const cost = calculator.calculateAutomationCost("MANUAL", 1000);

      expect(cost.breakdown).toBeDefined();
      expect(cost.breakdown.analysis).toBeGreaterThan(0);
      expect(cost.breakdown.codeGeneration).toBeGreaterThan(0);
    });
  });

  describe("estimateAICost", () => {
    test("deve estimar custo com Gemini 2.0 Flash", () => {
      const cost = calculator.estimateAICost("gemini-2.0-flash", 1000);

      expect(cost).toBeGreaterThan(0);
    });

    test("deve estimar custo com Gemini 2.5 Pro", () => {
      const cost = calculator.estimateAICost("gemini-2.5-pro", 1000);

      expect(cost).toBeGreaterThan(0);
    });

    test("custo Gemini Pro deve ser maior que Flash", () => {
      const flashCost = calculator.estimateAICost("gemini-2.0-flash", 1000);
      const proCost = calculator.estimateAICost("gemini-2.5-pro", 1000);

      expect(proCost).toBeGreaterThan(flashCost);
    });
  });

  describe("costToCredits", () => {
    test("deve converter custo em créditos", () => {
      const credits = calculator.costToCredits(1.0);

      expect(credits).toBe(10);
    });

    test("deve arredondar para cima", () => {
      const credits = calculator.costToCredits(1.05);

      expect(credits).toBe(11);
    });
  });

  describe("calculateSellingPrice", () => {
    test("deve calcular preço com 60% de margem", () => {
      const cost = 10;
      const price = calculator.calculateSellingPrice(cost, 60);

      expect(price).toBeGreaterThan(cost);
      // Preço = Custo / (1 - 0.60) = 10 / 0.40 = 25
      expect(price).toBeCloseTo(25, 1);
    });

    test("deve calcular preço com 40% de margem", () => {
      const cost = 10;
      const price = calculator.calculateSellingPrice(cost, 40);

      expect(price).toBeGreaterThan(cost);
      // Preço = Custo / (1 - 0.40) = 10 / 0.60 = 16.67
      expect(price).toBeCloseTo(16.67, 1);
    });

    test("margem 60% deve resultar em preço maior que 40%", () => {
      const cost = 10;
      const price60 = calculator.calculateSellingPrice(cost, 60);
      const price40 = calculator.calculateSellingPrice(cost, 40);

      expect(price60).toBeGreaterThan(price40);
    });
  });

  describe("getPlanInfo", () => {
    test("deve retornar informações do plano Básico", () => {
      const plan = calculator.getPlanInfo("basic");

      expect(plan).toBeDefined();
      expect(plan.name).toBe("Plano Básico");
      expect(plan.monthlyPrice).toBe(4990);
      expect(plan.dailyLimits.automations).toBe(5);
    });

    test("deve retornar informações do plano Premium", () => {
      const plan = calculator.getPlanInfo("premium");

      expect(plan).toBeDefined();
      expect(plan.name).toBe("Plano Premium");
      expect(plan.monthlyPrice).toBe(19990);
      expect(plan.dailyLimits.automations).toBe(50);
    });

    test("deve retornar null para plano inválido", () => {
      const plan = calculator.getPlanInfo("invalid");

      expect(plan).toBeNull();
    });
  });

  describe("listAllPlans", () => {
    test("deve listar todos os planos", () => {
      const plans = calculator.listAllPlans();

      expect(plans.length).toBeGreaterThan(0);
      expect(plans.some((p) => p.id === "basic")).toBe(true);
      expect(plans.some((p) => p.id === "premium")).toBe(true);
    });

    test("cada plano deve ter informações obrigatórias", () => {
      const plans = calculator.listAllPlans();

      plans.forEach((plan) => {
        expect(plan.id).toBeDefined();
        expect(plan.name).toBeDefined();
        expect(plan.monthlyPrice).toBeDefined();
        expect(plan.dailyLimits).toBeDefined();
        expect(plan.features).toBeDefined();
      });
    });
  });

  describe("checkDailyLimit", () => {
    test("deve permitir uso dentro do limite", () => {
      const check = calculator.checkDailyLimit("basic", {
        automations: 3,
        aiRequests: 10,
        totalCredits: 30,
      });

      expect(check.valid).toBe(true);
    });

    test("deve bloquear quando limite de automações é atingido", () => {
      const check = calculator.checkDailyLimit("basic", {
        automations: 5,
        aiRequests: 10,
        totalCredits: 30,
      });

      expect(check.valid).toBe(false);
      expect(check.message).toContain("automações");
    });

    test("deve bloquear quando limite de créditos é atingido", () => {
      const check = calculator.checkDailyLimit("basic", {
        automations: 2,
        aiRequests: 10,
        totalCredits: 50,
      });

      expect(check.valid).toBe(false);
      expect(check.message).toContain("créditos");
    });

    test("plano gratuito não deve ter limite", () => {
      const check = calculator.checkDailyLimit("free", {
        automations: 1000,
        aiRequests: 1000,
        totalCredits: 1000,
      });

      expect(check.valid).toBe(true);
    });
  });

  describe("canUseSpecialist", () => {
    test("deve permitir especialista no plano Premium", () => {
      const can = calculator.canUseSpecialist("premium", 54);

      expect(can).toBe(true);
    });

    test("deve bloquear especialista no plano Básico", () => {
      const can = calculator.canUseSpecialist("basic", 54);

      expect(can).toBe(false);
    });

    test("deve permitir 10 especialistas no plano Básico", () => {
      const can = calculator.canUseSpecialist("basic", 10);

      expect(can).toBe(true);
    });
  });

  describe("canUseMode", () => {
    test("deve permitir MANUAL em todos os planos", () => {
      expect(calculator.canUseMode("basic", "MANUAL")).toBe(true);
      expect(calculator.canUseMode("premium", "MANUAL")).toBe(true);
    });

    test("deve permitir OPTIMIZED apenas em planos intermediários", () => {
      expect(calculator.canUseMode("basic", "OPTIMIZED")).toBe(false);
      expect(calculator.canUseMode("intermediate", "OPTIMIZED")).toBe(true);
      expect(calculator.canUseMode("premium", "OPTIMIZED")).toBe(true);
    });
  });

  describe("getRemainingCreditsToday", () => {
    test("deve calcular créditos restantes", () => {
      const remaining = calculator.getRemainingCreditsToday("basic", 30);

      expect(remaining).toBe(20); // 50 - 30
    });

    test("deve retornar 0 quando limite é atingido", () => {
      const remaining = calculator.getRemainingCreditsToday("basic", 50);

      expect(remaining).toBe(0);
    });

    test("plano gratuito deve retornar -1 (sem limite)", () => {
      const remaining = calculator.getRemainingCreditsToday("free", 1000);

      expect(remaining).toBe(-1);
    });
  });

  describe("calculatePlanPrices", () => {
    test("deve calcular preços para todos os planos", () => {
      const prices = calculator.calculatePlanPrices();

      expect(prices.basic).toBeDefined();
      expect(prices.intermediate).toBeDefined();
      expect(prices.premium).toBeDefined();
    });

    test("preço calculado deve respeitar margem", () => {
      const prices = calculator.calculatePlanPrices();

      // Plano Básico com 60% de margem
      expect(prices.basic.marginTarget).toBe(60);
      // Plano Premium com 40% de margem
      expect(prices.premium.marginTarget).toBe(40);
    });
  });

  describe("generatePricingReport", () => {
    test("deve gerar relatório de preços", () => {
      const report = calculator.generatePricingReport();

      expect(report.generatedAt).toBeDefined();
      expect(report.plans).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalPlans).toBeGreaterThan(0);
    });

    test("relatório deve incluir receita mensal", () => {
      const report = calculator.generatePricingReport();

      expect(report.summary.totalMonthlyRevenue).toBeGreaterThan(0);
    });
  });

  describe("Margens de Lucro", () => {
    test("Plano Básico deve ter 60% de margem", () => {
      const plan = calculator.getPlanInfo("basic");
      expect(plan.marginTarget).toBe(60);
    });

    test("Plano Intermediário deve ter 40% de margem", () => {
      const plan = calculator.getPlanInfo("intermediate");
      expect(plan.marginTarget).toBe(40);
    });

    test("Plano Premium deve ter 40% de margem", () => {
      const plan = calculator.getPlanInfo("premium");
      expect(plan.marginTarget).toBe(40);
    });
  });

  describe("Limites Diários Rígidos", () => {
    test("Plano Básico: 5 automações/dia", () => {
      const plan = calculator.getPlanInfo("basic");
      expect(plan.dailyLimits.automations).toBe(5);
    });

    test("Plano Intermediário: 15 automações/dia", () => {
      const plan = calculator.getPlanInfo("intermediate");
      expect(plan.dailyLimits.automations).toBe(15);
    });

    test("Plano Premium: 50 automações/dia", () => {
      const plan = calculator.getPlanInfo("premium");
      expect(plan.dailyLimits.automations).toBe(50);
    });

    test("Plano Gratuito: sem limite", () => {
      const plan = calculator.getPlanInfo("free");
      expect(plan.dailyLimits.automations).toBe(-1);
    });
  });
});
