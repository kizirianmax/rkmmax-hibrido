/**
 * Sistema de Logs Centralizado
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLevel = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()]
  : LOG_LEVELS.INFO;

export function logError(context, message, error) {
  if (currentLevel >= LOG_LEVELS.ERROR) {
    console.error(`❌ [${context}] ${message}`, error?.message || error);
    if (error?.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
  }
}

export function logWarn(context, message, data) {
  if (currentLevel >= LOG_LEVELS.WARN) {
    console.warn(`⚠️  [${context}] ${message}`, data || '');
  }
}

export function logInfo(context, message, data) {
  if (currentLevel >= LOG_LEVELS.INFO) {
    console.log(`ℹ️  [${context}] ${message}`, data || '');
  }
}

export function logDebug(context, message, data) {
  if (currentLevel >= LOG_LEVELS.DEBUG) {
    console.log(`🔍 [${context}] ${message}`, data || '');
  }
}

export function logSuccess(context, message, data) {
  if (currentLevel >= LOG_LEVELS.INFO) {
    console.log(`✅ [${context}] ${message}`, data || '');
  }
}
