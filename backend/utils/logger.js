const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase() || 'INFO'];

// Format timestamp
const getTimestamp = () => {
  return new Date().toISOString();
};

// Write log to file
const writeLog = (level, message, data = {}) => {
  const timestamp = getTimestamp();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };

  const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
  const logString = JSON.stringify(logEntry) + '\n';

  fs.appendFileSync(logFile, logString);
};

// Console output with colors
const consoleOutput = (level, message, data = {}) => {
  const timestamp = getTimestamp();
  const colors = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[35m'  // Magenta
  };
  const reset = '\x1b[0m';

  console.log(`${colors[level]}[${level}]${reset} ${timestamp} - ${message}`);
  if (Object.keys(data).length > 0) {
    console.log(JSON.stringify(data, null, 2));
  }
};

// Logger functions
const logger = {
  error: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      writeLog('ERROR', message, data);
      consoleOutput('ERROR', message, data);
    }
  },

  warn: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      writeLog('WARN', message, data);
      consoleOutput('WARN', message, data);
    }
  },

  info: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      writeLog('INFO', message, data);
      consoleOutput('INFO', message, data);
    }
  },

  debug: (message, data = {}) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      writeLog('DEBUG', message, data);
      consoleOutput('DEBUG', message, data);
    }
  },

  // Request logger middleware
  requestLogger: (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };

      if (res.statusCode >= 400) {
        logger.error(`${req.method} ${req.url} - ${res.statusCode}`, logData);
      } else {
        logger.info(`${req.method} ${req.url} - ${res.statusCode}`, logData);
      }
    });

    next();
  }
};

module.exports = logger; 