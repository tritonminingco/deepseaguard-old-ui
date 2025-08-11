// =========================
// AlertFilterPanel Component
// =========================
// Provides UI for filtering and searching alerts by severity, type, or AUV.
// Now uses Redux for state management.
import { useState } from 'react';
import { useAlertFilters, useAlerts } from '../hooks/useAlerts.js';

function AlertFilterPanel() {
  // Redux state and actions
  const { filteredAlerts } = useAlerts();
  const { filters, setSeverityFilter, setTypeFilter, setStatusFilter, clearFilters } = useAlertFilters();
  
  // Local state for search functionality
  const [search, setSearch] = useState('');

  // Call parent handler with filter params
  const handleFilter = () => {
    onFilter({ search, severity, auv });
  };

  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <h3 className="panel-title">Alert Filter & Search ({filteredAlerts.length} alerts)</h3>
      </div>
      <div className="panel-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {/* Search input */}
        <input
          type="text"
          placeholder="Search alerts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input"
          style={{ flex: 1 }}
        />
        {/* Severity dropdown */}
        <select 
          value={filters.severity} 
          onChange={e => setSeverityFilter(e.target.value)} 
          className="input"
        >
          <option value="all">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        {/* Type dropdown */}
        <select 
          value={filters.type} 
          onChange={e => setTypeFilter(e.target.value)} 
          className="input"
        >
          <option value="all">All Types</option>
          <option value="environmental">Environmental</option>
          <option value="operational">Operational</option>
          <option value="compliance">Compliance</option>
          <option value="system">System</option>
        </select>
        
        {/* Status dropdown */}
        <select 
          value={filters.status} 
          onChange={e => setStatusFilter(e.target.value)} 
          className="input"
        >
          <option value="all">All Status</option>
          <option value="unread">Unread</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </select>
        
        {/* Clear filters button */}
        <button 
          onClick={clearFilters} 
          className="btn btn-secondary"
          title="Clear all filters"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default AlertFilterPanel;
