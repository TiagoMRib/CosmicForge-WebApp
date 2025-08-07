// components/EditTemplateModal.jsx
import React, { useState, useEffect } from 'react';
import FormulaEditorModal from './FormulaEditorModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const fieldTypes = ['string', 'number', 'boolean', 'select', 'multiselect', 'computed'];

function EditTemplateModal({ template, onClose, onTemplateUpdated }) {
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState([]);
  const [error, setError] = useState(null);
  const [editingFormulaIndex, setEditingFormulaIndex] = useState(null);

  // Initialize form with template data
  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setFields(template.schema || []);
    }
  }, [template]);

  const addField = () => {
    setFields([
      ...fields,
      { name: '', type: 'string', options: '' }
    ]);
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    const cleanFields = fields.map(field => {
      const { name, type, options, formula } = field;
      return {
        name,
        type,
        ...(type === 'select' || type === 'multiselect'
          ? { options: options.split(',').map(opt => opt.trim()) }
          : {}),
        ...(type === 'computed'
          ? { formula }
          : {})
      };
    });

    const payload = {
      name: templateName,
      schema: cleanFields
    };

    try {
      const res = await fetch(`${API_BASE_URL}/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update template (${res.status})`);
      }
      
      const updatedTemplate = await res.json();
      onTemplateUpdated(updatedTemplate);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error updating template');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit Template</h2>
        {error && <p className="error">{error}</p>}

        <label>
          Template Name:
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
        </label>

        <h3>Fields</h3>
        {fields.map((field, index) => (
          <div key={index} className="field-row">
            <input
              type="text"
              placeholder="Field Name"
              value={field.name}
              onChange={(e) => updateField(index, 'name', e.target.value)}
            />
            <select
              value={field.type}
              onChange={(e) => updateField(index, 'type', e.target.value)}
            >
              {fieldTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {(field.type === 'select' || field.type === 'multiselect') && (
              <input
                type="text"
                placeholder="Comma-separated options"
                value={field.options || ''}
                onChange={(e) => updateField(index, 'options', e.target.value)}
              />
            )}

            {field.type === 'computed' && (
              <button
                type="button"
                onClick={() => setEditingFormulaIndex(index)}
                className="formula-btn"
              >
                {field.formula ? 'Edit Formula' : 'Add Formula'}
              </button>
            )}

            <button onClick={() => removeField(index)}>Remove</button>
          </div>
        ))}

        <div className="field-actions">
          <button onClick={addField}>+ Add Field</button>
        </div>

        <div className="modal-actions">
          <button onClick={handleSubmit} className="btn">Update Template</button>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        </div>
      </div>

      {/* Formula Editor Modal */}
      {editingFormulaIndex !== null && (
        <FormulaEditorModal
          initialFormula={fields[editingFormulaIndex].formula || ''}
          fieldName={fields[editingFormulaIndex].name || 'Unnamed Field'}
          templateFields={fields}
          onClose={() => setEditingFormulaIndex(null)}
          onSave={(updatedFormula) => {
            updateField(editingFormulaIndex, 'formula', updatedFormula);
            setEditingFormulaIndex(null);
          }}
        />
      )}
    </div>
  );
}

export default EditTemplateModal; 