/**
 * ALERT SYSTEM - ALERTAS INTELIGENTES
 *
 * Sistema de notificações para:
 * - Slack (webhooks)
 * - Email (SMTP)
 * - Dashboard (em tempo real)
 * - Logs (arquivo)
 */

class AlertSystem {
  constructor(config = {}) {
    this.config = {
      slackWebhook: config.slackWebhook || process.env.SLACK_WEBHOOK_URL,
      emailSmtp: config.emailSmtp || process.env.EMAIL_SMTP_URL,
      emailFrom: config.emailFrom || process.env.EMAIL_FROM,
      emailTo: config.emailTo || process.env.EMAIL_TO,
      enableSlack: config.enableSlack !== false,
      enableEmail: config.enableEmail !== false,
      enableDashboard: config.enableDashboard !== false,
      enableLogs: config.enableLogs !== false,
      logFile: config.logFile || "./logs/alerts.log",
      ...config,
    };

    this.alerts = [];
    this.thresholds = {
      memoryUsage: 40, // MB
      responseTime: 1000, // ms
      errorRate: 0.05, // 5%
      cacheHitRate: 0.5, // 50%
      buildTime: 300, // segundos
      apiCalls: 100, // por hora
    };

    this.initializeLogFile();
  }

  /**
   * Inicializar arquivo de logs
   */
  initializeLogFile() {
    if (this.config.enableLogs) {
      const fs = require("fs");
      const path = require("path");
      const dir = path.dirname(this.config.logFile);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * ENVIAR ALERTA
   */
  async send(alert) {
    const timestamp = new Date().toISOString();
    const alertWithTime = { ...alert, timestamp };

    // Adicionar ao histórico
    this.alerts.push(alertWithTime);
    if (this.alerts.length > 1000) {
      this.alerts.shift(); // Manter últimos 1000
    }

    // Enviar para Slack
    if (this.config.enableSlack && this.config.slackWebhook) {
      await this.sendToSlack(alertWithTime);
    }

    // Enviar Email
    if (this.config.enableEmail && this.config.emailSmtp) {
      await this.sendEmail(alertWithTime);
    }

    // Registrar em arquivo
    if (this.config.enableLogs) {
      this.logToFile(alertWithTime);
    }

    return alertWithTime;
  }

  /**
   * ENVIAR PARA SLACK
   */
  async sendToSlack(alert) {
    try {
      const fetch = require("node-fetch");
      const color = this.getAlertColor(alert.severity);
      const emoji = this.getAlertEmoji(alert.severity);

      const payload = {
        attachments: [
          {
            color,
            title: `${emoji} ${alert.title}`,
            text: alert.message,
            fields: [
              {
                title: "Severity",
                value: alert.severity,
                short: true,
              },
              {
                title: "Timestamp",
                value: alert.timestamp,
                short: true,
              },
              {
                title: "Component",
                value: alert.component || "Unknown",
                short: true,
              },
              {
                title: "Value",
                value: alert.value ? `${alert.value}${alert.unit || ""}` : "N/A",
                short: true,
              },
            ],
            footer: "RKMMAX Hybrid System",
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      const response = await fetch(this.config.slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("Failed to send Slack alert:", error);
      return false;
    }
  }

  /**
   * ENVIAR EMAIL
   */
  async sendEmail(alert) {
    try {
      const nodemailer = require("nodemailer");

      // Criar transporter
      const transporter = nodemailer.createTransport(this.config.emailSmtp);

      // HTML do email
      const html = `
        <h2>${alert.title}</h2>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Component:</strong> ${alert.component || "Unknown"}</p>
        <p><strong>Value:</strong> ${alert.value}${alert.unit || ""}</p>
        <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
        <hr>
        <p><small>RKMMAX Hybrid System Monitoring</small></p>
      `;

      // Enviar email
      await transporter.sendMail({
        from: this.config.emailFrom,
        to: this.config.emailTo,
        subject: `[${alert.severity}] ${alert.title}`,
        html,
      });

      return true;
    } catch (error) {
      console.error("Failed to send email alert:", error);
      return false;
    }
  }

  /**
   * REGISTRAR EM ARQUIVO
   */
  logToFile(alert) {
    try {
      const fs = require("fs");
      const line = JSON.stringify(alert) + "\n";
      fs.appendFileSync(this.config.logFile, line);
    } catch (error) {
      console.error("Failed to log alert:", error);
    }
  }

  /**
   * VERIFICAR MÉTRICAS E GERAR ALERTAS
   */
  async checkMetrics(metrics) {
    const alerts = [];

    // Memory Usage
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      alerts.push({
        title: "⚠️ High Memory Usage",
        message: `Memory usage is ${metrics.memoryUsage.toFixed(2)}MB, exceeding threshold of ${this.thresholds.memoryUsage}MB`,
        severity: metrics.memoryUsage > this.thresholds.memoryUsage * 1.5 ? "CRITICAL" : "WARNING",
        component: "System",
        value: metrics.memoryUsage,
        unit: "MB",
      });
    }

    // Response Time
    if (metrics.responseTime > this.thresholds.responseTime) {
      alerts.push({
        title: "⏱️ Slow Response Time",
        message: `Average response time is ${metrics.responseTime}ms, exceeding threshold of ${this.thresholds.responseTime}ms`,
        severity: metrics.responseTime > this.thresholds.responseTime * 2 ? "CRITICAL" : "WARNING",
        component: "Performance",
        value: metrics.responseTime,
        unit: "ms",
      });
    }

    // Error Rate
    if (metrics.errorRate > this.thresholds.errorRate) {
      alerts.push({
        title: "❌ High Error Rate",
        message: `Error rate is ${(metrics.errorRate * 100).toFixed(2)}%, exceeding threshold of ${(this.thresholds.errorRate * 100).toFixed(2)}%`,
        severity: metrics.errorRate > this.thresholds.errorRate * 2 ? "CRITICAL" : "WARNING",
        component: "Reliability",
        value: (metrics.errorRate * 100).toFixed(2),
        unit: "%",
      });
    }

    // Cache Hit Rate
    if (metrics.cacheHitRate < this.thresholds.cacheHitRate) {
      alerts.push({
        title: "📉 Low Cache Hit Rate",
        message: `Cache hit rate is ${(metrics.cacheHitRate * 100).toFixed(2)}%, below threshold of ${(this.thresholds.cacheHitRate * 100).toFixed(2)}%`,
        severity: "INFO",
        component: "Cache",
        value: (metrics.cacheHitRate * 100).toFixed(2),
        unit: "%",
      });
    }

    // Build Time
    if (metrics.buildTime > this.thresholds.buildTime) {
      alerts.push({
        title: "🏗️ Slow Build Time",
        message: `Build time is ${metrics.buildTime}s, exceeding threshold of ${this.thresholds.buildTime}s`,
        severity: "WARNING",
        component: "Build",
        value: metrics.buildTime,
        unit: "s",
      });
    }

    // API Calls
    if (metrics.apiCalls > this.thresholds.apiCalls) {
      alerts.push({
        title: "📡 High API Call Rate",
        message: `API calls per hour: ${metrics.apiCalls}, exceeding threshold of ${this.thresholds.apiCalls}`,
        severity: "WARNING",
        component: "API",
        value: metrics.apiCalls,
        unit: "calls/hour",
      });
    }

    // Enviar todos os alertas
    for (const alert of alerts) {
      await this.send(alert);
    }

    return alerts;
  }

  /**
   * ALERTAS CUSTOMIZADOS
   */
  async alertDeploymentSuccess(deployment) {
    return this.send({
      title: "✅ Deployment Successful",
      message: `Deployment to ${deployment.environment} completed successfully`,
      severity: "INFO",
      component: "Deployment",
      value: deployment.duration,
      unit: "ms",
    });
  }

  async alertDeploymentFailure(deployment, error) {
    return this.send({
      title: "❌ Deployment Failed",
      message: `Deployment to ${deployment.environment} failed: ${error.message}`,
      severity: "CRITICAL",
      component: "Deployment",
      value: error.code,
    });
  }

  async alertSecurityThreat(threat) {
    return this.send({
      title: "🚨 Security Threat Detected",
      message: `${threat.type}: ${threat.description}`,
      severity: "CRITICAL",
      component: "Security",
      value: threat.count,
    });
  }

  async alertCacheAnomaly(anomaly) {
    return this.send({
      title: "⚠️ Cache Anomaly",
      message: `${anomaly.description}`,
      severity: "WARNING",
      component: "Cache",
      value: anomaly.hitRate,
      unit: "%",
    });
  }

  /**
   * OBTER HISTÓRICO DE ALERTAS
   */
  getHistory(limit = 100) {
    return this.alerts.slice(-limit);
  }

  /**
   * OBTER ALERTAS POR SEVERIDADE
   */
  getAlertsBySeverity(severity) {
    return this.alerts.filter((a) => a.severity === severity);
  }

  /**
   * OBTER ALERTAS POR COMPONENTE
   */
  getAlertsByComponent(component) {
    return this.alerts.filter((a) => a.component === component);
  }

  /**
   * LIMPAR ALERTAS ANTIGOS
   */
  clearOldAlerts(hoursOld = 24) {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    this.alerts = this.alerts.filter((a) => new Date(a.timestamp) > cutoffTime);
  }

  /**
   * OBTER ESTATÍSTICAS
   */
  getStats() {
    const stats = {
      totalAlerts: this.alerts.length,
      bySeverity: {
        CRITICAL: this.getAlertsBySeverity("CRITICAL").length,
        WARNING: this.getAlertsBySeverity("WARNING").length,
        INFO: this.getAlertsBySeverity("INFO").length,
      },
      byComponent: {},
      lastAlert: this.alerts[this.alerts.length - 1] || null,
    };

    // Contar por componente
    this.alerts.forEach((alert) => {
      const component = alert.component || "Unknown";
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;
    });

    return stats;
  }

  /**
   * HELPER: Obter cor do alerta
   */
  getAlertColor(severity) {
    const colors = {
      CRITICAL: "#FF0000",
      WARNING: "#FFA500",
      INFO: "#0099FF",
    };
    return colors[severity] || "#808080";
  }

  /**
   * HELPER: Obter emoji do alerta
   */
  getAlertEmoji(severity) {
    const emojis = {
      CRITICAL: "🚨",
      WARNING: "⚠️",
      INFO: "ℹ️",
    };
    return emojis[severity] || "📢";
  }

  /**
   * ATUALIZAR THRESHOLDS
   */
  updateThreshold(metric, value) {
    if (this.thresholds.hasOwnProperty(metric)) {
      this.thresholds[metric] = value;
      return true;
    }
    return false;
  }

  /**
   * OBTER THRESHOLDS
   */
  getThresholds() {
    return { ...this.thresholds };
  }
}

export default AlertSystem;
