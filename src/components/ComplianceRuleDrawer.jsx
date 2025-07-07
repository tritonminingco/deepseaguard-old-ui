// =========================
// ComplianceRuleDrawer Component
// =========================
// Shows a drawer with full ISA rule details, history, and remediation actions.
// Props:
//   rule: rule object to display
//   open: boolean, whether drawer is open
//   onClose: function to close drawer
import React from 'react';

function ComplianceRuleDrawer({ rule, open, onClose }) {
  // Only render if open and rule is provided
  if (!open || !rule) return null;
  return (
    <div className="drawer-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 3000, background: 'rgba(0,0,0,0.3)' }}>
      <div className="drawer" style={{ position: 'absolute', right: 0, top: 0, width: 400, height: '100%', background: '#fff', color: '#0f172a', boxShadow: '-4px 0 24px #0003', padding: 24 }}>
        {/* Close button */}
        <button className="btn btn-sm" onClick={onClose} style={{ float: 'right' }}>✖️</button>
        <h2>{rule.id} - {rule.title}</h2>
        <div><b>ISA Regulation:</b> {rule.regulation}</div>
        <div><b>Threshold:</b> {rule.threshold}</div>
        <div><b>Description:</b> {rule.description}</div>
        {/* Demo history and remediation actions */}
        <div style={{ marginTop: 16 }}><b>History (demo):</b>
          <ul>
            <li>2025-07-01: Compliant</li>
            <li>2025-06-28: Violation - Sediment 27.2 mg/L</li>
            <li>2025-06-20: Compliant</li>
          </ul>
        </div>
        <div style={{ marginTop: 16 }}><b>Remediation Actions:</b>
          <ul>
            <li>Alert sent to operator</li>
            <li>Mission paused</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ComplianceRuleDrawer;
