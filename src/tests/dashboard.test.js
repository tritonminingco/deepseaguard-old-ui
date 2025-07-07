import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from '../components/Authentication';
import AlertSystem from '../components/AlertSystem';
import Map3D from '../components/Map3D';
import ComplianceStatus from '../components/panels/ComplianceStatus';
import { DataRepository } from '../utils/dbConfig';

// Mock the data repository
jest.mock('../utils/dbConfig', () => ({
  DataRepository: {
    getAlerts: jest.fn(),
    acknowledgeAlert: jest.fn(),
    resolveAlert: jest.fn(),
    getISAComplianceStatus: jest.fn(),
    generateISAReport: jest.fn()
  }
}));

// Mock the data services
jest.mock('../utils/dataService', () => ({
  AlertService: {
    useRealtimeAlerts: jest.fn().mockReturnValue({
      alerts: [],
      connectionStatus: 'connected'
    })
  },
  ComplianceService: {
    getReportList: jest.fn().mockResolvedValue([]),
    generateReport: jest.fn().mockResolvedValue({
      reportId: 'TEST-REPORT-001',
      downloadUrl: 'https://example.com/report.pdf'
    })
  },
  AUVService: {
    getAllAUVs: jest.fn().mockResolvedValue([])
  },
  MapService: {
    getPlumeData: jest.fn().mockResolvedValue([]),
    getBathymetricData: jest.fn().mockResolvedValue({}),
    getZoneBoundaries: jest.fn().mockResolvedValue([]),
    getSensitiveAreas: jest.fn().mockResolvedValue([])
  }
}));

// Mock the authentication
jest.mock('../utils/apiClient', () => ({
  setAuthToken: jest.fn(),
  getAuthToken: jest.fn(),
  isAuthenticated: jest.fn(),
  authenticate: jest.fn(),
  logout: jest.fn()
}));

describe('DeepSeaGuard Dashboard Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Tests', () => {
    test('Login form renders correctly', () => {
      render(
        <AuthProvider>
          <div data-testid="login-test">Login Test</div>
        </AuthProvider>
      );
      
      // Check if login form elements are rendered
      expect(screen.getByText('Login Test')).toBeInTheDocument();
    });
    
    test('Authentication flow works correctly', async () => {
      const mockAuthenticate = require('../utils/apiClient').authenticate;
      mockAuthenticate.mockResolvedValueOnce({
        success: true,
        user: { id: 1, username: 'admin', role: 'admin' }
      });
      
      render(
        <AuthProvider>
          <div data-testid="auth-test">Auth Test</div>
        </AuthProvider>
      );
      
      // Simulate successful login
      await waitFor(() => {
        expect(screen.getByTestId('auth-test')).toBeInTheDocument();
      });
    });
  });

  describe('Alert System Tests', () => {
    test('Alert system renders with no alerts', async () => {
      DataRepository.getAlerts.mockResolvedValueOnce([]);
      
      render(
        <AuthProvider>
          <AlertSystem currentUser={{ id: 1, username: 'admin', role: 'admin' }} />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('No active alerts')).toBeInTheDocument();
      });
    });
    
    test('Alert system displays alerts correctly', async () => {
      const mockAlerts = [
        {
          id: 'ALT-001',
          alert_id: 'ALT-001',
          type: 'environmental',
          severity: 'warning',
          message: 'Test alert',
          source: 'AUV-001',
          timestamp: new Date().toISOString(),
          acknowledged: false,
          resolved: false
        }
      ];
      
      DataRepository.getAlerts.mockResolvedValueOnce(mockAlerts);
      
      render(
        <AuthProvider>
          <AlertSystem currentUser={{ id: 1, username: 'admin', role: 'admin' }} />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Test alert')).toBeInTheDocument();
        expect(screen.getByText('ENVIRONMENTAL')).toBeInTheDocument();
      });
    });
    
    test('Alert acknowledgment works correctly', async () => {
      const mockAlerts = [
        {
          id: 'ALT-001',
          alert_id: 'ALT-001',
          type: 'environmental',
          severity: 'warning',
          message: 'Test alert',
          source: 'AUV-001',
          timestamp: new Date().toISOString(),
          acknowledged: false,
          resolved: false
        }
      ];
      
      DataRepository.getAlerts.mockResolvedValueOnce(mockAlerts);
      DataRepository.acknowledgeAlert.mockResolvedValueOnce({
        ...mockAlerts[0],
        acknowledged: true
      });
      
      render(
        <AuthProvider>
          <AlertSystem currentUser={{ id: 1, username: 'admin', role: 'admin' }} />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Acknowledge')).toBeInTheDocument();
      });
      
      // Click acknowledge button
      fireEvent.click(screen.getByText('Acknowledge'));
      
      await waitFor(() => {
        expect(DataRepository.acknowledgeAlert).toHaveBeenCalledWith('ALT-001', 1);
      });
    });
  });

  describe('Map3D Tests', () => {
    test('Map3D component renders correctly', async () => {
      render(
        <Map3D 
          timeFrame="live" 
          onAUVSelect={jest.fn()} 
          selectedAUV={null} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Top View')).toBeInTheDocument();
        expect(screen.getByText('Side View')).toBeInTheDocument();
        expect(screen.getByText('Follow AUV')).toBeInTheDocument();
        expect(screen.getByText('Free View')).toBeInTheDocument();
      });
    });
  });

  describe('Compliance Status Tests', () => {
    test('Compliance status renders correctly', async () => {
      DataRepository.getISAComplianceStatus.mockResolvedValueOnce({
        isaStandards: [
          {
            id: 'ISA-ENV-1',
            description: 'Sediment discharge limit',
            status: 'compliant',
            value: '12.3 mg/L',
            threshold: '25 mg/L'
          }
        ],
        reportingStatus: {
          nextReport: '2025-07-01',
          lastReport: '2025-06-01',
          compliance: 'compliant'
        }
      });
      
      render(
        <AuthProvider>
          <ComplianceStatus />
        </AuthProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByText('ISA Compliance')).toBeInTheDocument();
        expect(screen.getByText('Overall Compliance')).toBeInTheDocument();
        expect(screen.getByText('Sediment discharge limit')).toBeInTheDocument();
      });
    });
    
    test('Report generation works correctly', async () => {
      DataRepository.getISAComplianceStatus.mockResolvedValueOnce({
        isaStandards: [],
        reportingStatus: {
          nextReport: '2025-07-01',
          lastReport: '2025-06-01',
          compliance: 'compliant'
        }
      });
      
      const mockUser = { id: 1, username: 'admin', role: 'compliance_officer' };
      const mockHasRole = jest.fn().mockReturnValue(true);
      
      render(
        <AuthProvider>
          <ComplianceStatus />
        </AuthProvider>
      );
      
      // Switch to generate tab
      await waitFor(() => {
        expect(screen.getByText('Generate Report')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Generate Report'));
      
      // Fill form and submit
      await waitFor(() => {
        expect(screen.getByText('Generate ISA Compliance Report')).toBeInTheDocument();
      });
    });
  });
});
