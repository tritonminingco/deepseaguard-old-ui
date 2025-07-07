// =========================
// UserManagementPanel Component
// =========================
// Demo panel to show users/roles and simulate role switching.
// Props:
//   users: array of user objects
//   onSwitch: function to call when switching user
import React from 'react';

const demoUsers = [
  { id: 1, name: 'Scientist', role: 'Scientist', active: true },
  { id: 2, name: 'Compliance Officer', role: 'Compliance', active: false },
  { id: 3, name: 'Operator', role: 'Operator', active: false }
];

function UserManagementPanel({ users = demoUsers, onSwitch }) {
  // Render a list of user role buttons
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <h3 className="panel-title">User Management (Demo)</h3>
      </div>
      <div className="panel-body">
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {users.map(u => (
            <li key={u.id} style={{ marginBottom: 8 }}>
              <button className={`btn w-full${u.active ? ' btn-primary' : ''}`} onClick={() => onSwitch(u)}>
                {u.name} ({u.role}) {u.active ? '✓' : ''}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default UserManagementPanel;
