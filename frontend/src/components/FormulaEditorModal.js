// components/FormulaEditorModal.jsx
import React, { useState, useEffect } from 'react';

/**
 * FormulaEditorModal - A modal for editing computed field formulas
 * 
 * This component provides a rich text editor for creating JavaScript formulas
 * that will be executed when entities are created or updated.
 * 
 * @param {string} initialFormula - The current formula to edit
 * @param {function} onSave - Callback when formula is saved
 * @param {function} onClose - Callback when modal is closed
 * @param {string} fieldName - Name of the field being edited
 * @param {Array} templateFields - Array of field objects from the template schema
 */
function FormulaEditorModal({ initialFormula, onSave, onClose, fieldName, templateFields = [] }) {
  const [formula, setFormula] = useState(initialFormula || '');

  // Example formulas to help users understand the syntax
  const formulaExamples = {
    basic: `
// Basic arithmetic example
attack * 1.5 + defense
`.trim(),
    
    conditional: `
// Conditional logic example
level > 50 ? 'Legendary' : 'Common'
`.trim(),
    
    complex: `
// Complex calculation with multiple fields
(() => {
  const basePower = attack + defense;
  const levelBonus = level * 0.1;
  const typeBonus = type === 'Fire' ? 1.2 : 1.0;
  return Math.round(basePower * levelBonus * typeBonus);
})()
`.trim(),
    
    weaknesses: `
// Elemental weaknesses calculation
(() => {
  const weaknessMap = {
    Fire: ['Water', 'Earth'],
    Grass: ['Fire', 'Ice'],
    Water: ['Electric', 'Grass'],
    Electric: ['Earth'],
    Ice: ['Fire'],
    Earth: ['Water', 'Grass', 'Ice']
  };
  return weaknessMap[type] || [];
})()
`.trim(),
    
    validation: `
// Input validation example
(() => {
  if (health < 0) return 0;
  if (health > maxHealth) return maxHealth;
  return health;
})()
`.trim()
  };

  // Get available variables from template fields (excluding computed fields and the current field)
  const availableVariables = templateFields
    .filter(field => 
      field.type !== 'computed' && 
      field.name !== fieldName && 
      field.name.trim() !== ''
    )
    .map(field => field.name);

  /**
   * Initialize formula when component mounts or initialFormula changes
   */
  useEffect(() => {
    setFormula(initialFormula || '');
  }, [initialFormula]);

  /**
   * Handle saving the formula
   */
  const handleSave = () => {
    onSave(formula);
    onClose();
  };

  /**
   * Insert an example formula into the editor
   */
  const insertExample = (exampleKey) => {
    setFormula(formulaExamples[exampleKey]);
  };

  /**
   * Insert a variable name into the formula
   */
  const insertVariable = (variable) => {
    setFormula(prev => prev + variable);
  };

  return (
    <div className="modal">
      <div className="modal-content large">
        <h2>Edit Formula for "{fieldName}"</h2>
        
        <div className="formula-editor">
          {/* Formula Input */}
          <div className="formula-input-section">
            <label>
              <strong>Formula (JavaScript):</strong>
              <textarea
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                rows={8}
                placeholder="Enter your JavaScript formula here..."
                className="formula-textarea"
              />
            </label>
          </div>

          {/* Available Variables */}
          <div className="variables-section">
            <h4>Available Variables:</h4>
            {availableVariables.length > 0 ? (
              <div className="variable-buttons">
                {availableVariables.map(variable => (
                  <button
                    key={variable}
                    type="button"
                    className="variable-btn"
                    onClick={() => insertVariable(variable)}
                    title={`Insert ${variable} variable`}
                  >
                    {variable}
                  </button>
                ))}
              </div>
            ) : (
              <p className="no-variables">
                No other fields available. Add more fields to your template to use them in formulas.
              </p>
            )}
          </div>

          {/* Formula Examples */}
          <div className="examples-section">
            <h4>Formula Examples:</h4>
            <div className="example-buttons">
              <button
                type="button"
                className="example-btn"
                onClick={() => insertExample('basic')}
              >
                Basic Math
              </button>
              <button
                type="button"
                className="example-btn"
                onClick={() => insertExample('conditional')}
              >
                Conditional Logic
              </button>
              <button
                type="button"
                className="example-btn"
                onClick={() => insertExample('complex')}
              >
                Complex Calculation
              </button>
              <button
                type="button"
                className="example-btn"
                onClick={() => insertExample('weaknesses')}
              >
                Elemental Weaknesses
              </button>
              <button
                type="button"
                className="example-btn"
                onClick={() => insertExample('validation')}
              >
                Input Validation
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div className="help-section">
            <h4>💡 Tips:</h4>
            <ul className="help-list">
              <li>Use JavaScript syntax for your formulas</li>
              <li>Access other field values by their field names</li>
              <li>Use <code>{'() => {}'}</code> for complex calculations</li>
              <li>Return the final value you want to store</li>
              <li>Test your formula with different field values</li>
              {availableVariables.length === 0 && (
                <li><strong>Note:</strong> Add more fields to your template to use them in formulas</li>
              )}
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button className="btn" onClick={handleSave}>
            Save Formula
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default FormulaEditorModal;
