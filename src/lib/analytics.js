// src/lib/analytics.js
import posthog from "posthog-js";

export function initAnalytics() {
  const apiKey = process.env.REACT_APP_POSTHOG_KEY;
  const host = process.env.REACT_APP_POSTHOG_HOST || "https://app.posthog.com";

  if (!apiKey) {
    console.warn("⚠️ PostHog API key not configured. Analytics disabled.");
    return;
  }

  posthog.init(apiKey, {
    api_host: host,

    // Amostragem econômica: capturar apenas eventos essenciais
    autocapture: false, // Desabilitar autocapture para reduzir volume
    capture_pageview: true,
    capture_pageleave: false, // Desabilitar para economia

    // Privacy settings - Mascarar PII
    mask_all_text: true,
    mask_all_element_attributes: true,

    // Session Recording - Amostragem econômica
    session_recording: {
      maskAllInputs: true, // Mascarar todos os inputs
      maskInputOptions: {
        password: true,
        email: true,
        tel: true,
      },
      // Gravar apenas 5% das sessões
      sampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
    },

    // Disable in development
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") {
        ph.opt_out_capturing();
      }
    },
  });
}

export function trackEvent(eventName, properties = {}) {
  if (typeof posthog !== "undefined" && posthog.capture) {
    posthog.capture(eventName, properties);
  }
}

export function identifyUser(email, properties = {}) {
  if (typeof posthog !== "undefined" && posthog.identify) {
    posthog.identify(email, properties);
  }
}

export function resetUser() {
  if (typeof posthog !== "undefined" && posthog.reset) {
    posthog.reset();
  }
}

// Common events
export const Events = {
  PAGE_VIEW: "page_view",
  BUTTON_CLICK: "button_click",
  FORM_SUBMIT: "form_submit",
  ERROR_OCCURRED: "error_occurred",
  FEATURE_USED: "feature_used",
  SUBSCRIPTION_STARTED: "subscription_started",
  AGENT_SELECTED: "agent_selected",
  CHAT_SENT: "chat_sent",
  FEEDBACK_SUBMITTED: "feedback_submitted",
};
