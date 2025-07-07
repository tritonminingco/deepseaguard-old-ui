// Database Configuration for DeepSeaGuard
// Handles database connections, schema management, and data persistence

// Import required libraries
import { Pool } from 'pg';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

// PostgreSQL configuration for relational data
const pgConfig = {
  host: process.env.REACT_APP_PG_HOST || 'localhost',
  port: parseInt(process.env.REACT_APP_PG_PORT || '5432'),
  database: process.env.REACT_APP_PG_DATABASE || 'deepseaguard',
  user: process.env.REACT_APP_PG_USER || 'postgres',
  password: process.env.REACT_APP_PG_PASSWORD || 'postgres',
  ssl: process.env.REACT_APP_PG_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// InfluxDB configuration for time-series data
const influxConfig = {
  url: process.env.REACT_APP_INFLUX_URL || 'http://localhost:8086',
  token: process.env.REACT_APP_INFLUX_TOKEN || 'your-token',
  org: process.env.REACT_APP_INFLUX_ORG || 'deepseaguard',
  bucket: process.env.REACT_APP_INFLUX_BUCKET || 'telemetry'
};

// Create PostgreSQL connection pool
let pgPool;

// Create InfluxDB client
let influxClient;
let influxWriteApi;
let influxQueryApi;

/**
 * Initialize database connections
 * @returns {Promise} - Promise that resolves when connections are established
 */
export async function initDatabases() {
  try {
    // Initialize PostgreSQL connection
    pgPool = new Pool(pgConfig);
    
    // Test PostgreSQL connection
    await pgPool.query('SELECT NOW()');
    console.log('PostgreSQL connection established');
    
    // Initialize InfluxDB connection
    influxClient = new InfluxDB({ url: influxConfig.url, token: influxConfig.token });
    influxWriteApi = influxClient.getWriteApi(influxConfig.org, influxConfig.bucket, 'ns');
    influxQueryApi = influxClient.getQueryApi(influxConfig.org);
    
    console.log('InfluxDB connection established');
    
    return { pgPool, influxClient };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Close database connections
 * @returns {Promise} - Promise that resolves when connections are closed
 */
export async function closeDatabases() {
  try {
    // Close PostgreSQL connection
    if (pgPool) {
      await pgPool.end();
      console.log('PostgreSQL connection closed');
    }
    
    // Close InfluxDB connection
    if (influxWriteApi) {
      await influxWriteApi.close();
      console.log('InfluxDB connection closed');
    }
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
}

/**
 * PostgreSQL Data Access Object
 * Handles relational data operations
 */
export const PostgresDAO = {
  /**
   * Execute a query on PostgreSQL
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise} - Query result
   */
  async query(text, params = []) {
    if (!pgPool) {
      await initDatabases();
    }
    
    try {
      const start = Date.now();
      const result = await pgPool.query(text, params);
      const duration = Date.now() - start;
      
      console.log('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  },
  
  /**
   * Get a client from the pool for transactions
   * @returns {Object} - PostgreSQL client
   */
  async getClient() {
    if (!pgPool) {
      await initDatabases();
    }
    
    const client = await pgPool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);
    
    // Monkey patch the query method to log queries
    client.query = async (text, params = []) => {
      try {
        const start = Date.now();
        const result = await query(text, params);
        const duration = Date.now() - start;
        
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    };
    
    // Monkey patch the release method to catch errors
    client.release = () => {
      release();
      console.log('Client released back to pool');
    };
    
    return client;
  },
  
  /**
   * Create database tables if they don't exist
   * @returns {Promise} - Promise that resolves when tables are created
   */
  async createTables() {
    try {
      // Users table
      await this.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'viewer',
          first_name VARCHAR(50),
          last_name VARCHAR(50),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE,
          active BOOLEAN DEFAULT TRUE
        )
      `);
      
      // AUVs table
      await this.query(`
        CREATE TABLE IF NOT EXISTS auvs (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          type VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'inactive',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Missions table
      await this.query(`
        CREATE TABLE IF NOT EXISTS missions (
          id VARCHAR(50) PRIMARY KEY,
          auv_id VARCHAR(50) NOT NULL REFERENCES auvs(id),
          name VARCHAR(100) NOT NULL,
          description TEXT,
          status VARCHAR(20) NOT NULL DEFAULT 'planned',
          start_time TIMESTAMP WITH TIME ZONE,
          end_time TIMESTAMP WITH TIME ZONE,
          created_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Alerts table
      await this.query(`
        CREATE TABLE IF NOT EXISTS alerts (
          id SERIAL PRIMARY KEY,
          alert_id VARCHAR(50) UNIQUE NOT NULL,
          type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          source VARCHAR(50) NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          acknowledged BOOLEAN DEFAULT FALSE,
          acknowledged_by INTEGER REFERENCES users(id),
          acknowledged_at TIMESTAMP WITH TIME ZONE,
          resolved BOOLEAN DEFAULT FALSE,
          resolved_by INTEGER REFERENCES users(id),
          resolved_at TIMESTAMP WITH TIME ZONE,
          resolution_notes TEXT
        )
      `);
      
      // ISA Standards table
      await this.query(`
        CREATE TABLE IF NOT EXISTS isa_standards (
          id VARCHAR(50) PRIMARY KEY,
          description TEXT NOT NULL,
          threshold_value NUMERIC NOT NULL,
          threshold_unit VARCHAR(20) NOT NULL,
          category VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // ISA Reports table
      await this.query(`
        CREATE TABLE IF NOT EXISTS isa_reports (
          id SERIAL PRIMARY KEY,
          report_id VARCHAR(50) UNIQUE NOT NULL,
          report_type VARCHAR(20) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          submitted_by INTEGER REFERENCES users(id),
          submitted_at TIMESTAMP WITH TIME ZONE,
          report_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Zones table
      await this.query(`
        CREATE TABLE IF NOT EXISTS zones (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          type VARCHAR(50) NOT NULL,
          description TEXT,
          geojson JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Audit Log table
      await this.query(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          action VARCHAR(50) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(50) NOT NULL,
          details JSONB,
          ip_address VARCHAR(50),
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  },
  
  /**
   * Insert initial data into tables
   * @returns {Promise} - Promise that resolves when data is inserted
   */
  async insertInitialData() {
    try {
      // Check if users table is empty
      const usersResult = await this.query('SELECT COUNT(*) FROM users');
      if (parseInt(usersResult.rows[0].count) === 0) {
        // Insert admin user
        await this.query(`
          INSERT INTO users (username, email, password_hash, role, first_name, last_name)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['admin', 'admin@deepseaguard.com', '$2b$10$rPQcHDAXI4MmHjUBc8AbB.jtIVXLfZ1EzXXzYgh7uUVm3PXQCfEAe', 'admin', 'Admin', 'User']);
        
        console.log('Admin user created');
      }
      
      // Check if AUVs table is empty
      const auvsResult = await this.query('SELECT COUNT(*) FROM auvs');
      if (parseInt(auvsResult.rows[0].count) === 0) {
        // Insert sample AUVs
        await this.query(`
          INSERT INTO auvs (id, name, type, status)
          VALUES 
            ('AUV-001', 'Explorer-1', 'survey', 'active'),
            ('AUV-002', 'Surveyor-1', 'survey', 'active'),
            ('AUV-003', 'Collector-1', 'collector', 'active')
        `);
        
        console.log('Sample AUVs created');
      }
      
      // Check if ISA standards table is empty
      const isaResult = await this.query('SELECT COUNT(*) FROM isa_standards');
      if (parseInt(isaResult.rows[0].count) === 0) {
        // Insert sample ISA standards
        await this.query(`
          INSERT INTO isa_standards (id, description, threshold_value, threshold_unit, category)
          VALUES 
            ('ISA-ENV-1', 'Sediment discharge limit', 25, 'mg/L', 'environmental'),
            ('ISA-ENV-2', 'Protected species proximity', 100, 'm', 'environmental'),
            ('ISA-ENV-3', 'Noise level limit', 60, 'dB', 'environmental'),
            ('ISA-OPS-1', 'Collection efficiency', 80, '%', 'operational')
        `);
        
        console.log('Sample ISA standards created');
      }
      
      console.log('Initial data inserted successfully');
    } catch (error) {
      console.error('Error inserting initial data:', error);
      throw error;
    }
  }
};

/**
 * InfluxDB Data Access Object
 * Handles time-series data operations
 */
export const InfluxDAO = {
  /**
   * Write a data point to InfluxDB
   * @param {string} measurement - Measurement name
   * @param {Object} tags - Tags for the data point
   * @param {Object} fields - Fields for the data point
   * @param {Date} timestamp - Timestamp for the data point
   * @returns {Promise} - Promise that resolves when data is written
   */
  async writePoint(measurement, tags, fields, timestamp = new Date()) {
    if (!influxWriteApi) {
      await initDatabases();
    }
    
    try {
      const point = new Point(measurement);
      
      // Add tags
      Object.entries(tags).forEach(([key, value]) => {
        point.tag(key, value);
      });
      
      // Add fields
      Object.entries(fields).forEach(([key, value]) => {
        if (typeof value === 'number') {
          point.floatField(key, value);
        } else if (typeof value === 'boolean') {
          point.booleanField(key, value);
        } else {
          point.stringField(key, String(value));
        }
      });
      
      // Set timestamp
      point.timestamp(timestamp);
      
      // Write point
      influxWriteApi.writePoint(point);
      await influxWriteApi.flush();
      
      console.log('Data point written to InfluxDB', { measurement, tags, fields });
    } catch (error) {
      console.error('Error writing data point:', error);
      throw error;
    }
  },
  
  /**
   * Write multiple data points to InfluxDB
   * @param {Array} points - Array of data points
   * @returns {Promise} - Promise that resolves when data is written
   */
  async writePoints(points) {
    if (!influxWriteApi) {
      await initDatabases();
    }
    
    try {
      // Convert points to InfluxDB Point objects
      const influxPoints = points.map(({ measurement, tags, fields, timestamp = new Date() }) => {
        const point = new Point(measurement);
        
        // Add tags
        Object.entries(tags).forEach(([key, value]) => {
          point.tag(key, value);
        });
        
        // Add fields
        Object.entries(fields).forEach(([key, value]) => {
          if (typeof value === 'number') {
            point.floatField(key, value);
          } else if (typeof value === 'boolean') {
            point.booleanField(key, value);
          } else {
            point.stringField(key, String(value));
          }
        });
        
        // Set timestamp
        point.timestamp(timestamp);
        
        return point;
      });
      
      // Write points
      influxPoints.forEach(point => influxWriteApi.writePoint(point));
      await influxWriteApi.flush();
      
      console.log(`${influxPoints.length} data points written to InfluxDB`);
    } catch (error) {
      console.error('Error writing data points:', error);
      throw error;
    }
  },
  
  /**
   * Query data from InfluxDB
   * @param {string} query - Flux query
   * @returns {Promise} - Promise that resolves with query results
   */
  async query(query) {
    if (!influxQueryApi) {
      await initDatabases();
    }
    
    try {
      console.log('Executing InfluxDB query:', query);
      
      return new Promise((resolve, reject) => {
        const results = [];
        
        influxQueryApi.queryRows(query, {
          next(row, tableMeta) {
            const result = tableMeta.toObject(row);
            results.push(result);
          },
          error(error) {
            console.error('InfluxDB query error:', error);
            reject(error);
          },
          complete() {
            console.log(`InfluxDB query returned ${results.length} rows`);
            resolve(results);
          }
        });
      });
    } catch (error) {
      console.error('Error querying InfluxDB:', error);
      throw error;
    }
  },
  
  /**
   * Get time-series data for a specific measurement
   * @param {string} measurement - Measurement name
   * @param {Object} tags - Tags to filter by
   * @param {string} field - Field to retrieve
   * @param {string} start - Start time (e.g., '-1h', '-1d')
   * @param {string} stop - Stop time (e.g., 'now()')
   * @param {string} aggregation - Aggregation function (e.g., 'mean', 'max')
   * @param {string} window - Window for aggregation (e.g., '1m', '5m')
   * @returns {Promise} - Promise that resolves with time-series data
   */
  async getTimeSeries(measurement, tags = {}, field, start = '-1h', stop = 'now()', aggregation = 'mean', window = '1m') {
    // Build tag filters
    const tagFilters = Object.entries(tags)
      .map(([key, value]) => `r.${key} == "${value}"`)
      .join(' and ');
    
    // Build Flux query
    let query = `
      from(bucket: "${influxConfig.bucket}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => r._measurement == "${measurement}")
    `;
    
    // Add tag filters if any
    if (tagFilters) {
      query += `|> filter(fn: (r) => ${tagFilters})`;
    }
    
    // Add field filter
    query += `|> filter(fn: (r) => r._field == "${field}")`;
    
    // Add aggregation if specified
    if (aggregation && window) {
      query += `
        |> aggregateWindow(every: ${window}, fn: ${aggregation}, createEmpty: false)
      `;
    }
    
    // Execute query
    return this.query(query);
  }
};

/**
 * Data Repository
 * Provides high-level data access methods for application components
 */
export const DataRepository = {
  /**
   * Initialize the data repository
   * @returns {Promise} - Promise that resolves when initialization is complete
   */
  async initialize() {
    try {
      // Initialize database connections
      await initDatabases();
      
      // Create database tables
      await PostgresDAO.createTables();
      
      // Insert initial data
      await PostgresDAO.insertInitialData();
      
      console.log('Data repository initialized successfully');
    } catch (error) {
      console.error('Error initializing data repository:', error);
      throw error;
    }
  },
  
  /**
   * Get AUV data
   * @param {string} auvId - AUV identifier (optional)
   * @returns {Promise} - Promise that resolves with AUV data
   */
  async getAUVs(auvId = null) {
    try {
      if (auvId) {
        // Get specific AUV
        const result = await PostgresDAO.query('SELECT * FROM auvs WHERE id = $1', [auvId]);
        return result.rows[0];
      } else {
        // Get all AUVs
        const result = await PostgresDAO.query('SELECT * FROM auvs ORDER BY name');
        return result.rows;
      }
    } catch (error) {
      console.error('Error getting AUVs:', error);
      throw error;
    }
  },
  
  /**
   * Get AUV telemetry data
   * @param {string} auvId - AUV identifier
   * @param {string} start - Start time (e.g., '-1h', '-1d')
   * @param {string} stop - Stop time (e.g., 'now()')
   * @returns {Promise} - Promise that resolves with AUV telemetry data
   */
  async getAUVTelemetry(auvId, start = '-1h', stop = 'now()') {
    try {
      // Get position data
      const positions = await InfluxDAO.getTimeSeries(
        'auv_telemetry',
        { auv_id: auvId },
        'position',
        start,
        stop
      );
      
      // Get battery data
      const battery = await InfluxDAO.getTimeSeries(
        'auv_telemetry',
        { auv_id: auvId },
        'battery_level',
        start,
        stop
      );
      
      // Get depth data
      const depth = await InfluxDAO.getTimeSeries(
        'auv_telemetry',
        { auv_id: auvId },
        'depth',
        start,
        stop
      );
      
      return {
        positions,
        battery,
        depth
      };
    } catch (error) {
      console.error('Error getting AUV telemetry:', error);
      throw error;
    }
  },
  
  /**
   * Get environmental data
   * @param {string} metric - Environmental metric (e.g., 'sediment', 'turbidity')
   * @param {string} start - Start time (e.g., '-1h', '-1d')
   * @param {string} stop - Stop time (e.g., 'now()')
   * @returns {Promise} - Promise that resolves with environmental data
   */
  async getEnvironmentalData(metric, start = '-1h', stop = 'now()') {
    try {
      return await InfluxDAO.getTimeSeries(
        'environmental',
        { metric },
        'value',
        start,
        stop
      );
    } catch (error) {
      console.error('Error getting environmental data:', error);
      throw error;
    }
  },
  
  /**
   * Get alerts
   * @param {boolean} activeOnly - Whether to get only active alerts
   * @param {number} limit - Maximum number of alerts to return
   * @returns {Promise} - Promise that resolves with alerts
   */
  async getAlerts(activeOnly = true, limit = 100) {
    try {
      let query = 'SELECT * FROM alerts';
      
      if (activeOnly) {
        query += ' WHERE resolved = FALSE';
      }
      
      query += ' ORDER BY timestamp DESC LIMIT $1';
      
      const result = await PostgresDAO.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw error;
    }
  },
  
  /**
   * Acknowledge alert
   * @param {string} alertId - Alert identifier
   * @param {number} userId - User identifier
   * @returns {Promise} - Promise that resolves when alert is acknowledged
   */
  async acknowledgeAlert(alertId, userId) {
    try {
      const result = await PostgresDAO.query(`
        UPDATE alerts
        SET acknowledged = TRUE, acknowledged_by = $1, acknowledged_at = CURRENT_TIMESTAMP
        WHERE alert_id = $2
        RETURNING *
      `, [userId, alertId]);
      
      // Log audit event
      await this.logAuditEvent(userId, 'acknowledge', 'alert', alertId);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  },
  
  /**
   * Resolve alert
   * @param {string} alertId - Alert identifier
   * @param {number} userId - User identifier
   * @param {string} resolutionNotes - Resolution notes
   * @returns {Promise} - Promise that resolves when alert is resolved
   */
  async resolveAlert(alertId, userId, resolutionNotes) {
    try {
      const result = await PostgresDAO.query(`
        UPDATE alerts
        SET resolved = TRUE, resolved_by = $1, resolved_at = CURRENT_TIMESTAMP, resolution_notes = $3
        WHERE alert_id = $2
        RETURNING *
      `, [userId, alertId, resolutionNotes]);
      
      // Log audit event
      await this.logAuditEvent(userId, 'resolve', 'alert', alertId, { resolutionNotes });
      
      return result.rows[0];
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  },
  
  /**
   * Get ISA compliance status
   * @returns {Promise} - Promise that resolves with ISA compliance status
   */
  async getISAComplianceStatus() {
    try {
      // Get ISA standards
      const standardsResult = await PostgresDAO.query('SELECT * FROM isa_standards');
      const standards = standardsResult.rows;
      
      // Get latest values for each standard
      const complianceStatus = await Promise.all(standards.map(async (standard) => {
        let currentValue;
        let status;
        
        // Get current value from InfluxDB based on standard category
        if (standard.category === 'environmental') {
          const results = await InfluxDAO.getTimeSeries(
            'environmental',
            { metric: standard.id.toLowerCase() },
            'value',
            '-5m',
            'now()',
            'last'
          );
          
          if (results.length > 0) {
            currentValue = results[0]._value;
            status = currentValue <= standard.threshold_value ? 'compliant' : 'warning';
          } else {
            currentValue = null;
            status = 'unknown';
          }
        } else if (standard.category === 'operational') {
          const results = await InfluxDAO.getTimeSeries(
            'operational',
            { metric: standard.id.toLowerCase() },
            'value',
            '-5m',
            'now()',
            'last'
          );
          
          if (results.length > 0) {
            currentValue = results[0]._value;
            status = currentValue >= standard.threshold_value ? 'compliant' : 'warning';
          } else {
            currentValue = null;
            status = 'unknown';
          }
        }
        
        return {
          id: standard.id,
          description: standard.description,
          status,
          value: currentValue !== null ? `${currentValue} ${standard.threshold_unit}` : 'N/A',
          threshold: `${standard.threshold_value} ${standard.threshold_unit}`
        };
      }));
      
      // Get next report due date
      const reportsResult = await PostgresDAO.query(`
        SELECT * FROM isa_reports
        ORDER BY end_date DESC
        LIMIT 1
      `);
      
      let nextReportDate = '';
      let lastReportDate = '';
      
      if (reportsResult.rows.length > 0) {
        const lastReport = reportsResult.rows[0];
        lastReportDate = lastReport.end_date;
        
        // Calculate next report date (1 month after last report end date)
        const nextDate = new Date(lastReport.end_date);
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextReportDate = nextDate.toISOString().split('T')[0];
      } else {
        // If no reports yet, set next report to end of current month
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        nextReportDate = endOfMonth.toISOString().split('T')[0];
      }
      
      return {
        isaStandards: complianceStatus,
        reportingStatus: {
          nextReport: nextReportDate,
          lastReport: lastReportDate,
          compliance: complianceStatus.every(s => s.status === 'compliant') ? 'compliant' : 'warning'
        }
      };
    } catch (error) {
      console.error('Error getting ISA compliance status:', error);
      throw error;
    }
  },
  
  /**
   * Generate ISA report
   * @param {string} reportType - Report type (monthly, quarterly, annual)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {number} userId - User identifier
   * @returns {Promise} - Promise that resolves with report details
   */
  async generateISAReport(reportType, startDate, endDate, userId) {
    try {
      // Generate report ID
      const reportId = `ISA-${reportType.toUpperCase()}-${startDate.toISOString().split('T')[0]}`;
      
      // Insert report record
      const result = await PostgresDAO.query(`
        INSERT INTO isa_reports (report_id, report_type, start_date, end_date, status, submitted_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [reportId, reportType, startDate, endDate, 'draft', userId]);
      
      const report = result.rows[0];
      
      // Log audit event
      await this.logAuditEvent(userId, 'generate', 'report', reportId);
      
      return report;
    } catch (error) {
      console.error('Error generating ISA report:', error);
      throw error;
    }
  },
  
  /**
   * Log audit event
   * @param {number} userId - User identifier
   * @param {string} action - Action performed
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity identifier
   * @param {Object} details - Additional details
   * @returns {Promise} - Promise that resolves when audit event is logged
   */
  async logAuditEvent(userId, action, entityType, entityId, details = {}) {
    try {
      await PostgresDAO.query(`
        INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, action, entityType, entityId, JSON.stringify(details)]);
      
      console.log('Audit event logged:', { userId, action, entityType, entityId });
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw error to prevent disrupting main operation
    }
  }
};

// Export database configuration and data access objects
export default {
  initDatabases,
  closeDatabases,
  PostgresDAO,
  InfluxDAO,
  DataRepository
};
