// components/CreateLocationTemplateModal.jsx
import React, { useState } from 'react';

const defaultField = { name: '', type: 'text', options: [] };

function CreateLocationTemplateModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconFile, setIconFile] = useState(null);
  const [fields, setFields] = useState([]);

  const handleAddField = () => {
    setFields([...fields, { ...defaultField }]);
  };

  const handleFieldChange = (index, field) => {
    const updated = [...fields];
    updated[index] = field;
    setFields(updated);
  };

  const handleAddOption = (fieldIndex) => {
    const updated = [...fields];
    if (!updated[fieldIndex].options) {
      updated[fieldIndex].options = [];
    }
    updated[fieldIndex].options.push('');
    setFields(updated);
  };

  const handleOptionChange = (fieldIndex, optionIndex, value) => {
    const updated = [...fields];
    updated[fieldIndex].options[optionIndex] = value;
    setFields(updated);
  };

  const handleRemoveOption = (fieldIndex, optionIndex) => {
    const updated = [...fields];
    updated[fieldIndex].options.splice(optionIndex, 1);
    setFields(updated);
  };

  const handleRemoveField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Please enter a template name');
      return;
    }

    // Validate fields
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!field.name.trim()) {
        alert(`Field ${i + 1} needs a name`);
        return;
      }
      if (field.type === 'select' && (!field.options || field.options.length === 0 || field.options.every(opt => !opt.trim()))) {
        alert(`Select field "${field.name}" needs at least one option`);
        return;
      }
    }

    const templateData = {
      name: name.trim(),
      description: description.trim(),
      schema: fields.map(field => ({
        name: field.name.trim(),
        type: field.type,
        required: field.required || false,
        options: field.type === 'select' ? field.options.filter(opt => opt.trim()) : undefined
      })),
      icon_url: iconFile ? URL.createObjectURL(iconFile) : ''
    };

    onCreate(templateData);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Create Location Template</h2>

        <div className="form-group">
          <label>Name:</label>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Enter template name"
            required
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Enter template description"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Icon:</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => setIconFile(e.target.files[0])} 
          />
        </div>

        <h3>Custom Fields</h3>
        {fields.map((field, index) => (
          <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <div className="field-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input
                placeholder="Field name"
                value={field.name}
                onChange={e => handleFieldChange(index, { ...field, name: e.target.value })}
                style={{ flex: 1 }}
              />
              <select
                value={field.type}
                onChange={e => handleFieldChange(index, { ...field, type: e.target.value, options: e.target.value === 'select' ? [''] : [] })}
                style={{ flex: 1 }}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Select (Dropdown)</option>
                <option value="textarea">Textarea</option>
                <option value="checkbox">Checkbox</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="checkbox"
                  checked={field.required || false}
                  onChange={e => handleFieldChange(index, { ...field, required: e.target.checked })}
                />
                Required
              </label>
              <button 
                type="button"
                className="btn-small delete-btn" 
                onClick={() => handleRemoveField(index)}
                style={{ padding: '4px 8px' }}
              >
                ×
              </button>
            </div>

            {field.type === 'select' && (
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Options:</label>
                {(field.options || []).map((option, optionIndex) => (
                  <div key={optionIndex} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    <input
                      placeholder="Option value"
                      value={option}
                      onChange={e => handleOptionChange(index, optionIndex, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index, optionIndex)}
                      style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddOption(index)}
                  style={{ padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
                >
                  + Add Option
                </button>
              </div>
            )}
          </div>
        ))}

        <button 
          type="button"
          className="btn-small" 
          onClick={handleAddField}
          style={{ marginBottom: '16px' }}
        >
          + Add Field
        </button>

        <div className="modal-actions">
          <button className="btn" onClick={handleSubmit}>Create Template</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default CreateLocationTemplateModal;
