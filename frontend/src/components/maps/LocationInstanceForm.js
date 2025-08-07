// components/LocationInstanceForm.js
import React, { useState } from 'react';

/**
 * LocationInstanceForm - A form for editing location instance data
 * 
 * @param {Object} location - The location object to edit
 * @param {function} onSave - Callback when location is saved
 * @param {function} onDelete - Callback when location is deleted
 * @param {function} onCancel - Callback when editing is cancelled
 */
function LocationInstanceForm({ location, onSave, onDelete, onCancel }) {
  const [values, setValues] = useState(location.data || {});
  const [name, setName] = useState(location.name || location.template?.name || 'New Location');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...values, name });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      setIsDeleting(true);
      onDelete(location.id);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  if (!location.template) {
    return (
      <div className="modal" onClick={onCancel}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Error</h2>
            <button className="close-btn" onClick={onCancel}>×</button>
          </div>
          <div className="modal-body">
            <p>No template found for this location.</p>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onCancel}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit {location.template.name}</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="location-info">
              {location.template.icon_url && (
                <img 
                  src={location.template.icon_url} 
                  alt={location.template.name}
                  style={{ width: 32, height: 32, marginRight: '12px' }}
                />
              )}
              <div>
                <h4>{location.template.name}</h4>
                <p style={{ margin: 0, color: 'var(--cosmic-text-muted)', fontSize: '0.875rem' }}>
                  {location.template.description}
                </p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location-name">Location Name:</label>
              <input
                id="location-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter location name"
                required
              />
            </div>

            {location.template.schema && location.template.schema.length > 0 ? (
              location.template.schema.map(field => (
                <div key={field.name} className="form-group">
                  <label htmlFor={`field-${field.name}`}>
                    {field.label || field.name}:
                  </label>
                  
                  {field.type === 'text' || field.type === 'string' ? (
                    <input
                      id={`field-${field.name}`}
                      type="text"
                      value={values[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.label || field.name}`}
                      required={field.required}
                    />
                  ) : field.type === 'number' ? (
                    <input
                      id={`field-${field.name}`}
                      type="number"
                      value={values[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={`Enter ${field.label || field.name}`}
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={`field-${field.name}`}
                      value={values[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      required={field.required}
                    >
                      <option value="">Select {field.label || field.name}</option>
                      {(field.options || []).map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      id={`field-${field.name}`}
                      value={values[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.label || field.name}`}
                      required={field.required}
                      rows={3}
                    />
                  ) : field.type === 'checkbox' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        id={`field-${field.name}`}
                        type="checkbox"
                        checked={values[field.name] || false}
                        onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                      />
                      Yes/No
                    </label>
                  ) : (
                    <input
                      id={`field-${field.name}`}
                      type="text"
                      value={values[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.label || field.name}`}
                      required={field.required}
                    />
                  )}
                </div>
              ))
            ) : (
              <p>No custom fields defined for this location template.</p>
            )}
          </div>
          
          <div className="modal-actions">
            <button type="button" className="cosmic-btn cosmic-btn-danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete Location'}
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--cosmic-space-md)' }}>
              <button type="button" className="cosmic-btn cosmic-btn-secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="cosmic-btn cosmic-btn-primary">
                Save Location
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LocationInstanceForm;
