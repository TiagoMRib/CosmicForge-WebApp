// components/CreateTemplateModal.jsx
import React, { useState } from 'react';
import FormulaEditorModal from './FormulaEditorModal';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const fieldTypes = ['string', 'number', 'boolean', 'select', 'multiselect', 'computed', 'image'];

/**
 * CreateTemplateModal - A modal for creating new templates
 * 
 * This component allows users to create templates with various field types
 * including computed fields that use JavaScript formulas.
 * 
 * @param {string} projectId - The ID of the project to create the template for
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onTemplateCreated - Callback when template is successfully created
 */
function CreateTemplateModal({ projectId, onClose, onTemplateCreated }) {
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState([]);
  const [error, setError] = useState(null);
  const [editingFormulaIndex, setEditingFormulaIndex] = useState(null);

  /**
   * Add a new field to the template
   */
  const addField = () => {
    setFields([
      ...fields,
      { name: '', type: 'string', options: '' }
    ]);
  };

  /**
   * Update a specific field property
   * @param {number} index - Index of the field to update
   * @param {string} key - Property name to update
   * @param {any} value - New value for the property
   */
  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  /**
   * Remove a field from the template
   * @param {number} index - Index of the field to remove
   */
  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  /**
   * Handle form submission to create the template
   */
  const handleSubmit = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    // Clean and validate fields
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
      const res = await fetch(`${API_BASE_URL}/projects/${projectId}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create template (${res.status})`);
      }
      
      const newTemplate = await res.json();
      onTemplateCreated(newTemplate);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error creating template');
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Create Template</h2>
        {error && <p className="error">{error}</p>}

        {/* Template Name Input */}
        <label>
          Template Name:
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name..."
          />
        </label>

        {/* Fields Section */}
        <h3>Fields</h3>
        {fields.map((field, index) => (
          <div key={index} className="field-row">
            {/* Field Name */}
            <input
              type="text"
              placeholder="Field Name"
              value={field.name}
              onChange={(e) => updateField(index, 'name', e.target.value)}
            />
            
            {/* Field Type */}
            <select
              value={field.type}
              onChange={(e) => updateField(index, 'type', e.target.value)}
            >
              {fieldTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Options for select/multiselect fields */}
            {(field.type === 'select' || field.type === 'multiselect') && (
              <input
                type="text"
                placeholder="Comma-separated options"
                value={field.options || ''}
                onChange={(e) => updateField(index, 'options', e.target.value)}
              />
            )}

            {/* Formula button for computed fields */}
            {field.type === 'computed' && (
              <button
                type="button"
                onClick={() => setEditingFormulaIndex(index)}
                className="formula-btn"
              >
                {field.formula ? 'Edit Formula' : 'Add Formula'}
              </button>
            )}

            {/* Remove Field Button */}
            <button onClick={() => removeField(index)}>Remove</button>
          </div>
        ))}

        {/* Add Field Button */}
        <div className="field-actions">
          <button onClick={addField}>+ Add Field</button>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button onClick={handleSubmit} className="btn">Save Template</button>
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

export default CreateTemplateModal;
