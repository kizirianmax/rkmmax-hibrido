/**
 * MOCK - AuditLogger
 * Mock manual para testes
 */

export default class AuditLogger {
  constructor() {
    this.logs = [];
  }

  logAutomationRequest() {
    return "LOG_123456789";
  }

  logSecurityValidation() {
    return "LOG_987654321";
  }

  logAutomationCompletion() {
    return "LOG_111222333";
  }

  logError() {
    return "LOG_999888777";
  }

  searchLogs() {
    return [];
  }
}
