// Security validation script for DeepSeaGuard
// Performs security checks on the application

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  appDir: path.resolve(__dirname, '..'),
  outputFile: path.resolve(__dirname, '../security_report.md'),
  securityChecks: [
    'authentication',
    'authorization',
    'data_validation',
    'api_security',
    'dependency_vulnerabilities',
    'secure_storage',
    'logging',
    'error_handling'
  ]
};

// Security validation results
const results = {
  passed: [],
  warnings: [],
  failures: [],
  recommendations: []
};

/**
 * Run security validation checks
 */
async function runSecurityValidation() {
  console.log('Starting DeepSeaGuard security validation...');
  
  try {
    // Check authentication implementation
    validateAuthentication();
    
    // Check authorization controls
    validateAuthorization();
    
    // Check data validation
    validateDataValidation();
    
    // Check API security
    validateApiSecurity();
    
    // Check dependencies for vulnerabilities
    validateDependencies();
    
    // Check secure storage practices
    validateSecureStorage();
    
    // Check logging implementation
    validateLogging();
    
    // Check error handling
    validateErrorHandling();
    
    // Generate security report
    generateReport();
    
    console.log('Security validation completed successfully');
    console.log(`Report saved to: ${config.outputFile}`);
    
    return {
      success: true,
      passCount: results.passed.length,
      warningCount: results.warnings.length,
      failureCount: results.failures.length
    };
  } catch (error) {
    console.error('Security validation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate authentication implementation
 */
function validateAuthentication() {
  console.log('Checking authentication implementation...');
  
  // Check for token-based authentication
  const authFile = path.join(config.appDir, 'src/components/Authentication.jsx');
  const apiClientFile = path.join(config.appDir, 'src/utils/apiClient.js');
  
  if (fs.existsSync(authFile) && fs.existsSync(apiClientFile)) {
    const authContent = fs.readFileSync(authFile, 'utf8');
    const apiClientContent = fs.readFileSync(apiClientFile, 'utf8');
    
    // Check for JWT or token-based auth
    if (authContent.includes('getAuthToken') && apiClientContent.includes('setAuthToken')) {
      results.passed.push('Authentication uses token-based approach');
    } else {
      results.warnings.push('Authentication may not be using secure token-based approach');
    }
    
    // Check for secure password handling
    if (authContent.includes('password_hash') || apiClientContent.includes('password_hash')) {
      results.passed.push('Passwords appear to be hashed, not stored in plaintext');
    } else {
      results.failures.push('No evidence of password hashing found');
      results.recommendations.push('Implement bcrypt or Argon2 for password hashing');
    }
    
    // Check for session timeout/expiry
    if (authContent.includes('timeout') || authContent.includes('expiry') || apiClientContent.includes('timeout') || apiClientContent.includes('expiry')) {
      results.passed.push('Session timeout/expiry appears to be implemented');
    } else {
      results.warnings.push('No clear evidence of session timeout/expiry');
      results.recommendations.push('Implement token expiration and refresh mechanism');
    }
  } else {
    results.failures.push('Authentication files not found');
    results.recommendations.push('Implement proper authentication system');
  }
}

/**
 * Validate authorization controls
 */
function validateAuthorization() {
  console.log('Checking authorization controls...');
  
  // Check for role-based access control
  const authFile = path.join(config.appDir, 'src/components/Authentication.jsx');
  
  if (fs.existsSync(authFile)) {
    const authContent = fs.readFileSync(authFile, 'utf8');
    
    if (authContent.includes('hasRole') || authContent.includes('requiredRole')) {
      results.passed.push('Role-based access control is implemented');
    } else {
      results.warnings.push('No clear evidence of role-based access control');
      results.recommendations.push('Implement role-based access control for different user types');
    }
    
    // Check for protected routes
    if (authContent.includes('ProtectedRoute')) {
      results.passed.push('Protected routes are implemented');
    } else {
      results.warnings.push('No clear evidence of protected routes');
      results.recommendations.push('Implement route protection for sensitive areas');
    }
  } else {
    results.failures.push('Authorization files not found');
    results.recommendations.push('Implement proper authorization system');
  }
}

/**
 * Validate data validation practices
 */
function validateDataValidation() {
  console.log('Checking data validation practices...');
  
  // Check for input validation
  const apiClientFile = path.join(config.appDir, 'src/utils/apiClient.js');
  const dataServiceFile = path.join(config.appDir, 'src/utils/dataService.js');
  
  if (fs.existsSync(apiClientFile) && fs.existsSync(dataServiceFile)) {
    const apiClientContent = fs.readFileSync(apiClientFile, 'utf8');
    const dataServiceContent = fs.readFileSync(dataServiceFile, 'utf8');
    
    // Check for data validation
    if (apiClientContent.includes('validate') || dataServiceContent.includes('validate')) {
      results.passed.push('Data validation appears to be implemented');
    } else {
      results.warnings.push('No clear evidence of data validation');
      results.recommendations.push('Implement input validation for all user inputs');
    }
    
    // Check for sanitization
    if (apiClientContent.includes('sanitize') || dataServiceContent.includes('sanitize') || 
        apiClientContent.includes('escape') || dataServiceContent.includes('escape')) {
      results.passed.push('Data sanitization appears to be implemented');
    } else {
      results.warnings.push('No clear evidence of data sanitization');
      results.recommendations.push('Implement data sanitization to prevent XSS attacks');
    }
  } else {
    results.failures.push('API client or data service files not found');
    results.recommendations.push('Implement proper data validation and sanitization');
  }
}

/**
 * Validate API security
 */
function validateApiSecurity() {
  console.log('Checking API security...');
  
  // Check for API security headers
  const apiClientFile = path.join(config.appDir, 'src/utils/apiClient.js');
  
  if (fs.existsSync(apiClientFile)) {
    const apiClientContent = fs.readFileSync(apiClientFile, 'utf8');
    
    // Check for authorization headers
    if (apiClientContent.includes('Authorization') || apiClientContent.includes('Bearer')) {
      results.passed.push('API requests include authorization headers');
    } else {
      results.warnings.push('No clear evidence of API authorization headers');
      results.recommendations.push('Implement authorization headers for API requests');
    }
    
    // Check for CSRF protection
    if (apiClientContent.includes('csrf') || apiClientContent.includes('CSRF')) {
      results.passed.push('CSRF protection appears to be implemented');
    } else {
      results.warnings.push('No clear evidence of CSRF protection');
      results.recommendations.push('Implement CSRF tokens for API requests');
    }
    
    // Check for rate limiting
    if (apiClientContent.includes('rate') || apiClientContent.includes('limit')) {
      results.passed.push('Rate limiting appears to be implemented');
    } else {
      results.warnings.push('No clear evidence of rate limiting');
      results.recommendations.push('Implement rate limiting for API endpoints');
    }
  } else {
    results.failures.push('API client file not found');
    results.recommendations.push('Implement secure API client with proper headers and protections');
  }
}

/**
 * Validate dependencies for vulnerabilities
 */
function validateDependencies() {
  console.log('Checking dependencies for vulnerabilities...');
  
  // Check for package.json
  const packageJsonFile = path.join(config.appDir, 'package.json');
  
  if (fs.existsSync(packageJsonFile)) {
    try {
      // Run npm audit if available
      try {
        const auditOutput = execSync('npm audit --json', { cwd: config.appDir }).toString();
        const auditResult = JSON.parse(auditOutput);
        
        if (auditResult.vulnerabilities) {
          const vulnCount = Object.keys(auditResult.vulnerabilities).length;
          
          if (vulnCount === 0) {
            results.passed.push('No vulnerabilities found in dependencies');
          } else {
            const highSevCount = Object.values(auditResult.vulnerabilities)
              .filter(v => v.severity === 'high' || v.severity === 'critical').length;
            
            if (highSevCount > 0) {
              results.failures.push(`${highSevCount} high or critical severity vulnerabilities found in dependencies`);
            } else {
              results.warnings.push(`${vulnCount} low or moderate severity vulnerabilities found in dependencies`);
            }
            
            results.recommendations.push('Run npm audit fix to resolve dependency vulnerabilities');
          }
        }
      } catch (error) {
        results.warnings.push('Unable to run npm audit');
        results.recommendations.push('Manually check dependencies for vulnerabilities');
      }
    } catch (error) {
      results.warnings.push('Error checking dependencies');
      results.recommendations.push('Manually check dependencies for vulnerabilities');
    }
  } else {
    results.failures.push('package.json not found');
    results.recommendations.push('Create package.json with proper dependency management');
  }
}

/**
 * Validate secure storage practices
 */
function validateSecureStorage() {
  console.log('Checking secure storage practices...');
  
  // Check for secure storage of sensitive data
  const dbConfigFile = path.join(config.appDir, 'src/utils/dbConfig.js');
  
  if (fs.existsSync(dbConfigFile)) {
    const dbConfigContent = fs.readFileSync(dbConfigFile, 'utf8');
    
    // Check for environment variables
    if (dbConfigContent.includes('process.env')) {
      results.passed.push('Environment variables are used for configuration');
    } else {
      results.warnings.push('No clear evidence of environment variables for configuration');
      results.recommendations.push('Use environment variables for sensitive configuration');
    }
    
    // Check for hardcoded credentials
    const credentialPatterns = [
      /password\s*[:=]\s*['"][^'"]+['"]/i,
      /apiKey\s*[:=]\s*['"][^'"]+['"]/i,
      /secret\s*[:=]\s*['"][^'"]+['"]/i,
      /token\s*[:=]\s*['"][^'"]+['"]/i
    ];
    
    const hardcodedCredentials = credentialPatterns.some(pattern => pattern.test(dbConfigContent));
    
    if (hardcodedCredentials) {
      results.failures.push('Hardcoded credentials found in database configuration');
      results.recommendations.push('Remove hardcoded credentials and use environment variables');
    } else {
      results.passed.push('No hardcoded credentials found in database configuration');
    }
  } else {
    results.warnings.push('Database configuration file not found');
    results.recommendations.push('Implement secure database configuration');
  }
}

/**
 * Validate logging implementation
 */
function validateLogging() {
  console.log('Checking logging implementation...');
  
  // Check for audit logging
  const dbConfigFile = path.join(config.appDir, 'src/utils/dbConfig.js');
  
  if (fs.existsSync(dbConfigFile)) {
    const dbConfigContent = fs.readFileSync(dbConfigFile, 'utf8');
    
    // Check for audit logging
    if (dbConfigContent.includes('audit_log') || dbConfigContent.includes('logAuditEvent')) {
      results.passed.push('Audit logging appears to be implemented');
    } else {
      results.warnings.push('No clear evidence of audit logging');
      results.recommendations.push('Implement audit logging for security events');
    }
    
    // Check for sensitive data in logs
    const sensitiveLogPatterns = [
      /console\.log\s*\(\s*.*password/i,
      /console\.log\s*\(\s*.*token/i,
      /console\.log\s*\(\s*.*secret/i
    ];
    
    const sensitiveLogs = sensitiveLogPatterns.some(pattern => pattern.test(dbConfigContent));
    
    if (sensitiveLogs) {
      results.failures.push('Potential sensitive data logging found');
      results.recommendations.push('Ensure sensitive data is not logged');
    } else {
      results.passed.push('No obvious sensitive data logging found');
    }
  } else {
    results.warnings.push('Database configuration file not found');
    results.recommendations.push('Implement secure logging practices');
  }
}

/**
 * Validate error handling
 */
function validateErrorHandling() {
  console.log('Checking error handling...');
  
  // Check for proper error handling
  const apiClientFile = path.join(config.appDir, 'src/utils/apiClient.js');
  
  if (fs.existsSync(apiClientFile)) {
    const apiClientContent = fs.readFileSync(apiClientFile, 'utf8');
    
    // Check for try/catch blocks
    if ((apiClientContent.match(/try\s*{/g) || []).length > 0) {
      results.passed.push('Error handling with try/catch is implemented');
    } else {
      results.warnings.push('Limited or no try/catch error handling found');
      results.recommendations.push('Implement proper error handling with try/catch');
    }
    
    // Check for error information exposure
    const errorExposurePatterns = [
      /res\.send\s*\(\s*error\s*\)/i,
      /res\.json\s*\(\s*error\s*\)/i
    ];
    
    const errorExposure = errorExposurePatterns.some(pattern => pattern.test(apiClientContent));
    
    if (errorExposure) {
      results.warnings.push('Potential exposure of error details to clients');
      results.recommendations.push('Sanitize error messages before sending to clients');
    } else {
      results.passed.push('No obvious exposure of error details to clients');
    }
  } else {
    results.warnings.push('API client file not found');
    results.recommendations.push('Implement proper error handling');
  }
}

/**
 * Generate security report
 */
function generateReport() {
  console.log('Generating security report...');
  
  const reportContent = `# DeepSeaGuard Security Validation Report
  
## Summary

- **Passed Checks:** ${results.passed.length}
- **Warnings:** ${results.warnings.length}
- **Failures:** ${results.failures.length}
- **Date:** ${new Date().toISOString().split('T')[0]}

## Passed Checks

${results.passed.map(item => `- ✅ ${item}`).join('\n')}

## Warnings

${results.warnings.map(item => `- ⚠️ ${item}`).join('\n')}

## Failures

${results.failures.map(item => `- ❌ ${item}`).join('\n')}

## Recommendations

${results.recommendations.map(item => `- 📝 ${item}`).join('\n')}

## Next Steps

1. Address all failures immediately
2. Review and address warnings
3. Implement recommendations
4. Re-run security validation after fixes
5. Consider a professional security audit before production deployment

`;

  fs.writeFileSync(config.outputFile, reportContent);
}

// Export validation function
module.exports = {
  runSecurityValidation
};

// Run validation if executed directly
if (require.main === module) {
  runSecurityValidation()
    .then(result => {
      if (result.success) {
        console.log(`Security validation completed with ${result.passCount} passes, ${result.warningCount} warnings, and ${result.failureCount} failures.`);
        process.exit(result.failureCount > 0 ? 1 : 0);
      } else {
        console.error('Security validation failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error running security validation:', error);
      process.exit(1);
    });
}
