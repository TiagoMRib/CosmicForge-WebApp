import React, { useState } from 'react';

/**
 * EditMapModal - Modal component for editing map details
 * 
 * @param {Object} map - The map object to edit
 * @param {function} onSave - Callback when map is saved
 * @param {function} onClose - Callback when modal is closed
 */
function EditMapModal({ map, onSave, onClose }) {
  const [name, setName] = useState(map?.name || '');
  const [description, setDescription] = useState(map?.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await onSave({ name, description });
    } catch (err) {
      console.error('Error saving map:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="cosmic-modal" onClick={onClose}>
      <div className="cosmic-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cosmic-modal-header">
          <h2>Edit Map</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="cosmic-form-group">
            <label className="cosmic-label" htmlFor="map-name">
              Map Name:
            </label>
            <input
              id="map-name"
              type="text"
              className="cosmic-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter map name"
              required
            />
          </div>

          <div className="cosmic-form-group">
            <label className="cosmic-label" htmlFor="map-description">
              Description:
            </label>
            <textarea
              id="map-description"
              className="cosmic-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter map description"
              rows={4}
            />
          </div>
          
          <div className="cosmic-modal-actions">
            <button 
              type="button" 
              className="cosmic-btn cosmic-btn-secondary" 
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="cosmic-btn cosmic-btn-primary"
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMapModal;
