/**
 * RKMMAX API - UNIFIED ROUTER
 * Centraliza todas as rotas em uma única função Serverless
 * Solução para limite de 12 funções no Vercel Hobby
 */

const chatHandler = require("./chat");
const hybridHandler = require("./hybrid");
const automationHandler = require("./automation");
const auditLogHandler = require("./audit-log");
const creditCalculatorHandler = require("./credit-calculator");
const githubAutomationHandler = require("./github-automation");
const githubBotHandler = require("./github-bot");
const githubOAuthHandler = require("./github-oauth");
const multimodalHandler = require("./multimodal");
const securityValidatorHandler = require("./security-validator");
const specialistChatHandler = require("./specialist-chat");
const visionHandler = require("./vision");
const transcribeHandler = require("./transcribe");
const sendEmailHandler = require("./send-email");
const checkoutHandler = require("./checkout");
const pricesHandler = require("./prices");
const mePlanHandler = require("./me-plan");
const stripeWebhookHandler = require("./stripe-webhook");

/**
 * Main router function
 */
module.exports = async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    // Route requests based on pathname
    if (pathname === "/api/chat" || pathname.startsWith("/api/chat/")) {
      return chatHandler(req, res);
    }

    if (pathname === "/api/hybrid" || pathname.startsWith("/api/hybrid/")) {
      return hybridHandler(req, res);
    }

    if (pathname === "/api/automation" || pathname.startsWith("/api/automation/")) {
      return automationHandler(req, res);
    }

    if (pathname === "/api/audit-log" || pathname.startsWith("/api/audit-log/")) {
      return auditLogHandler(req, res);
    }

    if (pathname === "/api/credit-calculator" || pathname.startsWith("/api/credit-calculator/")) {
      return creditCalculatorHandler(req, res);
    }

    if (pathname === "/api/github-automation" || pathname.startsWith("/api/github-automation/")) {
      return githubAutomationHandler(req, res);
    }

    if (pathname === "/api/github-bot" || pathname.startsWith("/api/github-bot/")) {
      return githubBotHandler(req, res);
    }

    if (pathname === "/api/github-oauth" || pathname.startsWith("/api/github-oauth/")) {
      return githubOAuthHandler(req, res);
    }

    if (pathname === "/api/multimodal" || pathname.startsWith("/api/multimodal/")) {
      return multimodalHandler(req, res);
    }

    if (pathname === "/api/security-validator" || pathname.startsWith("/api/security-validator/")) {
      return securityValidatorHandler(req, res);
    }

    if (pathname === "/api/specialist-chat" || pathname.startsWith("/api/specialist-chat/")) {
      return specialistChatHandler(req, res);
    }

    if (pathname === "/api/vision" || pathname.startsWith("/api/vision/")) {
      return visionHandler(req, res);
    }

    if (pathname === "/api/transcribe" || pathname.startsWith("/api/transcribe/")) {
      return transcribeHandler(req, res);
    }

    if (pathname === "/api/send-email" || pathname.startsWith("/api/send-email/")) {
      return sendEmailHandler(req, res);
    }

    if (pathname === "/api/checkout" || pathname.startsWith("/api/checkout/")) {
      return checkoutHandler(req, res);
    }

    if (pathname === "/api/prices" || pathname.startsWith("/api/prices/")) {
      return pricesHandler(req, res);
    }

    if (pathname === "/api/me-plan" || pathname.startsWith("/api/me-plan/")) {
      return mePlanHandler(req, res);
    }

    if (pathname === "/api/stripe-webhook" || pathname.startsWith("/api/stripe-webhook/")) {
      return stripeWebhookHandler(req, res);
    }

    // Health check
    if (pathname === "/api/health" || pathname === "/api") {
      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        routes: [
          "/api/chat",
          "/api/hybrid",
          "/api/automation",
          "/api/audit-log",
          "/api/credit-calculator",
          "/api/github-automation",
          "/api/github-bot",
          "/api/github-oauth",
          "/api/multimodal",
          "/api/security-validator",
          "/api/specialist-chat",
          "/api/vision",
          "/api/transcribe",
          "/api/send-email",
          "/api/checkout",
          "/api/prices",
          "/api/me-plan",
          "/api/stripe-webhook",
        ],
      });
      return;
    }

    // 404 - Route not found
    res.status(404).json({
      error: "Route not found",
      path: pathname,
      availableRoutes: [
        "/api/chat",
        "/api/hybrid",
        "/api/automation",
        "/api/audit-log",
        "/api/credit-calculator",
        "/api/github-automation",
        "/api/github-bot",
        "/api/github-oauth",
        "/api/multimodal",
        "/api/security-validator",
        "/api/specialist-chat",
        "/api/vision",
        "/api/transcribe",
        "/api/send-email",
        "/api/checkout",
        "/api/prices",
        "/api/me-plan",
        "/api/stripe-webhook",
      ],
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: error.message,
    });
  }
};
