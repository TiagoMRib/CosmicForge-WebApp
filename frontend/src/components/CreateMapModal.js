// components/CreateMapModal.jsx
import React, { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function CreateMapModal({ projectId, onClose, onMapCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/maps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) throw new Error('Failed to create map');
      const data = await response.json();
      onMapCreated(data);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error creating map');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Create Map</h2>
        <label>Name:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label>Description:</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />

        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          <button onClick={onClose} className="btn-small">Cancel</button>
          <button onClick={handleCreate} className="btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create Map'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateMapModal;
