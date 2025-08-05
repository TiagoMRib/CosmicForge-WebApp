// components/CreateEntityModal.jsx
import React, { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function CreateEntityModal({ projectId, template, onClose, onEntityCreated }) {
  const [formData, setFormData] = useState({});
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Entity name is required');
      return;
    }

    // Clone formData to finalData
    const finalData = { ...formData };

    // Evaluate computed fields
    template.schema.forEach(field => {
      if (field.type === 'computed' && field.formula) {
        try {
          console.log(`Computing field: ${field.name}`);
          console.log(`Original formula: ${field.formula}`);
          
          // Clean the formula by removing comments and extra whitespace
          let cleanFormula = field.formula
            .replace(/\/\/.*$/gm, '') // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .replace(/^\s*\n/gm, '') // Remove empty lines at the beginning
            .replace(/\n\s*$/gm, '') // Remove empty lines at the end
            .trim(); // Remove extra whitespace
          
          // Ensure the formula doesn't start with a newline
          cleanFormula = cleanFormula.replace(/^\s*\n/, '');
          
          console.log(`Cleaned formula: ${cleanFormula}`);
          console.log(`Available data:`, finalData);
          
          // Create a safe context object with all field values
          const context = {};
          Object.keys(finalData).forEach(key => {
            context[key] = finalData[key];
          });
          
          console.log(`Context for computation:`, context);
          
          // Use a simpler approach that directly accesses the context
          const functionBody = `
            return (function() { 
              ${Object.keys(context).map(key => `const ${key} = context['${key}'];`).join('\n')}
              return ${cleanFormula};
            })();
          `;
          
          console.log(`Generated function body:`, functionBody);
          
          const fn = new Function('context', functionBody);
          
          const result = fn(context);
          console.log(`Computed result for ${field.name}:`, result);
          console.log(`Result type:`, typeof result);
          
          finalData[field.name] = result;
        } catch (e) {
          console.error(`Failed to compute ${field.name}:`, e);
          console.error(`Formula was: ${field.formula}`);
          console.error(`Available data was:`, finalData);
          setError(`Error in formula for "${field.name}": ${e.message}. Check the console for more details.`);
          finalData[field.name] = `ERROR: ${e.message}`;
        }
      }
    });


    const payload = {
      project_id: projectId,
      name,
      data: finalData,
    };

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/templates/${template.id}/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create entity (${res.status})`);
      }
      
      const newEntity = await res.json();
      onEntityCreated(newEntity);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create entity');
    } finally {
      setSubmitting(false);
    }
  };

  // Get the schema fields from the template
  const schemaFields = template.schema || [];

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Create New {template.name}</h2>
        {error && <p className="error">{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <label>
            Name:
            <input
              type="text"
              value={name}
              disabled={submitting}
              onChange={e => setName(e.target.value)}
              required
            />
          </label>
          
          {schemaFields.map(field => {
            const fieldKey = field.name;
            const value = formData[fieldKey] || '';

            if (field.type === 'computed') return null; // not yet
            
            switch (field.type) {
              case 'string':
                return (
                  <label key={fieldKey}>
                    {field.name}:
                    <input
                      type="text"
                      value={value}
                      disabled={submitting}
                      onChange={e => handleChange(fieldKey, e.target.value)}
                    />
                  </label>
                );
              case 'number':
                return (
                  <label key={fieldKey}>
                    {field.name}:
                    <input
                      type="number"
                      value={value}
                      disabled={submitting}
                      onChange={e => handleChange(fieldKey, Number(e.target.value))}
                    />
                  </label>
                );
              case 'boolean':
                return (
                  <label key={fieldKey} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!!value}
                      disabled={submitting}
                      onChange={e => handleChange(fieldKey, e.target.checked)}
                    />
                    {field.name}
                  </label>
                );
              case 'select':
                return (
                  <label key={fieldKey}>
                    {field.name}:
                    <select
                      value={value}
                      disabled={submitting}
                      onChange={e => handleChange(fieldKey, e.target.value)}
                    >
                      <option value="">-- select --</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </label>
                );
              case 'multiselect':
                return (
                  <fieldset key={fieldKey} className="multiselect-fieldset">
                    <legend>{field.name}:</legend>
                    {field.options?.map(opt => (
                      <label key={opt} className="checkbox-label">
                        <input
                          type="checkbox"
                          disabled={submitting}
                          checked={Array.isArray(value) && value.includes(opt)}
                          onChange={e => {
                            const current = Array.isArray(value) ? [...value] : [];
                            if (e.target.checked) current.push(opt);
                            else {
                              const idx = current.indexOf(opt);
                              if (idx > -1) current.splice(idx, 1);
                            }
                            handleChange(fieldKey, current);
                          }}
                        />
                        {opt}
                      </label>
                    ))}
                  </fieldset>
                );
              default:
                return null;
            }
          })}
          
          <div className="modal-actions">
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Entity'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEntityModal;
