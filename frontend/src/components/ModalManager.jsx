import React from 'react';

function ModalManager({ view, error, formData, onClose, onChange, onCreate, onUpdate, onDelete }) {
  if (view === 'none') return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {view === 'delete' && (
          <>
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete this chat? All messages will be lost.</p>
            <div className="modal-actions">
              <button onClick={onClose} className="modal-btn cancel-btn">
                Cancel
              </button>
              <button onClick={onDelete} className="modal-btn delete-btn">
                Delete
              </button>
            </div>
          </>
        )}

        {(view === 'create' || view === 'edit') && (
          <>
            <h2>{view === 'create' ? 'Create New Chat' : 'Edit Chat'}</h2>
            <form
              className="modal-form"
              onSubmit={view === 'create' ? onCreate : onUpdate}
            >
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={onChange}
                  required
                />
              </div>
              {error && <p className="modal-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" onClick={onClose} className="modal-btn cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="modal-btn submit-btn">
                  {view === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ModalManager;
