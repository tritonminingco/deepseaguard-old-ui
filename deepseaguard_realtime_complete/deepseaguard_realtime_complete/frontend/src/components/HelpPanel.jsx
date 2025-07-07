import React from 'react';
// HelpPanel: Centralized help, FAQ, and troubleshooting for users.

const HelpPanel = () => {
  // TODO: Add FAQ, troubleshooting, and contact info
  return (
    <div className="help-panel">
      <h2>Help & FAQ</h2>
      <ul>
        <li>How do I trigger a violation scenario?</li>
        <li>How do I export a compliance report?</li>
        <li>What if the WebSocket connection fails?</li>
        {/* More help topics... */}
      </ul>
    </div>
  );
};

export default HelpPanel;
