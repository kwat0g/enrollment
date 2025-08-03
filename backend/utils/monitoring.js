const os = require('os');
const { db } = require('../config/database');
const logger = require('./logger');

class SystemMonitor {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
  }

  // Get system metrics
  getSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = ((usedMem / totalMem) * 100).toFixed(2);

    return {
      uptime: process.uptime(),
      memory: {
        total: this.formatBytes(totalMem),
        used: this.formatBytes(usedMem),
        free: this.formatBytes(freeMem),
        usagePercent: memoryUsage
      },
      cpu: {
        loadAverage: os.loadavg(),
        cores: os.cpus().length
      },
      platform: {
        os: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version
      }
    };
  }

  // Get application metrics
  getApplicationMetrics() {
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;

    return {
      uptime: Date.now() - this.startTime,
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        successRate: this.requestCount > 0 
          ? ((this.requestCount - this.errorCount) / this.requestCount * 100).toFixed(2)
          : 100
      },
      performance: {
        averageResponseTime: avgResponseTime.toFixed(2),
        responseTimeHistory: this.responseTimes.slice(-10) // Last 10 requests
      }
    };
  }

  // Test database connectivity
  async testDatabaseConnection() {
    try {
      const start = Date.now();
      const connection = await db.getConnection();
      const responseTime = Date.now() - start;
      
      connection.release();
      
      return {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database connection test failed:', error);
      return {
        status: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Record request metrics
  recordRequest(duration, isError = false) {
    this.requestCount++;
    if (isError) this.errorCount++;
    
    this.responseTimes.push(duration);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
  }

  // Format bytes to human readable
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get comprehensive health status
  async getHealthStatus() {
    const systemMetrics = this.getSystemMetrics();
    const appMetrics = this.getApplicationMetrics();
    const dbStatus = await this.testDatabaseConnection();

    const overallStatus = 
      dbStatus.status === 'connected' && 
      parseFloat(systemMetrics.memory.usagePercent) < 90 ? 'healthy' : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      application: appMetrics,
      database: dbStatus
    };
  }
}

// Create singleton instance
const systemMonitor = new SystemMonitor();

// Middleware to record request metrics
const monitoringMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    systemMonitor.recordRequest(duration, isError);
  });
  
  next();
};

module.exports = {
  systemMonitor,
  monitoringMiddleware
}; 