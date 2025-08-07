import React, { useState } from 'react';

/**
 * ConfirmDeleteModal - Modal component for confirming deletions
 * 
 * @param {string} title - The title of the modal
 * @param {string} message - The confirmation message
 * @param {string} itemName - The name of the item being deleted
 * @param {function} onConfirm - Callback when deletion is confirmed
 * @param {function} onCancel - Callback when deletion is cancelled
 */
function ConfirmDeleteModal({ title, message, itemName, onConfirm, onCancel }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error('Error during deletion:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="cosmic-modal" onClick={onCancel}>
      <div className="cosmic-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cosmic-modal-header">
          <h2>{title}</h2>
        </div>
        
        <div style={{ padding: 'var(--cosmic-space-lg) 0' }}>
          <div className="cosmic-alert cosmic-alert-warning" style={{ marginBottom: 'var(--cosmic-space-lg)' }}>
            <strong>⚠️ Warning:</strong> This action cannot be undone.
          </div>
          
          <p style={{ margin: '0 0 var(--cosmic-space-md) 0', fontSize: '1rem', lineHeight: 1.6 }}>
            {message}
          </p>
          
          {itemName && (
            <p style={{ 
              margin: 0, 
              padding: 'var(--cosmic-space-sm)', 
              background: 'var(--cosmic-bg-light)', 
              borderRadius: 'var(--cosmic-radius)', 
              fontWeight: 600,
              color: 'var(--cosmic-text-dark)'
            }}>
              "{itemName}"
            </p>
          )}
        </div>
        
        <div className="cosmic-modal-actions">
          <button 
            type="button" 
            className="cosmic-btn cosmic-btn-secondary" 
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="cosmic-btn cosmic-btn-danger"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal;
