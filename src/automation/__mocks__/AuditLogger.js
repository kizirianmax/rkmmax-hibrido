/**
 * Manual Mock for AuditLogger
 */

class AuditLogger {
  constructor() {
    this.logAutomationRequest = () => "mock-automation-id";
    this.logSecurityValidation = () => {};
    this.logAutomationCompletion = () => {};
    this.logError = () => {};
    this.searchLogs = () => [];
    this.logAutomationStarted = () => {};
    this.logAutomationCompleted = () => {};
    this.logAutomationFailed = () => {};
    this.getAutomationHistory = () => [];
    this.getAutomationStats = () => ({
      totalAutomations: 0,
      successfulAutomations: 0,
      failedAutomations: 0,
    });
  }
}

export default AuditLogger;
