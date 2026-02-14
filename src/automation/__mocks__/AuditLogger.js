export default class AuditLogger {
  constructor() {
    this.logs = [];
  }
  
  logAutomationRequest(data) {
    const id = `LOG_${Date.now()}`;
    this.logs.push({ type: 'request', data, id });
    return id;
  }
  
  logSecurityValidation(data) {
    this.logs.push({ type: 'security', data });
  }
  
  logAutomationCompletion(data) {
    this.logs.push({ type: 'completion', data });
  }
  
  logError(error) {
    this.logs.push({ type: 'error', error });
  }
  
  searchLogs(query) {
    return this.logs.filter(log => 
      JSON.stringify(log).includes(query)
    );
  }
  
  logAutomationStarted(data) {
    this.logs.push({ type: 'started', data });
  }
  
  logAutomationCompleted(data) {
    this.logs.push({ type: 'completed', data });
  }
  
  logAutomationFailed(data) {
    this.logs.push({ type: 'failed', data });
  }
  
  getAutomationHistory() {
    return this.logs.filter(log => 
      ['started', 'completed', 'failed'].includes(log.type)
    );
  }
  
  getAutomationStats() {
    const history = this.getAutomationHistory();
    return {
      totalAutomations: history.length,
      successfulAutomations: history.filter(l => l.type === 'completed').length,
      failedAutomations: history.filter(l => l.type === 'failed').length
    };
  }
}
