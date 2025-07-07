// =========================
// UsersOnlinePanel Component
// =========================
// Shows a list of users currently online in the dashboard.
// Props:
//   users: array of user objects (with online status)
import React from 'react';

function UsersOnlinePanel({ users }) {
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="panel-header">
        <h3 className="panel-title">Users Online</h3>
      </div>
      <div className="panel-body">
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {users.map(u => (
            <li key={u.id} style={{ marginBottom: 6, color: u.online ? '#10b981' : '#64748b' }}>
              <span style={{ fontWeight: u.online ? 'bold' : 'normal' }}>{u.name} ({u.role})</span>
              {u.online && <span style={{ marginLeft: 8, color: '#10b981' }}>●</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default UsersOnlinePanel;
