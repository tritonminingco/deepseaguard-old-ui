import React, { useState, useEffect } from 'react';
// ConfigPanel: Manage AUV schemas and ISA compliance thresholds (upload, edit, delete)
// Connects to backend for CRUD operations

const defaultAuvSchema = {
  id: '',
  name: '',
  sensors: [],
  maxDepth: '',
  manufacturer: '',
};

const defaultRule = {
  id: '',
  title: '',
  threshold: '',
  unit: '',
  description: '',
};

function ConfigPanel() {
  const [auvs, setAuvs] = useState([]);
  const [rules, setRules] = useState([]);
  const [newAuv, setNewAuv] = useState(defaultAuvSchema);
  const [newRule, setNewRule] = useState(defaultRule);
  const [loading, setLoading] = useState(false);

  // Fetch AUV schemas and rules from backend
  useEffect(() => {
    async function fetchConfig() {
      setLoading(true);
      try {
        const [auvList, ruleList] = await Promise.all([
          window.apiClient.fetchData('/config/auvs'),
          window.apiClient.fetchData('/config/rules')
        ]);
        setAuvs(auvList || []);
        setRules(ruleList || []);
      } catch (err) {
        setAuvs([]);
        setRules([]);
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  // Handlers for AUV schema
  const handleAuvChange = (e) => {
    const { name, value } = e.target;
    setNewAuv((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddAuv = async () => {
    setLoading(true);
    try {
      await window.apiClient.fetchData('/config/auvs', {
        method: 'POST',
        body: JSON.stringify(newAuv),
        headers: { 'Content-Type': 'application/json' }
      });
      setAuvs([...auvs, newAuv]);
      setNewAuv(defaultAuvSchema);
    } catch (err) {}
    setLoading(false);
  };
  const handleDeleteAuv = async (id) => {
    setLoading(true);
    try {
      await window.apiClient.fetchData(`/config/auvs/${id}`, { method: 'DELETE' });
      setAuvs(auvs.filter((a) => a.id !== id));
    } catch (err) {}
    setLoading(false);
  };

  // Handlers for ISA rule
  const handleRuleChange = (e) => {
    const { name, value } = e.target;
    setNewRule((prev) => ({ ...prev, [name]: value }));
  };
  const handleAddRule = async () => {
    setLoading(true);
    try {
      await window.apiClient.fetchData('/config/rules', {
        method: 'POST',
        body: JSON.stringify(newRule),
        headers: { 'Content-Type': 'application/json' }
      });
      setRules([...rules, newRule]);
      setNewRule(defaultRule);
    } catch (err) {}
    setLoading(false);
  };
  const handleDeleteRule = async (id) => {
    setLoading(true);
    try {
      await window.apiClient.fetchData(`/config/rules/${id}`, { method: 'DELETE' });
      setRules(rules.filter((r) => r.id !== id));
    } catch (err) {}
    setLoading(false);
  };

  return (
    <div className="config-panel">
      <h2>AUV Schema Management</h2>
      <div>
        <input name="id" placeholder="AUV ID" value={newAuv.id} onChange={handleAuvChange} />
        <input name="name" placeholder="Name" value={newAuv.name} onChange={handleAuvChange} />
        <input name="manufacturer" placeholder="Manufacturer" value={newAuv.manufacturer} onChange={handleAuvChange} />
        <input name="maxDepth" placeholder="Max Depth (m)" value={newAuv.maxDepth} onChange={handleAuvChange} />
        <input name="sensors" placeholder="Sensors (comma-separated)" value={newAuv.sensors} onChange={e => setNewAuv(prev => ({ ...prev, sensors: e.target.value.split(',').map(s => s.trim()) }))} />
        <button onClick={handleAddAuv} disabled={loading}>Add AUV</button>
      </div>
      <ul>
        {auvs.map((auv) => (
          <li key={auv.id}>
            {auv.id} - {auv.name} ({auv.manufacturer}) Max Depth: {auv.maxDepth}m Sensors: {auv.sensors?.join(', ')}
            <button onClick={() => handleDeleteAuv(auv.id)} disabled={loading}>Delete</button>
          </li>
        ))}
      </ul>
      <h2>ISA Compliance Rule Management</h2>
      <div>
        <input name="id" placeholder="Rule ID" value={newRule.id} onChange={handleRuleChange} />
        <input name="title" placeholder="Title" value={newRule.title} onChange={handleRuleChange} />
        <input name="threshold" placeholder="Threshold" value={newRule.threshold} onChange={handleRuleChange} />
        <input name="unit" placeholder="Unit" value={newRule.unit} onChange={handleRuleChange} />
        <input name="description" placeholder="Description" value={newRule.description} onChange={handleRuleChange} />
        <button onClick={handleAddRule} disabled={loading}>Add Rule</button>
      </div>
      <ul>
        {rules.map((rule) => (
          <li key={rule.id}>
            {rule.id} - {rule.title} ({rule.threshold} {rule.unit}) {rule.description}
            <button onClick={() => handleDeleteRule(rule.id)} disabled={loading}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ConfigPanel;
