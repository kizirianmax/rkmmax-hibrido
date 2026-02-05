// Mock implementation for AuditLogger
const AuditLoggerMock = jest.fn().mockImplementation(function () {
  return {
    logAutomationRequest: jest.fn().mockReturnValue("mock-automation-id"),
    logSecurityValidation: jest.fn(),
    logAutomationCompletion: jest.fn(),
    logError: jest.fn(),
    searchLogs: jest.fn().mockReturnValue([]),
    logAutomationStarted: jest.fn(),
    logAutomationCompleted: jest.fn(),
    logAutomationFailed: jest.fn(),
    getAutomationHistory: jest.fn().mockReturnValue([]),
    getAutomationStats: jest.fn().mockReturnValue({
      totalAutomations: 0,
      successfulAutomations: 0,
      failedAutomations: 0,
    }),
  };
});

export default AuditLoggerMock;
