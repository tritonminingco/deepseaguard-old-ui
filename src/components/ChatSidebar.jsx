// =========================
// ChatSidebar Component
// =========================
// Simple chat sidebar for real-time collaboration.
// Props:
//   messages: array of {user, text, time}
//   onSend: function to send a new message
import React, { useState, useRef, useEffect } from 'react';

function ChatSidebar({ messages, onSend, currentUser }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSend({ user: currentUser, text: input, time: new Date() });
      setInput('');
    }
  };

  return (
    <div className="chat-sidebar" style={{ position: 'fixed', right: 0, top: 60, width: 320, height: 'calc(100vh - 60px)', background: '#1e293b', color: '#f8fafc', zIndex: 3000, boxShadow: '-4px 0 24px #0003', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #334155', fontWeight: 'bold' }}>Team Chat</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 8 }}>
            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{msg.user.name}:</span> <span>{msg.text}</span>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(msg.time).toLocaleTimeString()}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #334155', display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' ? handleSend() : null}
          placeholder="Type a message..."
          style={{ flex: 1, borderRadius: 4, border: 'none', padding: 8 }}
        />
        <button className="btn btn-primary" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatSidebar;
