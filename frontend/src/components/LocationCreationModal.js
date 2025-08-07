// components/LocationCreationModal.js
import React from 'react';

/**
 * LocationCreationModal - A modal for selecting location templates
 * 
 * @param {Array} templates - Array of available location templates
 * @param {function} onSelectTemplate - Callback when a template is selected
 * @param {function} onClose - Callback when modal is closed
 */
function LocationCreationModal({ templates, onSelectTemplate, onClose }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Location Template</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {templates.length === 0 ? (
            <div className="empty-state">
              <p>No location templates available.</p>
              <p>Create location templates first to add locations to the map.</p>
            </div>
          ) : (
            <div className="template-grid">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="template-card"
                  onClick={() => onSelectTemplate(template)}
                >
                  {template.icon_url && (
                    <img 
                      src={template.icon_url} 
                      alt={template.name}
                      className="template-icon"
                    />
                  )}
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationCreationModal;
