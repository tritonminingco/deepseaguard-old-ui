// =========================
// IsaRegulationReferencePanel Component
// =========================
// Quick reference for all tracked ISA rules and docs.
// Props:
//   rules: array of rule objects (optional, uses demoRules by default)
//   onRuleClick: function to call when a rule is clicked

import React from 'react';

const demoRules = [
  { id: 'ISA-ENV-1', title: 'Sediment Discharge', threshold: '25 mg/L', regulation: 'ISBA/21/LTC/15', description: 'Limit on sediment discharge to protect benthic environment.' },
  { id: 'ISA-ENV-2', title: 'Sensitive Zone Time', threshold: '120 min', regulation: 'ISBA/21/LTC/15', description: 'Limit on time spent in sensitive ecological zones.' },
  { id: 'ISA-OPS-1', title: 'Operational Depth', threshold: '3000 m', regulation: 'ISBA/21/LTC/15', description: 'Maximum operational depth for AUVs.' },
  { id: 'ISA-REP-1', title: 'Reporting', threshold: 'Daily', regulation: 'ISBA/21/LTC/15', description: 'Daily reporting requirement for all operations.' }
];

function IsaRegulationReferencePanel({ rules = demoRules, onRuleClick }) {
  // Render a list of rule reference buttons
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <h3 className="panel-title">ISA Regulation Reference</h3>
      </div>
      <div className="panel-body">
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {rules.map(rule => (
            <li key={rule.id} style={{ marginBottom: 8 }}>
              <button className="btn w-full" onClick={() => onRuleClick(rule)}>
                {rule.id}: {rule.title} ({rule.threshold})
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default IsaRegulationReferencePanel;
